-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "forks" INTEGER NOT NULL,
    "openIssues" INTEGER NOT NULL,
    "openPRs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResponseCache" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiResponseCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "repositoryRef" TEXT NOT NULL,
    "targetFile" TEXT,
    "issueNumber" INTEGER,
    "suggestion" TEXT,
    "payloadJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanReviewRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "repositoryRef" TEXT NOT NULL,
    "targetFile" TEXT NOT NULL DEFAULT '',
    "issueNumber" INTEGER NOT NULL DEFAULT 0,
    "suggestion" TEXT NOT NULL DEFAULT '',
    "payloadJson" JSONB NOT NULL,
    "plannedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionRunState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryRef" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "runJson" JSONB NOT NULL,
    "completionJson" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionRunState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiResponseCache_operation_inputHash_idx" ON "AiResponseCache"("operation", "inputHash");

-- CreateIndex
CREATE INDEX "AiResponseCache_expiresAt_idx" ON "AiResponseCache"("expiresAt");

-- CreateIndex
CREATE INDEX "WorkflowContext_expiresAt_idx" ON "WorkflowContext"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowContext_userId_kind_key" ON "WorkflowContext"("userId", "kind");

-- CreateIndex
CREATE INDEX "PlanReviewRecord_userId_expiresAt_idx" ON "PlanReviewRecord"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanReviewRecord_userId_kind_repositoryRef_targetFile_issue_key" ON "PlanReviewRecord"("userId", "kind", "repositoryRef", "targetFile", "issueNumber", "suggestion");

-- CreateIndex
CREATE UNIQUE INDEX "ActionRunState_userId_key" ON "ActionRunState"("userId");

-- CreateIndex
CREATE INDEX "ActionRunState_userId_repositoryRef_idx" ON "ActionRunState"("userId", "repositoryRef");

-- CreateIndex
CREATE INDEX "ActionRunState_expiresAt_idx" ON "ActionRunState"("expiresAt");
