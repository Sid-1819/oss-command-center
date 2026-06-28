import type {
  DocPlanContext,
  DocPlanReview,
  IssueFixPlanReview,
  IssuePlanContext,
} from "@/types/doc-plan-review";
import type { ActionRun, ActionRunCompletion } from "@/types/action-run";
import {
  getActionRunTtlMs,
  getPlanReviewTtlMs,
  getWorkflowContextTtlMs,
  type WorkflowStateKind,
} from "@/lib/workflow-state/ttl";

export class DatabaseNotConfiguredError extends Error {
  readonly code = "DATABASE_UNAVAILABLE" as const;

  constructor(
    message = "DATABASE_URL is not configured. Set it in .env and run npm run db:push.",
  ) {
    super(message);
    this.name = "DatabaseNotConfiguredError";
  }
}

export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new DatabaseNotConfiguredError();
  }
}

async function getPrisma() {
  assertDatabaseConfigured();
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

export async function upsertWorkflowContext(
  userId: string,
  kind: WorkflowStateKind,
  context: DocPlanContext | IssuePlanContext,
): Promise<void> {
  const prisma = await getPrisma();
  const expiresAt = new Date(Date.now() + getWorkflowContextTtlMs());

  await prisma.workflowContext.upsert({
    where: {
      userId_kind: { userId, kind },
    },
    create: {
      userId,
      kind,
      repositoryRef: context.repositoryRef,
      targetFile: "targetFile" in context ? context.targetFile : null,
      issueNumber: "issueNumber" in context ? context.issueNumber : null,
      suggestion: "suggestion" in context ? context.suggestion : null,
      payloadJson: context as object,
      expiresAt,
    },
    update: {
      repositoryRef: context.repositoryRef,
      targetFile: "targetFile" in context ? context.targetFile : null,
      issueNumber: "issueNumber" in context ? context.issueNumber : null,
      suggestion: "suggestion" in context ? context.suggestion : null,
      payloadJson: context as object,
      expiresAt,
    },
  });
}

export async function getWorkflowContext<T extends DocPlanContext | IssuePlanContext>(
  userId: string,
  kind: WorkflowStateKind,
): Promise<T | null> {
  const prisma = await getPrisma();

  const row = await prisma.workflowContext.findUnique({
    where: { userId_kind: { userId, kind } },
  });

  if (!row) {
    return null;
  }

  if (isExpired(row.expiresAt)) {
    await prisma.workflowContext
      .delete({ where: { id: row.id } })
      .catch(() => undefined);
    return null;
  }

  return row.payloadJson as unknown as T;
}

export async function deleteWorkflowContext(
  userId: string,
  kind: WorkflowStateKind,
): Promise<void> {
  const prisma = await getPrisma();

  await prisma.workflowContext
    .delete({
      where: { userId_kind: { userId, kind } },
    })
    .catch(() => undefined);
}

interface DocPlanReviewLookup {
  repositoryRef: string;
  targetFile: string;
  suggestion: string;
}

interface IssuePlanReviewLookup {
  repositoryRef: string;
  issueNumber: number;
}

export async function upsertPlanReview(
  userId: string,
  kind: "doc",
  review: DocPlanReview,
): Promise<void>;
export async function upsertPlanReview(
  userId: string,
  kind: "issue",
  review: IssueFixPlanReview,
): Promise<void>;
export async function upsertPlanReview(
  userId: string,
  kind: WorkflowStateKind,
  review: DocPlanReview | IssueFixPlanReview,
): Promise<void> {
  const prisma = await getPrisma();
  const expiresAt = new Date(Date.now() + getPlanReviewTtlMs());
  const plannedAt = new Date(review.plannedAt);

  const targetFile = kind === "doc" ? (review as DocPlanReview).targetFile : "";
  const issueNumber = kind === "issue" ? (review as IssueFixPlanReview).issueNumber : 0;
  const suggestion = kind === "doc" ? (review as DocPlanReview).suggestion : "";

  await prisma.planReviewRecord.upsert({
    where: {
      userId_kind_repositoryRef_targetFile_issueNumber_suggestion: {
        userId,
        kind,
        repositoryRef: review.repositoryRef,
        targetFile,
        issueNumber,
        suggestion,
      },
    },
    create: {
      userId,
      kind,
      repositoryRef: review.repositoryRef,
      targetFile,
      issueNumber,
      suggestion,
      payloadJson: review as object,
      plannedAt,
      expiresAt,
    },
    update: {
      payloadJson: review as object,
      plannedAt,
      expiresAt,
    },
  });
}

export async function getPlanReview(
  userId: string,
  kind: "doc",
  lookup: DocPlanReviewLookup,
): Promise<DocPlanReview | null>;
export async function getPlanReview(
  userId: string,
  kind: "issue",
  lookup: IssuePlanReviewLookup,
): Promise<IssueFixPlanReview | null>;
export async function getPlanReview(
  userId: string,
  kind: WorkflowStateKind,
  lookup: DocPlanReviewLookup | IssuePlanReviewLookup,
): Promise<DocPlanReview | IssueFixPlanReview | null> {
  const prisma = await getPrisma();

  const targetFile =
    kind === "doc" ? (lookup as DocPlanReviewLookup).targetFile : "";
  const issueNumber =
    kind === "issue" ? (lookup as IssuePlanReviewLookup).issueNumber : 0;
  const suggestion =
    kind === "doc" ? (lookup as DocPlanReviewLookup).suggestion : "";

  const row = await prisma.planReviewRecord.findUnique({
    where: {
      userId_kind_repositoryRef_targetFile_issueNumber_suggestion: {
        userId,
        kind,
        repositoryRef: lookup.repositoryRef,
        targetFile,
        issueNumber,
        suggestion,
      },
    },
  });

  if (!row) {
    return null;
  }

  if (isExpired(row.expiresAt)) {
    await prisma.planReviewRecord
      .delete({ where: { id: row.id } })
      .catch(() => undefined);
    return null;
  }

  return row.payloadJson as unknown as DocPlanReview | IssueFixPlanReview;
}

export async function deletePlanReview(
  userId: string,
  kind: WorkflowStateKind,
  lookup?: DocPlanReviewLookup | IssuePlanReviewLookup,
): Promise<void> {
  const prisma = await getPrisma();

  if (lookup) {
    const targetFile =
      kind === "doc" ? (lookup as DocPlanReviewLookup).targetFile : "";
    const issueNumber =
      kind === "issue" ? (lookup as IssuePlanReviewLookup).issueNumber : 0;
    const suggestion =
      kind === "doc" ? (lookup as DocPlanReviewLookup).suggestion : "";

    await prisma.planReviewRecord
      .delete({
        where: {
          userId_kind_repositoryRef_targetFile_issueNumber_suggestion: {
            userId,
            kind,
            repositoryRef: lookup.repositoryRef,
            targetFile,
            issueNumber,
            suggestion,
          },
        },
      })
      .catch(() => undefined);
    return;
  }

  await prisma.planReviewRecord.deleteMany({
    where: { userId, kind },
  });
}

export async function upsertActionRunState(
  userId: string,
  run: ActionRun,
  completion?: ActionRunCompletion,
): Promise<void> {
  const prisma = await getPrisma();
  const expiresAt = new Date(Date.now() + getActionRunTtlMs());

  await prisma.actionRunState.upsert({
    where: { userId },
    create: {
      userId,
      repositoryRef: run.repositoryRef,
      actionType: run.actionType,
      runJson: run as object,
      completionJson: completion ? (completion as object) : undefined,
      expiresAt,
    },
    update: {
      repositoryRef: run.repositoryRef,
      actionType: run.actionType,
      runJson: run as object,
      completionJson: completion ? (completion as object) : undefined,
      expiresAt,
    },
  });
}

interface ActionRunStatePayload {
  run: ActionRun;
  completion: ActionRunCompletion | null;
}

async function loadActionRunState(userId: string): Promise<ActionRunStatePayload | null> {
  const prisma = await getPrisma();

  const row = await prisma.actionRunState.findUnique({
    where: { userId },
  });

  if (!row) {
    return null;
  }

  if (isExpired(row.expiresAt)) {
    await prisma.actionRunState
      .delete({ where: { id: row.id } })
      .catch(() => undefined);
    return null;
  }

  return {
    run: row.runJson as unknown as ActionRun,
    completion: row.completionJson
      ? (row.completionJson as unknown as ActionRunCompletion)
      : null,
  };
}

export async function getActionRunState(userId: string): Promise<ActionRunStatePayload | null> {
  return loadActionRunState(userId);
}

export async function getActionRunForRepository(
  userId: string,
  repositoryRef: string,
): Promise<ActionRunStatePayload | null> {
  const state = await loadActionRunState(userId);

  if (!state || state.run.repositoryRef !== repositoryRef) {
    return null;
  }

  return state;
}

export async function deleteActionRunState(userId: string): Promise<void> {
  const prisma = await getPrisma();

  await prisma.actionRunState
    .delete({
      where: { userId },
    })
    .catch(() => undefined);
}
