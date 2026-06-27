export type ActionRunStatus =
  | "CREATED"
  | "AWAITING_REVIEW"
  | "MERGED"
  | "COMPLETED"
  | "CLOSED"
  | "FAILED";

export type ActionRunType = "markdown-doc" | "issue-fix" | "readme";

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
  targetFile?: string;
  issueNumber?: number;
  mergedAt?: string;
  mergedBy?: string;
  branchDeleted?: boolean;
  branchDeleteWarning?: string;
  issueClosed?: boolean;
  issueCloseWarning?: string;
}

export type RecommendedActionCategory =
  | "documentation"
  | "priority"
  | "release"
  | "contributor"
  | "recommendation"
  | "auto-fix";

export interface RecommendedAction {
  id: string;
  category: RecommendedActionCategory;
  title: string;
  reason: string;
  executable: boolean;
  actionType?: ActionRunType;
  payload?: {
    suggestion?: string;
    targetFile?: string;
    issueNumber?: number;
  };
}

export interface ActionRunCompletion {
  mergedBy?: string;
  mergedAt?: string;
  branchDeleted?: boolean;
  branchDeleteWarning?: string;
  issueClosed?: boolean;
  issueCloseWarning?: string;
  nextActions: RecommendedAction[];
  analysis?: import("@/types/repository-analysis").RepositoryAnalysis;
  briefing?: import("@/types/maintainer-briefing").MaintainerBriefing;
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
