import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export type ActionRunStatus =
  | "CREATED"
  | "AWAITING_REVIEW"
  | "MERGED"
  | "COMPLETED"
  | "CLOSED"
  | "FAILED";

export type ActionRunType = "readme";

export interface ActionRun {
  id: string;
  actionId: string;
  actionType: ActionRunType;
  repositoryRef: string;
  branch: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  status: ActionRunStatus;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergedBy?: string;
  branchDeleted?: boolean;
  branchDeleteWarning?: string;
}

export type RecommendedActionCategory =
  | "documentation"
  | "priority"
  | "release"
  | "contributor"
  | "recommendation";

export interface RecommendedAction {
  id: string;
  category: RecommendedActionCategory;
  title: string;
  reason: string;
  executable: boolean;
  actionType?: ActionRunType;
  payload?: {
    suggestion: string;
  };
}

export interface ActionRunCompletion {
  mergedBy?: string;
  mergedAt?: string;
  branchDeleted?: boolean;
  branchDeleteWarning?: string;
  nextActions: RecommendedAction[];
  analysis?: RepositoryAnalysis;
  briefing?: MaintainerBriefing;
}

export type RefreshActionRunStatusResult =
  | {
      success: true;
      actionRun: ActionRun;
      completion?: ActionRunCompletion;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status?: number;
      };
    };
