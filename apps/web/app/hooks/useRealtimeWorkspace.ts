import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CandleHistory,
  MarketChannel,
  MarketPair,
  MarketSummary,
  MarketTimeframe,
  WsServerMessage,
} from '@crypto-force/shared';
import { getSession } from '~/api/auth';
import { getCandleHistory, getMarketSummary, MarketDataRequestError } from '~/api/market-data';
import { createMarketDataWsClient, type MarketDataWsClient } from '~/api/market-data-ws';
import {
  mergeCandleEvent,
  reconcileSnapshotWithBuffer,
  type LiveCandleEvent,
} from '~/utils/market-candle-merge';

const STALE_THRESHOLD_MS = 15_000;
const RESET_THRESHOLD_MS = 30_000;
const RETRY_CAP_MS = 120_000;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 16_000;
const MAX_BUFFER_CAP = 51;

export type RealtimeConnectionState =
  | 'syncing'
  | 'live'
  | 'stale'
  | 'reconnecting'
  | 'disconnected'
  | 'unavailable'
  | 'partial_sync'
  | 'paused'
  | 'limit_exceeded';

function channelKey(channel: MarketChannel): string {
  return channel.kind === 'kline'
    ? `kline:${channel.pair}:${channel.timeframe}`
    : `summary:${channel.pair}`;
}

function buildDesiredChannels(
  pair: MarketPair,
  visibleSlots: { id: number; timeframe: MarketTimeframe }[],
): MarketChannel[] {
  const seen = new Set<string>();
  const channels: MarketChannel[] = [];
  for (const slot of visibleSlots) {
    const channel: MarketChannel = { kind: 'kline', pair, timeframe: slot.timeframe };
    const key = channelKey(channel);
    if (!seen.has(key)) {
      seen.add(key);
      channels.push(channel);
    }
  }
  channels.push({ kind: 'summary', pair });
  return channels;
}

