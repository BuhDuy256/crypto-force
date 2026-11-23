import {
  wsServerMessageSchema,
  type MarketChannel,
  type WsServerMessage,
} from '@crypto-force/shared';

export function getMarketDataWsUrl(
  locationObj: Pick<Location, 'protocol' | 'host'> = window.location,
): string {
  const protocol = locationObj.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${locationObj.host}/api/market-data/ws`;
}

export interface MarketDataWsClient {
  subscribe(channels: MarketChannel[]): void;
  unsubscribe(channels: MarketChannel[]): void;
  close(code?: number, reason?: string): void;
  isOpen(): boolean;
}

export function createMarketDataWsClient({
  url = getMarketDataWsUrl(),
  onOpen,
  onMessage,
  onInvalidFrame,
  onClose,
}: {
  url?: string;
  onOpen: () => void;
  onMessage: (message: WsServerMessage) => void;
  onInvalidFrame?: () => void;
  onClose: (event: { code: number; reason: string; wasOpen: boolean }) => void;
}): MarketDataWsClient {
  const ws = new WebSocket(url);
  let wasOpen = false;
  let closedByCaller = false;

  ws.addEventListener('open', () => {
    if (closedByCaller) {
      ws.close(1000);
      return;
    }
    wasOpen = true;
    onOpen();
  });

  ws.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') {
      onInvalidFrame?.();
      return;
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(event.data);
    } catch {
      onInvalidFrame?.();
      return;
    }
    const validated = wsServerMessageSchema.safeParse(parsedJson);
    if (!validated.success) {
      onInvalidFrame?.();
      return;
    }
    onMessage(validated.data);
  });

  ws.addEventListener('close', (event) => {
    onClose({ code: event.code, reason: event.reason, wasOpen });
  });

  return {
    subscribe(channels) {
      if (channels.length === 0 || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'subscribe', channels }));
    },
    unsubscribe(channels) {
      if (channels.length === 0 || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'unsubscribe', channels }));
    },
    close(code = 1000, reason) {
      closedByCaller = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(code, reason);
      }
    },
    isOpen() {
      return ws.readyState === WebSocket.OPEN;
    },
  };
}
