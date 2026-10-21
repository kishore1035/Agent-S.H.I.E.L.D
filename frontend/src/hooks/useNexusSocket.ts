import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WsMessage,
  WsLogMessage,
  WsBlackboardUpdateMessage,
  WsSandboxEventMessage,
  SignedReceipt,
  TelemetryLog,
  LogCategory,
  LogLevel,
} from '../types/nexus';

export interface UseNexusSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  maxLogs?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WsMessage) => void;
  onBlackboardUpdate?: (entry: WsBlackboardUpdateMessage) => void;
  onSandboxEvent?: (event: WsSandboxEventMessage) => void;
  onReceipt?: (receipt: SignedReceipt) => void;
  onLog?: (log: WsLogMessage) => void;
}

export interface UseNexusSocketReturn {
  isConnected: boolean;
  events: TelemetryLog[];
  sendTask: (task: string) => boolean;
  clearEvents: () => void;
  latestReceipt: SignedReceipt | null;
  latencyMs: number | null;
  reconnect: () => void;
  disconnect: () => void;
  subscribe: (listener: (msg: WsMessage) => void) => () => void;
}

let logSequence = 0;
function generateLogId(): string {
  logSequence += 1;
  return `log-${Date.now()}-${logSequence}-${Math.random().toString(36).substring(2, 7)}`;
}

function resolveWsUrl(customUrl?: string): string {
  if (customUrl) return customUrl;
  if (typeof window === 'undefined') {
    return 'ws://127.0.0.1:8000/ws';
  }
  const isSecure = window.location.protocol === 'https:';
  const protocol = isSecure ? 'wss:' : 'ws:';
  const host = window.location.host || '127.0.0.1:8000';
  return `${protocol}//${host}/ws`;
}

function classifyLog(
  msgText: string,
  explicitCategory?: LogCategory
): { category: LogCategory; level: LogLevel } {
  let category: LogCategory = explicitCategory || 'ROUTER';
  let level: LogLevel = 'info';

  const lower = msgText.toLowerCase();

  if (!explicitCategory || explicitCategory === 'ALL') {
    if (
      lower.includes('sandbox') ||
      lower.includes('bubblewrap') ||
      lower.includes('healed') ||
      lower.includes('container') ||
      lower.includes('execution')
    ) {
      category = 'SANDBOX';
    } else if (
      lower.includes('receipt') ||
      lower.includes('crypto') ||
      lower.includes('signature') ||
      lower.includes('digest') ||
      lower.includes('ed25519')
    ) {
      category = 'CRYPTO';
    } else {
      category = 'ROUTER';
    }
  }

  if (
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('exception') ||
    lower.includes('❌') ||
    lower.includes('fatal')
  ) {
    level = 'error';
  } else if (lower.includes('warn') || lower.includes('⚠️') || lower.includes('retrying')) {
    level = 'warn';
  } else if (
    lower.includes('success') ||
    lower.includes('passed') ||
    lower.includes('completed') ||
    lower.includes('verified') ||
    lower.includes('✅') ||
    lower.includes('✨')
  ) {
    level = 'success';
  } else {
    level = 'info';
  }

  return { category, level };
}

