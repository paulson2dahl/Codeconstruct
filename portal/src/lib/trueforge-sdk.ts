/**
 * TrueForge SDK wrapper for the School Ops Responder portal.
 * Provides a clean API for session management, turn streaming, and MCP interactions.
 */

export interface TrueForgeConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface Session {
  id: string;
  agentId?: string;
  createdAt: string;
  status: 'active' | 'completed' | 'error';
}

export interface TurnStreamOptions {
  input: UserInputItem[];
  model?: string;
  config?: Record<string, any>;
}

export interface UserInputItem {
  type: 'user.message' | 'user.tool_approval' | 'user.tool_response';
  content?: string;
  threadId?: string;
  toolCallId?: string;
  approval?: { status: 'allow' | 'deny'; reason?: string };
}

export interface TurnStreamEvent {
  id: string;
  type: string;
  turnId?: string;
  threadId?: string;
  sequenceNumber?: number;
  content?: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
  state?: TurnState;
  mcpServers?: McpServer[];
  title?: string;
  generativeUI?: GenerativeUI[];
  metadata?: TurnMetadata;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
  toolInfo?: {
    name: string;
    description: string;
  };
}

export interface TurnState {
  status: 'running' | 'done' | 'error' | 'paused';
  output?: { content: string };
  error?: { message: string; code: string };
}

export interface McpServer {
  name: string;
  url: string;
  status: 'connected' | 'connecting' | 'error';
}

export interface GenerativeUI {
  type: 'anomaly_report' | 'diff_table' | 'chart' | 'approval' | 'schema' | 'table';
  title: string;
  data: any;
}

export interface TurnMetadata {
  tokens?: number;
  latency?: number;
  model?: string;
}

export interface TurnStream {
  withMetadata(): AsyncIterable<{ data: TurnStreamEvent }>;
  [Symbol.asyncIterator](): AsyncIterableIterator<TurnStreamEvent>;
}

export class TrueForgeSDK {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: TrueForgeConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 60000;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw err;
    }
  }

  async createSession(agentSpec?: any): Promise<Session> {
    return this.request<Session>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ agent: agentSpec ? { spec: agentSpec } : undefined }),
    });
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async createTurnStream(sessionId: string, options: TurnStreamOptions): Promise<TurnStream> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/turns/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return {
      async *[Symbol.asyncIterator]() {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                yield event;
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      },

      withMetadata() {
        return this[Symbol.asyncIterator]();
      },
    } as TurnStream;
  }

  async sendApproval(sessionId: string, approvals: UserInputItem[]): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}/approvals`, {
      method: 'POST',
      body: JSON.stringify({ approvals }),
    });
  }

  async sendToolResponse(sessionId: string, responses: UserInputItem[]): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}/tool-responses`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    });
  }

  // MCP Server management
  async listMCPServers(): Promise<McpServer[]> {
    return this.request<McpServer[]>('/api/v1/mcp/servers');
  }

  async connectMCPServer(sessionId: string, serverName: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}/mcp/${serverName}/connect`, {
      method: 'POST',
    });
  }

  async disconnectMCPServer(sessionId: string, serverName: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}/mcp/${serverName}/disconnect`, {
      method: 'POST',
    });
  }

  // Sandbox operations
  async executeInSandbox(sessionId: string, code: string, language: 'python' | 'javascript' = 'python'): Promise<any> {
    return this.request<any>(`/api/v1/sessions/${sessionId}/sandbox/execute`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async uploadToSandbox(sessionId: string, file: File): Promise<{ path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/sandbox/upload`, {
      method: 'POST',
      headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  // Web search
  async webSearch(query: string, options?: { maxResults?: number; safeSearch?: boolean }): Promise<any> {
    return this.request<any>('/api/v1/web-search', {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }
}

export default TrueForgeSDK;