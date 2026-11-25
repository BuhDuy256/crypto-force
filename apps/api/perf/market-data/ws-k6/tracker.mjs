export const WORKLOAD_CHANNELS = [
  { kind: 'kline', pair: 'BTCUSDT', timeframe: '1m' },
  { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' },
  { kind: 'kline', pair: 'ETHUSDT', timeframe: '1m' },
  { kind: 'kline', pair: 'SOLUSDT', timeframe: '1m' },
  { kind: 'summary', pair: 'BTCUSDT' },
];

const PAIRS = new Set(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
const TIMEFRAMES = new Set(['1m', '5m', '15m', '1h', '4h', '1d']);
const SUMMARY_PRICE_BASE = 60_000;
const SUMMARY_SEQ_SCALE = 100;
const MAX_MISSING_SEQS = 50;

function channelKey(channel) {
  return channel.kind === 'kline'
    ? `kline:${channel.pair}:${channel.timeframe}`
    : `summary:${channel.pair}`;
}

function isTimestamp(value) {
  return Number.isInteger(value) && value >= 0;
}

function isPositiveFinite(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function readCandleFrame(message) {
  if (!PAIRS.has(message.pair) || !TIMEFRAMES.has(message.timeframe)) return null;
  if (!isTimestamp(message.dataTime)) return null;
  if (message.sourceTime !== undefined && !isTimestamp(message.sourceTime)) return null;
  const candle = message.candle;
  if (typeof candle !== 'object' || candle === null) return null;
  const { openTime, open, high, low, close, volume, isClosed } = candle;
  if (!isTimestamp(openTime)) return null;
  if (![open, high, low, close].every(isPositiveFinite)) return null;
  if (!Number.isInteger(volume) || volume < 0) return null;
  if (typeof isClosed !== 'boolean') return null;
  if (high < Math.max(open, close, low) || low > Math.min(open, close)) return null;
  return {
    key: `kline:${message.pair}:${message.timeframe}`,
    seq: Math.round(volume),
    dataTime: message.dataTime,
    sourceTime: message.sourceTime,
  };
}

function readSummaryFrame(message) {
  const summary = message.summary;
  if (typeof summary !== 'object' || summary === null) return null;
  if (!PAIRS.has(summary.pair)) return null;
  if (!isPositiveFinite(summary.lastPrice)) return null;
  if (typeof summary.change24hPercent !== 'number') return null;
  if (!Number.isFinite(summary.change24hPercent)) return null;
  if (!isTimestamp(summary.dataTime)) return null;
  if (message.sourceTime !== undefined && !isTimestamp(message.sourceTime)) return null;
  return {
    key: `summary:${summary.pair}`,
    seq: Math.round((summary.lastPrice - SUMMARY_PRICE_BASE) * SUMMARY_SEQ_SCALE),
    dataTime: summary.dataTime,
    sourceTime: message.sourceTime,
  };
}

function emptyChannel() {
  return {
    seen: new Set(),
    duplicates: 0,
    outOfOrder: 0,
    minSeq: null,
    maxSeq: null,
  };
}

function missingInternalSeqs(channel) {
  const missing = [];
  if (channel.minSeq === null || channel.maxSeq === null) return missing;
  for (let seq = channel.minSeq; seq <= channel.maxSeq; seq += 1) {
    if (missing.length === MAX_MISSING_SEQS) break;
    if (!channel.seen.has(seq)) missing.push(seq);
  }
  return missing;
}

export function extractCookieHeader(setCookieHeader) {
  if (setCookieHeader === undefined || setCookieHeader === null) return null;
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const pairs = [];
  for (const header of headers) {
    if (typeof header !== 'string') continue;
    const pair = header.split(';')[0]?.trim();
    if (pair) pairs.push(pair);
  }
  return pairs.length > 0 ? pairs.join('; ') : null;
}

export function createVuTracker(vu) {
  const channels = new Map();
  for (const channel of WORKLOAD_CHANNELS) channels.set(channelKey(channel), emptyChannel());

  let subscribedAck = false;
  let steadyMessages = 0;
  let duplicateMessages = 0;
  let outOfOrderMessages = 0;
  let invalidMessages = 0;
  let serverErrorCount = 0;
  let heartbeatCount = 0;
  let statusCount = 0;

  function channelFor(key) {
    const existing = channels.get(key);
    if (existing) return existing;
    const created = emptyChannel();
    channels.set(key, created);
    return created;
  }

  function trackSteady(kind, frame, recvAtMs) {
    steadyMessages += 1;
    const channel = channelFor(frame.key);
    const duplicate = channel.seen.has(frame.seq);
    let outOfOrder = false;
    if (duplicate) {
      duplicateMessages += 1;
      channel.duplicates += 1;
    } else {
      channel.seen.add(frame.seq);
      outOfOrder = channel.maxSeq !== null && frame.seq < channel.maxSeq;
      if (outOfOrder) {
        outOfOrderMessages += 1;
        channel.outOfOrder += 1;
      }
    }
    channel.minSeq = channel.minSeq === null ? frame.seq : Math.min(channel.minSeq, frame.seq);
    channel.maxSeq = channel.maxSeq === null ? frame.seq : Math.max(channel.maxSeq, frame.seq);
    const backendToClientMs = Math.max(0, recvAtMs - frame.dataTime);
    const sourceToClientMs =
      frame.sourceTime === undefined ? null : Math.max(0, recvAtMs - frame.sourceTime);
    return {
      kind,
      isSteady: true,
      seq: frame.seq,
      duplicate,
      outOfOrder,
      backendToClientMs,
      sourceToClientMs,
    };
  }

  function onMessage(rawText, recvAtMs) {
    let message;
    try {
      message = JSON.parse(rawText);
    } catch {
      invalidMessages += 1;
      return { kind: 'invalid', isSteady: false };
    }
    if (typeof message !== 'object' || message === null) {
      invalidMessages += 1;
      return { kind: 'invalid', isSteady: false };
    }

    if (message.type === 'subscribed') {
      if (!Array.isArray(message.channels) || message.channels.length !== 5) {
        invalidMessages += 1;
        return { kind: 'invalid', isSteady: false };
      }
      subscribedAck = true;
      return { kind: 'subscribed', isSteady: false };
    }

    if (message.type === 'unsubscribed') {
      if (!Array.isArray(message.channels)) {
        invalidMessages += 1;
        return { kind: 'invalid', isSteady: false };
      }
      return { kind: 'unsubscribed', isSteady: false };
    }

    if (message.type === 'heartbeat') {
      if (!isTimestamp(message.serverTime)) {
        invalidMessages += 1;
        return { kind: 'invalid', isSteady: false };
      }
      heartbeatCount += 1;
      return { kind: 'heartbeat', isSteady: false };
    }

    if (message.type === 'status') {
      const validUpstream = message.upstream === 'available' || message.upstream === 'unavailable';
      if (
        !validUpstream ||
        typeof message.resyncRequired !== 'boolean' ||
        !isTimestamp(message.serverTime)
      ) {
        invalidMessages += 1;
        return { kind: 'invalid', isSteady: false };
      }
      statusCount += 1;
      return { kind: 'status', isSteady: false };
    }

    if (message.type === 'error') {
      if (typeof message.code !== 'string' || typeof message.message !== 'string') {
        invalidMessages += 1;
        return { kind: 'invalid', isSteady: false };
      }
      serverErrorCount += 1;
      return { kind: 'error', isSteady: false };
    }

    const frame =
      message.type === 'candle'
        ? readCandleFrame(message)
        : message.type === 'summary'
          ? readSummaryFrame(message)
          : null;
    if (frame === null) {
      invalidMessages += 1;
      return { kind: 'invalid', isSteady: false };
    }
    if (frame.seq < 1) {
      return { kind: message.type, isSteady: false, seq: frame.seq };
    }
    return trackSteady(message.type, frame, recvAtMs);
  }

  function snapshot(closeCode, closeReason) {
    const channelReports = {};
    let uniqueSteadyMessages = 0;
    for (const [key, channel] of channels) {
      uniqueSteadyMessages += channel.seen.size;
      channelReports[key] = {
        uniqueCount: channel.seen.size,
        duplicates: channel.duplicates,
        outOfOrder: channel.outOfOrder,
        minSeq: channel.minSeq,
        maxSeq: channel.maxSeq,
        missingInternalSeqs: missingInternalSeqs(channel),
      };
    }
    return {
      vu,
      subscribedAck,
      closeCode,
      closeReason,
      steadyMessages,
      uniqueSteadyMessages,
      duplicateMessages,
      outOfOrderMessages,
      invalidMessages,
      serverErrorCount,
      heartbeatCount,
      statusCount,
      channels: channelReports,
    };
  }

  return { onMessage, snapshot };
}
