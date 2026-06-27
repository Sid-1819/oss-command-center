import type { Executor } from "./Executor";
import type { Planner } from "./Planner";
import type { Reporter } from "./Reporter";
import type { Validator } from "./Validator";
import type {
  ActionError,
  ActionExecutionContext,
  ActionMetadata,
  ActionPipelineResult,
  ActionReport,
  ValidationResult,
} from "./types";
import { ActionError as ActionErrorClass } from "./types";

export interface Action<
  TInput,
  TPlan,
  TOutput,
  TReport extends ActionReport = ActionReport,
> {
  readonly metadata: ActionMetadata;
  planner(): Planner<TInput, TPlan>;
  validator(): Validator<TPlan>;
  executor(): Executor<TPlan, TOutput>;
  reporter(): Reporter<TOutput, TReport>;
}

export interface CreateActionConfig<
  TInput,
  TPlan,
  TOutput,
  TReport extends ActionReport = ActionReport,
> {
  metadata: ActionMetadata;
  planner: Planner<TInput, TPlan>;
  validator: Validator<TPlan>;
  executor: Executor<TPlan, TOutput>;
  reporter: Reporter<TOutput, TReport>;
}

export function createAction<
  TInput,
  TPlan,
  TOutput,
  TReport extends ActionReport = ActionReport,
>(
  config: CreateActionConfig<TInput, TPlan, TOutput, TReport>,
): Action<TInput, TPlan, TOutput, TReport> {
  return {
    metadata: config.metadata,
    planner: () => config.planner,
    validator: () => config.validator,
    executor: () => config.executor,
    reporter: () => config.reporter,
  };
}

export async function runActionPipeline<
  TInput,
  TPlan,
  TOutput,
  TReport extends ActionReport = ActionReport,
>(
  action: Action<TInput, TPlan, TOutput, TReport>,
  input: TInput,
  context: ActionExecutionContext,
): Promise<ActionPipelineResult<TPlan, TOutput, TReport>> {
  let plan: TPlan;

  try {
    plan = await action.planner().plan(input);
  } catch (error) {
    return {
      success: false,
      phase: "PLAN",
      error: toActionError(error, "PLAN"),
    };
  }

  const validation = action.validator().validate(plan);

  if (!validation.valid) {
    return {
      success: false,
      phase: "VALIDATE",
      error: validation,
    };
  }

  let execution: TOutput;

  try {
    execution = await action.executor().execute(plan, context);
  } catch (error) {
    return {
      success: false,
      phase: "EXECUTE",
      error: toActionError(error, "EXECUTE"),
    };
  }

  try {
    const report = action.reporter().report(execution);

    return {
      success: true,
      plan,
      execution,
      report,
    };
  } catch (error) {
    return {
      success: false,
      phase: "REPORT",
      error: toActionError(error, "REPORT"),
    };
  }
}

function toActionError(
  error: unknown,
  phase: ActionError["phase"],
): ActionErrorClass {
  if (error instanceof ActionErrorClass) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "An unknown action error occurred";

  return new ActionErrorClass(message, phase, 500, error);
}

export type {
  ActionError,
  ActionExecutionContext,
  ActionExecutionResult,
  ActionExecutionUser,
  ActionMetadata,
  ActionPipelineResult,
  ValidationResult,
} from "./types";
