/**
 * Nexus Autonomous Multi-Agent Orchestration Hub
 * Core TypeScript Type Definitions
 */

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  timeout_secs: number;
}

export interface BlackboardEntry {
  key: string;
  value: unknown;
  author: string;
  version: number;
  timestamp: string;
}

export interface SignedReceipt {
  task_id: string;
  payload_digest: string;
  public_key: string;
  signature: string;
  timestamp: string;
  verified?: boolean;
}

export type SubtaskState = 'PENDING' | 'ROUTED' | 'SANDBOXED' | 'DONE';

export interface Subtask {
  id: string;
  description: string;
  tags?: string[];
  state: SubtaskState;
  status?: SubtaskState;
  assignedWorker?: string;
  worker_id?: string;
  result?: string;
  executionTimeMs?: number;
}

export type LogCategory = 'ALL' | 'ROUTER' | 'SANDBOX' | 'CRYPTO';
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  message: string;
  category: LogCategory;
  level?: LogLevel;
  raw?: unknown;
}

export type WsMessageType = 'log' | 'blackboard_update' | 'sandbox_event' | 'receipt';

export interface WsMessage {
  type: WsMessageType;
  message?: string;
  key?: string;
  author?: string;
  version?: number;
  value?: unknown;
  task_id?: string;
  signature?: string;
  payload_digest?: string;
  public_key?: string;
  timestamp?: string;
  code?: string;
  stderr?: string;
  healed_code?: string;
  status?: string;
  category?: LogCategory;
  [key: string]: unknown;
}

export interface WsLogMessage {
  type: 'log';
  message: string;
  timestamp?: string;
  category?: LogCategory;
}

export interface WsBlackboardUpdateMessage {
  type: 'blackboard_update';
  key: string;
  author: string;
  version: number;
  value: unknown;
  timestamp?: string;
}

export interface WsSandboxEventMessage {
  type: 'sandbox_event';
  message: string;
  code?: string;
  stderr?: string;
  healed_code?: string;
  status?: string;
}

export interface WsReceiptMessage {
  type: 'receipt';
  task_id: string;
  signature: string;
  payload_digest: string;
  public_key?: string;
  timestamp: string;
}

export interface MetricStats {
  activeWorkers: number;
  blackboardRevisions: number;
  sandboxesExecuted: number;
  verifiedReceipts: number;
}

export interface RunTaskRequest {
  task: string;
}

export interface RunTaskResponse {
  status: string;
  task: string;
}

export type ActiveTab = 'workspace' | 'workers' | 'blackboard';
