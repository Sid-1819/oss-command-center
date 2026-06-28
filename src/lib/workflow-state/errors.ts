export type WorkflowStateErrorCode =
  | "DATABASE_UNAVAILABLE"
  | "EXPIRED_SESSION"
  | "UNKNOWN";

export interface WorkflowStateErrorPayload {
  code: WorkflowStateErrorCode;
  message: string;
  status?: number;
}

export class WorkflowStateError extends Error {
  readonly code: WorkflowStateErrorCode;
  readonly status?: number;

  constructor(payload: WorkflowStateErrorPayload) {
    super(payload.message);
    this.name = "WorkflowStateError";
    this.code = payload.code;
    this.status = payload.status;
  }
}

export function isWorkflowStateError(error: unknown): error is WorkflowStateError {
  return error instanceof WorkflowStateError;
}

export function workflowStateErrorMessage(error: WorkflowStateErrorPayload): string {
  if (error.code === "DATABASE_UNAVAILABLE") {
    return "Database connection required. Set DATABASE_URL and run npm run db:push.";
  }

  return error.message;
}

export type WorkflowStateResult<T> =
  | { success: true; data: T }
  | { success: false; error: WorkflowStateErrorPayload };

export function assertWorkflowResult<T>(result: WorkflowStateResult<T>): T {
  if (!result.success) {
    throw new WorkflowStateError(result.error);
  }

  return result.data;
}
