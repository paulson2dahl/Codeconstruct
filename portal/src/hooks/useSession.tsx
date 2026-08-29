import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TrueForgeSDK } from '../lib/trueforge-sdk';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
  generativeUI?: GenerativeUI[];
  metadata?: {
    tokens?: number;
    model?: string;
    latency?: number;
  };
}

interface GenerativeUI {
  type: 'anomaly_report' | 'diff_table' | 'chart' | 'approval' | 'schema' | 'table';
  title: string;
  data: any;
}

interface Session {
  id: string;
  agentId?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isConnected: boolean;
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (input: { content: string; files?: File[]; model?: string }, parentId?: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user] = useState<User | null>({
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sdk, setSdk] = useState<TrueForgeSDK | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const env = import.meta.env as Record<string, string | undefined>;
        const client = new TrueForgeSDK({
          baseUrl: env.VITE_TRUEFORGE_URL || 'http://localhost:8790',
        });
        setSdk(client);
        await connect(client);
      } catch (err) {
        console.error('Failed to initialize TrueForge SDK:', err);
      }
    };
    initSDK();
  }, []);

  const connect = useCallback(async (client: TrueForgeSDK) => {
    try {
      const newSession = await client.createSession();
      setSession(newSession);
      setIsConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setSession(null);
    setIsConnected(false);
    setMessages([]);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const sendMessage = useCallback(async (
    input: { content: string; files?: File[]; model?: string },
    _parentId?: string
  ) => {
    if (!sdk || !session) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.content,
    };
    addMessage(userMessage);
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      streaming: true,
    };
    addMessage(assistantMessage);

    try {
      const stream = await sdk.createTurnStream(session.id, {
        input: [{ type: 'user.message', content: input.content }],
        model: input.model,
      });

      for await (const event of stream) {
        if (event.type === 'model.message.delta' && event.content) {
          const updated = { ...assistantMessage, content: assistantMessage.content + event.content };
          updateMessage(assistantMessage.id, { content: updated.content });
        } else if (event.type === 'model.message' && event.finishReason === 'stop') {
          updateMessage(assistantMessage.id, {
            content: event.content || assistantMessage.content,
            streaming: false,
            generativeUI: event.generativeUI,
            metadata: event.metadata,
          });
          break;
        } else if (event.type === 'tool.approval_required') {
          console.log('Approval required:', event);
        } else if (event.type === 'turn.done') {
          const state = event.state;
          if (state && state.status === 'error') {
            updateMessage(assistantMessage.id, {
              content: `Error: ${state.error?.message || 'Unknown error'}`,
              streaming: false,
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Send message failed:', err);
      updateMessage(assistantMessage.id, {
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        streaming: false,
      });
    } finally {
      setIsStreaming(false);
    }
  }, [sdk, session, addMessage, updateMessage]);

  return (
    <SessionContext.Provider value={{
      session,
      user,
      isConnected,
      messages,
      isStreaming,
      sendMessage,
      setMessages,
      addMessage,
      updateMessage,
      connect: () => connect(sdk!),
      disconnect,
    }}>
      {children}
    </SessionContext.Provider>
  );
};