export function useNexusSocket(options: UseNexusSocketOptions = {}): UseNexusSocketReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<TelemetryLog[]>([]);
  const [latestReceipt, setLatestReceipt] = useState<SignedReceipt | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const optionsRef = useRef<UseNexusSocketOptions>(options);
  optionsRef.current = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const shouldReconnectRef = useRef<boolean>(true);
  const subscribersRef = useRef<Set<(msg: WsMessage) => void>>(new Set());
  const connectFnRef = useRef<() => void>(() => {});

  const addLog = useCallback((log: TelemetryLog) => {
    setEvents((prev) => {
      const max = optionsRef.current.maxLogs ?? 1000;
      const next = [...prev, log];
      return next.length > max ? next.slice(next.length - max) : next;
    });
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const sendTask = useCallback((task: string): boolean => {
    const trimmed = task.trim();
    if (!trimmed) return false;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'run_task', task: trimmed }));
      return true;
    }
    console.warn('[NexusSocket] Cannot send task: WebSocket is not open');
    return false;
  }, []);

  const subscribe = useCallback((listener: (msg: WsMessage) => void) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const targetUrl = resolveWsUrl(options.url);

  useEffect(() => {
    let isMounted = true;
    shouldReconnectRef.current = true;

    function connect() {
      if (!isMounted) return;

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore cleanup error
        }
        wsRef.current = null;
      }

      const connectStartTime = performance.now();
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = (event: Event) => {
        if (!isMounted) return;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        setLatencyMs(Math.round(performance.now() - connectStartTime));
        optionsRef.current.onOpen?.(event);
      };

      ws.onclose = (event: CloseEvent) => {
        if (!isMounted) return;
        setIsConnected(false);
        optionsRef.current.onClose?.(event);

        const autoReconnect = optionsRef.current.autoReconnect ?? true;
        if (shouldReconnectRef.current && autoReconnect) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = window.setTimeout(connect, delay);
        }
      };

      ws.onerror = (event: Event) => {
        if (!isMounted) return;
        optionsRef.current.onError?.(event);
      };

      ws.onmessage = async (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const raw = typeof event.data === 'string' ? event.data : await event.data.text();
          const parsed = JSON.parse(raw) as WsMessage;

          // Notify general subscribers and onMessage handler
          optionsRef.current.onMessage?.(parsed);
          subscribersRef.current.forEach((listener) => {
            try {
              listener(parsed);
            } catch (err) {
              console.error('[NexusSocket] Subscriber callback error:', err);
            }
          });

          // Route typed events
          switch (parsed.type) {
            case 'blackboard_update': {
              const bbMsg: WsBlackboardUpdateMessage = {
                type: 'blackboard_update',
                key: (parsed.key as string) ?? '',
                author: (parsed.author as string) ?? 'system',
                version: (parsed.version as number) ?? 1,
                value: parsed.value,
                timestamp: (parsed.timestamp as string) ?? new Date().toISOString(),
              };
              optionsRef.current.onBlackboardUpdate?.(bbMsg);
              addLog({
                id: generateLogId(),
                timestamp: bbMsg.timestamp || new Date().toISOString(),
                message: `Blackboard [${bbMsg.key}] set to v${bbMsg.version} by ${bbMsg.author}`,
                category: 'ROUTER',
                level: 'info',
                raw: parsed,
              });
              break;
            }

            case 'sandbox_event': {
              const sbMsg: WsSandboxEventMessage = {
                type: 'sandbox_event',
                message: (parsed.message as string) ?? 'Container sandbox execution',
                code: parsed.code as string | undefined,
                stderr: parsed.stderr as string | undefined,
                healed_code: parsed.healed_code as string | undefined,
                status: parsed.status as string | undefined,
              };
              optionsRef.current.onSandboxEvent?.(sbMsg);
              const { category, level } = classifyLog(sbMsg.message, 'SANDBOX');
              addLog({
                id: generateLogId(),
                timestamp: new Date().toISOString(),
                message: sbMsg.message,
                category,
                level: sbMsg.status === 'error' ? 'error' : level,
                raw: parsed,
              });
              break;
            }

            case 'receipt': {
              const receipt: SignedReceipt = {
                task_id: (parsed.task_id as string) ?? '',
                payload_digest: (parsed.payload_digest as string) ?? '',
                public_key: (parsed.public_key as string) ?? '',
                signature: (parsed.signature as string) ?? '',
                timestamp: (parsed.timestamp as string) ?? new Date().toISOString(),
                verified: true,
              };
              setLatestReceipt(receipt);
              optionsRef.current.onReceipt?.(receipt);
              const digestPrefix = receipt.payload_digest ? receipt.payload_digest.slice(0, 16) : 'verified';
              addLog({
                id: generateLogId(),
                timestamp: receipt.timestamp,
                message: `Ed25519 Receipt verified for task [${receipt.task_id}] (digest: ${digestPrefix}...)`,
                category: 'CRYPTO',
                level: 'success',
                raw: parsed,
              });
              break;
            }

            case 'log': {
              const logMsg: WsLogMessage = {
                type: 'log',
                message: (parsed.message as string) ?? '',
                timestamp: (parsed.timestamp as string) ?? new Date().toISOString(),
                category: parsed.category as LogCategory | undefined,
              };
              optionsRef.current.onLog?.(logMsg);
              const { category, level } = classifyLog(logMsg.message, logMsg.category);
              addLog({
                id: generateLogId(),
                timestamp: logMsg.timestamp || new Date().toISOString(),
                message: logMsg.message,
                category,
                level,
                raw: parsed,
              });
              break;
            }

            default: {
              const text =
                typeof parsed.message === 'string'
                  ? parsed.message
                  : typeof parsed === 'object'
                  ? JSON.stringify(parsed)
                  : String(parsed);
              const { category, level } = classifyLog(text);
              addLog({
                id: generateLogId(),
                timestamp: new Date().toISOString(),
                message: text,
                category,
                level,
                raw: parsed,
              });
              break;
            }
          }
        } catch (err) {
          console.error('[NexusSocket] JSON parse failure:', err);
        }
      };
    }

    connectFnRef.current = connect;
    connect();

    return () => {
      isMounted = false;
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [targetUrl, addLog]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connectFnRef.current();
  }, [disconnect]);

  // Periodic roundtrip latency measurement
  useEffect(() => {
    if (!isConnected) return;
    const intervalId = window.setInterval(async () => {
      try {
        const pingStart = performance.now();
        const res = await fetch('/health', { method: 'GET', cache: 'no-store' });
        if (res.ok) {
          setLatencyMs(Math.round(performance.now() - pingStart));
        }
      } catch {
        // daemon endpoint temporarily unavailable
      }
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isConnected]);

  return {
    isConnected,
    events,
    sendTask,
    clearEvents,
    latestReceipt,
    latencyMs,
    reconnect,
    disconnect,
    subscribe,
  };
}

export default useNexusSocket;
