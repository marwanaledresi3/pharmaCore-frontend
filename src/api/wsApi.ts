/**
 * عميل WebSocket — يتصل بـ ws://host/ws مع JWT.
 * يعيد كائن مع subscribe/unsubscribe.
 */

export interface WsMessage {
  type: 'connected' | 'notification' | 'pong' | string;
  data?: any;
  timestamp?: string;
  ts?: number;
}

type Listener = (msg: WsMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private url: string;
  private token: string;
  private shouldReconnect = true;

  constructor(token: string, baseUrl?: string) {
  this.token = token;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // اقرأ من VITE_API_URL
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

  let wsUrl = '';
  try {
    const parsed = new URL(apiUrl);
    const host = parsed.hostname || window.location.hostname;
    const port = parsed.port || (protocol === 'wss:' ? '443' : '80');
    wsUrl = `${protocol}//${host}:${port}/ws?token=${encodeURIComponent(token)}`;
  } catch {
    // fallback: افترض 5000
    const host = window.location.hostname;
    wsUrl = `${protocol}//${host}:5000/ws?token=${encodeURIComponent(token)}`;
  }

  this.url = wsUrl;
  console.log('[ws] URL:', wsUrl.replace(token, '***'));
}

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.shouldReconnect = true;
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('[ws] constructor error:', err);
      return;
    }

    this.ws.onopen = () => {
      console.log('[ws] connected');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        this.listeners.forEach((fn) => fn(msg));
      } catch (err) {
        console.error('[ws] parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[ws] closed');
      this.stopPing();
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[ws] error:', err);
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}