export type MaintenanceActionType = 'documentation' | 'cleanup' | 'update-deps' | 'configuration';
export type ExecutionStatus = 'review' | 'ready' | 'executing' | 'complete' | 'failed';
export type PreflightCheckStatus = 'pending' | 'running' | 'success' | 'warning' | 'error';
export type FileChangeAction = 'create' | 'modify' | 'delete';

export interface FileChange {
  path: string;
  action: FileChangeAction;
  summary: string;
  beforeContent?: string;
  afterContent?: string;
  linesAdded: number;
  linesRemoved: number;
}

export interface PreflightCheck {
  id: string;
  name: string;
  description: string;
  status: PreflightCheckStatus;
  details?: string;
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  timestamp?: Date;
  details?: string;
}

export interface MaintenanceAction {
  id: string;
  type: MaintenanceActionType;
  title: string;
  description: string;
  reasoning: string;
  repository: string;
  repositoryUrl: string;
  status: ExecutionStatus;
  proposedChanges: FileChange[];
  preflightChecks: PreflightCheck[];
  executionSteps?: ExecutionStep[];
  createdAt: Date;
  executedAt?: Date;
}

export interface ExecutionResult {
  status: 'success' | 'failed';
  summary: string;
  logs: string[];
  changesApplied: number;
  checksPassedCount: number;
  checksFailedCount: number;
  prUrl?: string;
  branchName?: string;
  canRollback: boolean;
}
