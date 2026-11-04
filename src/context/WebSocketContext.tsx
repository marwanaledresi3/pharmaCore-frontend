import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, WsMessage } from '../api/wsApi';

export interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (listener: (msg: WsMessage) => void) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  subscribe: () => () => {},
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('pharmacore_token');
    if (!token) return;

    const client = new WebSocketClient(token);
    clientRef.current = client;

    const unsub = client.subscribe((msg) => {
      if (msg.type === 'connected') setIsConnected(true);
    });

    client.connect();

    const checkTimer = setTimeout(() => {
      if (clientRef.current?.isConnected()) setIsConnected(true);
    }, 3000);

    return () => {
      clearTimeout(checkTimer);
      unsub();
      client.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, []);

  const subscribe = useCallback((listener: (msg: WsMessage) => void) => {
    if (!clientRef.current) return () => {};
    return clientRef.current.subscribe(listener);
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};