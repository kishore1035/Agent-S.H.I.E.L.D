import { useState, useCallback } from 'react';
import type { AgentManifest, BlackboardEntry, RunTaskResponse } from '../types/nexus';

export interface HealthResponse {
  status: string;
  version: string;
}

export interface UseNexusApiOptions {
  baseUrl?: string;
}

export interface UseNexusApiReturn {
  fetchAgents: () => Promise<AgentManifest[]>;
  fetchBlackboard: () => Promise<BlackboardEntry[]>;
  runTaskRest: (task: string) => Promise<RunTaskResponse>;
  checkHealth: () => Promise<HealthResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Type-safe fetch wrapper for GET /api/agents
 */
export async function fetchAgents(
  baseUrl: string = '',
  onError?: (err: Error) => void
): Promise<AgentManifest[]> {
  try {
    const res = await fetch(`${baseUrl}/api/agents`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch agents: HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AgentManifest[];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    console.error('[NexusApi] fetchAgents error:', error);
    return [];
  }
}

/**
 * Type-safe fetch wrapper for GET /api/blackboard
 */
export async function fetchBlackboard(
  baseUrl: string = '',
  onError?: (err: Error) => void
): Promise<BlackboardEntry[]> {
  try {
    const res = await fetch(`${baseUrl}/api/blackboard`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch blackboard: HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as BlackboardEntry[];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    console.error('[NexusApi] fetchBlackboard error:', error);
    return [];
  }
}

/**
 * Type-safe fetch wrapper for POST /api/run
 */
export async function runTaskRest(
  task: string,
  baseUrl: string = '',
  onError?: (err: Error) => void
): Promise<RunTaskResponse> {
  const trimmed = task.trim();
  try {
    const res = await fetch(`${baseUrl}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ task: trimmed }),
    });

    if (!res.ok) {
      throw new Error(`Failed to execute task: HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as RunTaskResponse;
    return data;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    console.error('[NexusApi] runTaskRest error:', error);
    return {
      status: `error: ${error.message}`,
      task: trimmed,
    };
  }
}

/**
 * Type-safe fetch wrapper for GET /health
 */
export async function checkHealth(
  baseUrl: string = '',
  onError?: (err: Error) => void
): Promise<HealthResponse> {
  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Health check failed: HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as HealthResponse;
    return data;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    console.error('[NexusApi] checkHealth error:', error);
    return {
      status: 'error',
      version: 'unknown',
    };
  }
}

/**
 * React hook providing reactive REST API interactions with state management
 */
export function useNexusApi(options: UseNexusApiOptions = {}): UseNexusApiReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = options.baseUrl ?? '';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleFetchAgents = useCallback(async (): Promise<AgentManifest[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fetchAgents(baseUrl, (err) => setError(err.message));
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const handleFetchBlackboard = useCallback(async (): Promise<BlackboardEntry[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fetchBlackboard(baseUrl, (err) => setError(err.message));
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const handleRunTaskRest = useCallback(
    async (task: string): Promise<RunTaskResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await runTaskRest(task, baseUrl, (err) => setError(err.message));
        if (result.status.startsWith('error')) {
          setError(result.status);
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const handleCheckHealth = useCallback(async (): Promise<HealthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkHealth(baseUrl, (err) => setError(err.message));
      if (result.status === 'error') {
        setError('Health check failed: Nexus daemon is unreachable');
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  return {
    fetchAgents: handleFetchAgents,
    fetchBlackboard: handleFetchBlackboard,
    runTaskRest: handleRunTaskRest,
    checkHealth: handleCheckHealth,
    isLoading,
    error,
    clearError,
  };
}

export default useNexusApi;