export function useRealtimeWorkspace() {
  const client = useQueryClient();
  const { revalidate } = useRevalidator();
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pair, setPairState] = useState<MarketPair>('BTCUSDT');
  const [chartCount, setChartCountState] = useState<1 | 2 | 4>(4);
  const [slots, setSlots] = useState<{ id: number; timeframe: MarketTimeframe }[]>([
    // Default selection: BTCUSDT on 4 charts at 5m, 15m, 1h, 4h (docs/UCs/market-data.md, MK-31).
    { id: 1, timeframe: '5m' },
    { id: 2, timeframe: '15m' },
    { id: 3, timeframe: '1h' },
    { id: 4, timeframe: '4h' },
  ]);

  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('syncing');
  const [disconnectedAt, setDisconnectedAt] = useState<number | null>(null);
  const [isConnectingManual, setIsConnectingManual] = useState(false);

  const live = pausedAt === null;
  const visibleSlots = useMemo(() => slots.slice(0, chartCount), [slots, chartCount]);
  const desiredChannels = useMemo(
    () => buildDesiredChannels(pair, visibleSlots),
    [pair, visibleSlots],
  );

  const wsRef = useRef<MarketDataWsClient | null>(null);
  const subscribedChannelsRef = useRef<Map<string, MarketChannel>>(new Map());
  const desiredChannelsRef = useRef<MarketChannel[]>(desiredChannels);
  const pairRef = useRef<MarketPair>(pair);
  const visibleSlotsRef = useRef(visibleSlots);
  const liveRef = useRef(live);

  const hasConnectedOnceRef = useRef(false);
  const wsOpenRef = useRef(false);
  const upstreamAvailableRef = useRef(true);
  const isBackfillingRef = useRef(false);
  const hasPartialSyncErrorRef = useRef(false);
  const limitExceededRef = useRef(false);
  const sessionExpiredRef = useRef(false);
  const lastSignalMonoRef = useRef<number>(0);
  const disconnectStartMonoRef = useRef<number | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backfillAbortRef = useRef<AbortController | null>(null);
  const backfillEpochRef = useRef(0);
  const connectWebSocketRef = useRef<(isReconnectAttempt: boolean) => void>(() => undefined);

  const candleBuffersRef = useRef<Map<string, LiveCandleEvent[]>>(new Map());
  const syncingChannelsRef = useRef<Set<string>>(new Set());
  const incompleteChannelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    desiredChannelsRef.current = desiredChannels;
    pairRef.current = pair;
    visibleSlotsRef.current = visibleSlots;
    liveRef.current = live;
  }, [desiredChannels, live, pair, visibleSlots]);

  const clearRetryTimers = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (retryCapTimerRef.current !== null) {
      clearTimeout(retryCapTimerRef.current);
      retryCapTimerRef.current = null;
    }
  }, []);

  const evaluateReadyState = useCallback(() => {
    if (!liveRef.current) {
      setConnectionState('paused');
      return;
    }
    if (limitExceededRef.current) {
      setConnectionState('limit_exceeded');
      return;
    }
    if (!upstreamAvailableRef.current && wsOpenRef.current) {
      setConnectionState('unavailable');
      return;
    }
    if (!wsOpenRef.current) {
      if (
        disconnectStartMonoRef.current !== null &&
        performance.now() - disconnectStartMonoRef.current >= RETRY_CAP_MS
      ) {
        setConnectionState('disconnected');
      } else if (hasConnectedOnceRef.current || disconnectStartMonoRef.current !== null) {
        setConnectionState('reconnecting');
      } else {
        setConnectionState('syncing');
      }
      return;
    }
    if (isBackfillingRef.current) {
      setConnectionState('syncing');
      return;
    }

    const currentPair = pairRef.current;
    const currentSlots = visibleSlotsRef.current;
    for (const slot of currentSlots) {
      const qState = client.getQueryState<CandleHistory>([
        'market-data',
        'candles',
        currentPair,
        slot.timeframe,
      ]);
      if (!qState || (qState.fetchStatus === 'fetching' && qState.data === undefined)) {
        setConnectionState('syncing');
        return;
      }
      if (qState.data === undefined && qState.status === 'pending') {
        setConnectionState('syncing');
        return;
      }
    }
    const sumState = client.getQueryState<MarketSummary>(['market-data', 'summary', currentPair]);
    if (!sumState || (sumState.fetchStatus === 'fetching' && sumState.data === undefined)) {
      setConnectionState('syncing');
      return;
    }

    // Reconcile any buffered candle events collected during initial REST load.
    for (const slot of currentSlots) {
      const key = `kline:${currentPair}:${slot.timeframe}`;
      const buffered = candleBuffersRef.current.get(key);
      const snapshot = client.getQueryData<CandleHistory>([
        'market-data',
        'candles',
        currentPair,
        slot.timeframe,
      ]);
      if (snapshot && buffered && buffered.length > 0) {
        candleBuffersRef.current.delete(key);
        const reconciled = reconcileSnapshotWithBuffer(snapshot, buffered);
        if (reconciled.kind === 'ready') {
          client.setQueryData(
            ['market-data', 'candles', currentPair, slot.timeframe],
            reconciled.history,
          );
        }
      }
      syncingChannelsRef.current.delete(key);
    }

    if (hasPartialSyncErrorRef.current) {
      setConnectionState('partial_sync');
      return;
    }

    const silentMs = performance.now() - lastSignalMonoRef.current;
    if (silentMs >= STALE_THRESHOLD_MS) {
      setConnectionState('stale');
      return;
    }
    setConnectionState('live');
  }, [client]);

  const runBackfill = useCallback(async () => {
    if (!liveRef.current || sessionExpiredRef.current) return;
    backfillAbortRef.current?.abort();
    const controller = new AbortController();
    backfillAbortRef.current = controller;
    backfillEpochRef.current += 1;
    const epoch = backfillEpochRef.current;
    const isStaleRun = () => controller.signal.aborted || epoch !== backfillEpochRef.current;

    const targetPair = pairRef.current;
    const targetSlots = visibleSlotsRef.current;
    const uniqueTimeframes = [...new Set(targetSlots.map((slot) => slot.timeframe))];

    isBackfillingRef.current = true;
    hasPartialSyncErrorRef.current = false;
    incompleteChannelsRef.current.clear();
    for (const timeframe of uniqueTimeframes) {
      const key = `kline:${targetPair}:${timeframe}`;
      syncingChannelsRef.current.add(key);
      candleBuffersRef.current.set(key, []);
    }
    setConnectionState('syncing');

    let sawFailure = false;
    const tasks: Promise<void>[] = uniqueTimeframes.map(async (timeframe) => {
      const key = `kline:${targetPair}:${timeframe}`;
      const queryKey = ['market-data', 'candles', targetPair, timeframe];
      try {
        let snapshot = await getCandleHistory({ pair: targetPair, timeframe }, controller.signal);
        if (isStaleRun()) return;
        const buffered = candleBuffersRef.current.get(key) ?? [];
        candleBuffersRef.current.delete(key);
        let reconciled = reconcileSnapshotWithBuffer(snapshot, buffered);
        if (reconciled.kind === 'resync-required') {
          candleBuffersRef.current.set(key, []);
          snapshot = await getCandleHistory({ pair: targetPair, timeframe }, controller.signal);
          if (isStaleRun()) return;
          const retryBuffered = candleBuffersRef.current.get(key) ?? [];
          candleBuffersRef.current.delete(key);
          reconciled = reconcileSnapshotWithBuffer(snapshot, retryBuffered);
        }
        syncingChannelsRef.current.delete(key);
        if (reconciled.kind === 'ready') {
          const current = client.getQueryData<CandleHistory>(queryKey);
          if (!current || reconciled.history.dataTime >= current.dataTime) {
            client.setQueryData(queryKey, reconciled.history);
          }
        } else {
          sawFailure = true;
          incompleteChannelsRef.current.add(key);
        }
      } catch (error) {
        if (isStaleRun()) return;
        candleBuffersRef.current.delete(key);
        syncingChannelsRef.current.delete(key);
        if (error instanceof MarketDataRequestError && error.code === 'UNAUTHENTICATED') {
          sessionExpiredRef.current = true;
          void revalidate();
          return;
        }
        sawFailure = true;
        incompleteChannelsRef.current.add(key);
      }
    });

    tasks.push(
      (async () => {
        const queryKey = ['market-data', 'summary', targetPair];
        try {
          const incoming = await getMarketSummary(targetPair, controller.signal);
          if (isStaleRun()) return;
          const current = client.getQueryData<MarketSummary>(queryKey);
          if (!current || incoming.dataTime >= current.dataTime) {
            client.setQueryData(queryKey, incoming);
          }
        } catch (error) {
          if (isStaleRun()) return;
          if (error instanceof MarketDataRequestError && error.code === 'UNAUTHENTICATED') {
            sessionExpiredRef.current = true;
            void revalidate();
            return;
          }
          if (client.getQueryData<MarketSummary>(queryKey) !== undefined) {
            sawFailure = true;
          }
        }
      })(),
    );

    await Promise.all(tasks);
    if (isStaleRun()) return;
    isBackfillingRef.current = false;
    hasPartialSyncErrorRef.current = sawFailure;
    evaluateReadyState();
  }, [client, evaluateReadyState, revalidate]);

  const handleServerMessage = useCallback(
    (message: WsServerMessage) => {
      if (message.type !== 'error') {
        lastSignalMonoRef.current = performance.now();
      }

      switch (message.type) {
        case 'subscribed':
        case 'unsubscribed': {
          evaluateReadyState();
          return;
        }
        case 'heartbeat': {
          if (upstreamAvailableRef.current) {
            evaluateReadyState();
          }
          return;
        }
        case 'status': {
          if (message.upstream === 'unavailable') {
            upstreamAvailableRef.current = false;
            setConnectionState('unavailable');
            return;
          }
          upstreamAvailableRef.current = true;
          if (message.resyncRequired) {
            void runBackfill();
          } else {
            evaluateReadyState();
          }
          return;
        }
        case 'error': {
          if (message.code === 'CONNECTION_LIMIT_EXCEEDED' || message.code === 'RATE_LIMITED') {
            limitExceededRef.current = true;
            clearRetryTimers();
            setConnectionState('limit_exceeded');
          }
          return;
        }
        case 'summary': {
          if (message.summary.pair !== pairRef.current) return;
          const queryKey = ['market-data', 'summary', message.summary.pair];
          const current = client.getQueryData<MarketSummary>(queryKey);
          if (!current) return;
          if (message.summary.dataTime < current.dataTime) return;
          client.setQueryData(queryKey, message.summary);
          evaluateReadyState();
          return;
        }
        case 'candle': {
          if (message.pair !== pairRef.current) return;
          const key = `kline:${message.pair}:${message.timeframe}`;
          if (incompleteChannelsRef.current.has(key)) {
            return;
          }
          const queryKey = ['market-data', 'candles', message.pair, message.timeframe];
          const current = client.getQueryData<CandleHistory>(queryKey);
          if (syncingChannelsRef.current.has(key) || !current) {
            const qState = client.getQueryState<CandleHistory>(queryKey);
            // If initial REST load failed without data (MK-131), ignore live ticks until Retry succeeds.
            if (qState?.status === 'error' && !current) {
              return;
            }
            const buffer = candleBuffersRef.current.get(key) ?? [];
            if (buffer.length < MAX_BUFFER_CAP) {
              buffer.push({
                pair: message.pair,
                timeframe: message.timeframe,
                candle: message.candle,
                dataTime: message.dataTime,
                ...(message.sourceTime !== undefined ? { sourceTime: message.sourceTime } : {}),
              });
              candleBuffersRef.current.set(key, buffer);
            }
            return;
          }

          const merged = mergeCandleEvent(current, {
            pair: message.pair,
            timeframe: message.timeframe,
            candle: message.candle,
            dataTime: message.dataTime,
            ...(message.sourceTime !== undefined ? { sourceTime: message.sourceTime } : {}),
          });
          if (merged.kind === 'applied') {
            client.setQueryData(queryKey, merged.history);
            evaluateReadyState();
          } else if (merged.kind === 'resync-required') {
            void runBackfill();
          }
          return;
        }
      }
    },
    [clearRetryTimers, client, evaluateReadyState, runBackfill],
  );

  const connectWebSocket = useCallback(
    (isReconnectAttempt: boolean) => {
      if (!liveRef.current || limitExceededRef.current || sessionExpiredRef.current) return;
      clearRetryTimers();
      wsRef.current?.close(1000);
      subscribedChannelsRef.current.clear();

      const wsClient = createMarketDataWsClient({
        onOpen: () => {
          const needsBackfill = hasConnectedOnceRef.current || isReconnectAttempt;
          hasConnectedOnceRef.current = true;
          wsOpenRef.current = true;
          upstreamAvailableRef.current = true;
          retryAttemptRef.current = 0;
          disconnectStartMonoRef.current = null;
          setDisconnectedAt(null);
          setIsConnectingManual(false);
          lastSignalMonoRef.current = performance.now();
          clearRetryTimers();

          const channels = desiredChannelsRef.current;
          subscribedChannelsRef.current = new Map(
            channels.map((channel) => [channelKey(channel), channel]),
          );
          wsClient.subscribe(channels);

          if (needsBackfill) {
            void runBackfill();
          } else {
            evaluateReadyState();
          }
        },
        onMessage: handleServerMessage,
        onInvalidFrame: () => {
          // Invalid frames are dropped and must not reset the 15s/30s signal clock (MK-128).
        },
        onClose: ({ code, wasOpen }) => {
          if (wsRef.current !== wsClient) return;
          wsRef.current = null;
          wsOpenRef.current = false;
          subscribedChannelsRef.current.clear();
          setIsConnectingManual(false);

          if (code === 4401) {
            sessionExpiredRef.current = true;
            clearRetryTimers();
            void revalidate();
            return;
          }
          if (code === 4429 || limitExceededRef.current) {
            limitExceededRef.current = true;
            clearRetryTimers();
            setConnectionState('limit_exceeded');
            return;
          }
          if (!liveRef.current || code === 1000) {
            return;
          }

          if (!wasOpen && !hasConnectedOnceRef.current) {
            void getSession()
              .then((session) => {
                if (!session) {
                  sessionExpiredRef.current = true;
                  clearRetryTimers();
                  void revalidate();
                }
              })
              .catch(() => {
                // Network error during session check; proceed with backoff if connected before.
              });
          }

          const nowMono = performance.now();
          if (disconnectStartMonoRef.current === null) {
            disconnectStartMonoRef.current = nowMono;
            setDisconnectedAt(Date.now());
            const remainingToCap = RETRY_CAP_MS;
            retryCapTimerRef.current = setTimeout(() => {
              retryCapTimerRef.current = null;
              if (!wsOpenRef.current && liveRef.current) {
                if (retryTimerRef.current !== null) {
                  clearTimeout(retryTimerRef.current);
                  retryTimerRef.current = null;
                }
                setConnectionState('disconnected');
              }
            }, remainingToCap);
          }

          const elapsed = nowMono - disconnectStartMonoRef.current;
          if (elapsed >= RETRY_CAP_MS) {
            clearRetryTimers();
            setConnectionState('disconnected');
            return;
          }

          setConnectionState('reconnecting');
          const attempt = retryAttemptRef.current;
          retryAttemptRef.current += 1;
          const cap = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
          const delayMs = Math.max(200, Math.floor(cap * Math.random()));
          if (elapsed + delayMs >= RETRY_CAP_MS) {
            return;
          }
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            connectWebSocketRef.current(true);
          }, delayMs);
        },
      });

      wsRef.current = wsClient;
    },
    [clearRetryTimers, evaluateReadyState, handleServerMessage, revalidate, runBackfill],
  );

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  // Sync query cache updates to evaluate initial load completion and initial error unsubscribe (MK-131).
  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated') return;
      const typedQuery = event.query as {
        queryKey: readonly unknown[];
        state: { status: string; data: unknown };
      };
      const key = typedQuery.queryKey;
      if (key[0] !== 'market-data') return;

      if (
        key[1] === 'candles' &&
        key[2] === pairRef.current &&
        typeof key[3] === 'string' &&
        typedQuery.state.status === 'error' &&
        typedQuery.state.data === undefined
      ) {
        const failedTf = key[3] as MarketTimeframe;
        const chKey = `kline:${pairRef.current}:${failedTf}`;
        const existingChannel = subscribedChannelsRef.current.get(chKey);
        if (existingChannel && wsRef.current?.isOpen()) {
          subscribedChannelsRef.current.delete(chKey);
          wsRef.current.unsubscribe([existingChannel]);
        }
      }
      evaluateReadyState();
    });
    return unsubscribe;
  }, [client, evaluateReadyState]);

  // Open WebSocket on mount when live, and clean up on unmount.
  // Deferring initial socket creation by 0 ms prevents React StrictMode's synchronous
  // mount-unmount-remount cycle from sending a duplicate HTTP upgrade before cleanup runs.
  useEffect(() => {
    if (!live) return;
    lastSignalMonoRef.current = performance.now();
    const openTimer = setTimeout(() => {
      connectWebSocket(false);
    }, 0);
    return () => {
      clearTimeout(openTimer);
      clearRetryTimers();
      backfillAbortRef.current?.abort();
      const current = wsRef.current;
      wsRef.current = null;
      wsOpenRef.current = false;
      current?.close(1000);
    };
  }, [clearRetryTimers, connectWebSocket, live]);

  // Compute channel diff when pair, timeframe or chartCount changes while WebSocket is open.
  useEffect(() => {
    const ws = wsRef.current;
    if (!live || !ws || !ws.isOpen()) {
      evaluateReadyState();
      return;
    }
    const currentMap = subscribedChannelsRef.current;
    const nextMap = new Map(desiredChannels.map((channel) => [channelKey(channel), channel]));

    const toUnsubscribe: MarketChannel[] = [];
    for (const [key, channel] of currentMap) {
      if (!nextMap.has(key)) {
        toUnsubscribe.push(channel);
        currentMap.delete(key);
        candleBuffersRef.current.delete(key);
        syncingChannelsRef.current.delete(key);
      }
    }

    const toSubscribe: MarketChannel[] = [];
    for (const [key, channel] of nextMap) {
      if (!currentMap.has(key)) {
        toSubscribe.push(channel);
        currentMap.set(key, channel);
        if (channel.kind === 'kline') {
          syncingChannelsRef.current.add(key);
          candleBuffersRef.current.set(key, []);
        }
      }
    }

    if (toUnsubscribe.length > 0) ws.unsubscribe(toUnsubscribe);
    if (toSubscribe.length > 0) ws.subscribe(toSubscribe);
    evaluateReadyState();
  }, [desiredChannels, evaluateReadyState, live]);

  // 15s stale detection and 30s stream reset on monotonic clock (MK-98, MK-99, MK-140).
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      if (!liveRef.current || !wsOpenRef.current || !upstreamAvailableRef.current) return;
      const silentMs = performance.now() - lastSignalMonoRef.current;
      if (silentMs >= RESET_THRESHOLD_MS) {
        const current = wsRef.current;
        wsRef.current = null;
        wsOpenRef.current = false;
        current?.close(4000, 'Stream silence reset');
        disconnectStartMonoRef.current ??= performance.now();
        setDisconnectedAt((prev) => prev ?? Date.now());
        setConnectionState('reconnecting');
        connectWebSocket(true);
        return;
      }
      if (silentMs >= STALE_THRESHOLD_MS) {
        setConnectionState((prev) => (prev === 'live' ? 'stale' : prev));
      }
    }, 1_000);
    return () => {
      clearInterval(timer);
    };
  }, [connectWebSocket, live]);

  // Fast reconnect on browser 'online' event and tab visibility restoration (MK-101, MK-126).
  useEffect(() => {
    const handleOnline = () => {
      if (!liveRef.current || wsOpenRef.current || limitExceededRef.current) return;
      clearRetryTimers();
      const jitter = Math.floor(Math.random() * 500);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        connectWebSocket(true);
      }, jitter);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !liveRef.current) return;
      const silentMs = performance.now() - lastSignalMonoRef.current;
      if (!wsOpenRef.current) {
        connectWebSocket(true);
      } else if (silentMs >= STALE_THRESHOLD_MS || hasPartialSyncErrorRef.current) {
        void runBackfill();
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearRetryTimers, connectWebSocket, runBackfill]);

  function setTimeframe(id: number, timeframe: MarketTimeframe) {
    setSlots((current) => {
      const next = current.map((slot) => (slot.id === id ? { ...slot, timeframe } : slot));
      visibleSlotsRef.current = next.slice(0, chartCount);
      desiredChannelsRef.current = buildDesiredChannels(pairRef.current, visibleSlotsRef.current);
      return next;
    });
  }

  function setPair(nextPair: MarketPair) {
    if (nextPair === pair) return;
    backfillAbortRef.current?.abort();
    candleBuffersRef.current.clear();
    syncingChannelsRef.current.clear();
    incompleteChannelsRef.current.clear();
    hasPartialSyncErrorRef.current = false;
    pairRef.current = nextPair;
    desiredChannelsRef.current = buildDesiredChannels(nextPair, visibleSlotsRef.current);
    setPairState(nextPair);
  }

  function setChartCount(nextCount: 1 | 2 | 4) {
    visibleSlotsRef.current = slots.slice(0, nextCount);
    desiredChannelsRef.current = buildDesiredChannels(pairRef.current, visibleSlotsRef.current);
    setChartCountState(nextCount);
  }

  function toggleLive() {
    if (pausedAt === null) {
      liveRef.current = false;
      clearRetryTimers();
      backfillAbortRef.current?.abort();
      isBackfillingRef.current = false;
      const current = wsRef.current;
      wsRef.current = null;
      wsOpenRef.current = false;
      subscribedChannelsRef.current.clear();
      current?.close(1000, 'Paused by user');
      setPausedAt(Date.now());
      setConnectionState('paused');
      return;
    }
    liveRef.current = true;
    limitExceededRef.current = false;
    disconnectStartMonoRef.current = null;
    setDisconnectedAt(null);
    setPausedAt(null);
    setConnectionState('syncing');
    if (document.visibilityState !== 'hidden') {
      queueMicrotask(() => {
        void runBackfill();
      });
    }
  }

  function reconnectNow() {
    if (isConnectingManual || !live) return;
    setIsConnectingManual(true);
    limitExceededRef.current = false;
    disconnectStartMonoRef.current = performance.now();
    retryAttemptRef.current = 0;
    connectWebSocket(true);
  }

  function resyncNow() {
    if (!live || isBackfillingRef.current) return;
    void runBackfill();
  }

  return {
    live,
    pausedAt,
    connectionState,
    disconnectedAt,
    isConnectingManual,
    toggleLive,
    reconnectNow,
    resyncNow,
    pair,
    setPair,
    chartCount,
    setChartCount,
    slots: visibleSlots,
    setTimeframe,
  };
}
