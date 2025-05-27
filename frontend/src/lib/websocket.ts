import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type WebSocketMessage = {
  type: 'message' | 'conversation' | 'category' | 'product';
  action: 'create' | 'update' | 'delete';
  payload: any;
};

export const useWebSocket = (userId: string | undefined) => {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://your-websocket-server.com';
    ws.current = new WebSocket(`${wsUrl}?userId=${userId}`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [userId]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        // Invalidate messages query for the specific conversation
        if (message.payload.conversation_id) {
          queryClient.invalidateQueries({
            queryKey: ['messages', message.payload.conversation_id],
          });
        }
        // Update conversations list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        break;

      case 'conversation':
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        break;

      case 'category':
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        break;

      case 'product':
        queryClient.invalidateQueries({ queryKey: ['products'] });
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return ws.current;
}; 