# OSS Command Center - Dashboard Structure

## Overview

The maintainer dashboard has been revamped to follow a clear, action-oriented workflow for open source maintainers. The new structure prioritizes **today's critical actions** while providing comprehensive repository health insights.

---

## Dashboard Sections (Top to Bottom)

### 1. **Maintainer Briefing** (Hero Section)
- **Purpose**: AI-generated executive summary of repository status
- **Includes**:
 - Quick health score with status indicator
 - Estimated time to address today's priorities
 - Repository status (Active/Needs attention)
 - High-priority item count
- **Component**: `MaintainerBriefing`

---

### 2. **Primary Action Row** (Today's Inbox & Merge Queue)

#### **Today's Priorities** (Left - 2/3 width)
- **Purpose**: Ranked list of today's critical tasks
- **Features**:
 - High, Medium, Low priority items
 - Impact-based ranking
 - Quick action buttons
 - Visual priority indicators
- **Component**: `TodaysPriorities`

#### **Merge Queue** (Right - 1/3 width)
- **Purpose**: Top 3 AI-prioritized pull requests
- **Features**:
 - PR title and author
 - Priority level (urgent/high/medium)
 - Review count
 - Quick navigation to reviews
- **Component**: `MergeQueue` *(New)*

---

### 3. **Maintenance & Security Row**

#### **AI Maintenance Queue** (Left - 1/2 width)
- **Purpose**: Automated maintenance tasks requiring human review
- **Tasks Include**:
 - README updates with AI suggestions
 - CHANGELOG maintenance entries
 - Release preparation checklist
 - Build/CI configuration issues
- **Component**: `MaintenanceQueue` *(New)*

#### **Security Overview** (Right - 1/2 width)
- **Purpose**: Security vulnerabilities and compliance status
- **Features**:
 - Critical/High/Medium/Low severity indicators
 - Outdated dependencies alert
 - License compliance checks
 - Security scanning status
- **Component**: `SecurityOverview` *(New)*

---

### 4. **Release & Health Row**

#### **Release Assistant** (Left - 2/3 width)
- **Purpose**: Release management and versioning guidance
- **Features**:
 - Version bump recommendations
 - Release notes suggestions
 - Pre-release checklist
 - Publishing guidance
- **Component**: `ReleaseAssistant`

#### **Repository Health** (Right - 1/3 width)
- **Purpose**: Key metrics and repository statistics
- **Metrics**:
 - Overall health score (0-100)
 - Star count
 - Fork count
 - Open issues
 - Open pull requests
- **Component**: `RepositoryHealth`

---

### 5. **Bottom Section** (Full Width)

#### **Contributor Opportunities**
- **Purpose**: Good-first-issue identification and community engagement
- **Features**:
 - Issues tagged as beginner-friendly
 - Community contribution suggestions
 - New contributor onboarding tips
- **Component**: `ContributorOpportunities`

---

## Component Architecture

### New Components Added

#### **MergeQueue** (`merge-queue.tsx`)
```typescript
interface MergeQueueProps extends DashboardSectionStateProps {
 pullRequests?: number;
}
```
Shows the top 3 AI-prioritized pull requests with metadata.

#### **MaintenanceQueue** (`maintenance-queue.tsx`)
```typescript
interface MaintenanceQueueProps extends DashboardSectionStateProps {
 release?: MaintainerBriefing['release'];
 documentation?: MaintainerBriefing['documentation'];
 onUpdateReadme?: (suggestion: string) => void;
}
```
Aggregates README, CHANGELOG, and release tasks in one place.

#### **SecurityOverview** (`security-overview.tsx`)
```typescript
interface SecurityOverviewProps extends DashboardSectionStateProps {
 analysis?: RepositoryAnalysis;
}
```
Displays security vulnerabilities and compliance issues.

---

## Layout Improvements

### Responsive Design
- **Mobile (< 1024px)**: Single column, stacked sections
- **Desktop (≥ 1024px)**: Multi-column grid layout
 - Primary row: 2/3 + 1/3 split
 - Secondary row: 1/2 + 1/2 split
 - Tertiary row: 2/3 + 1/3 split

### Visual Hierarchy
1. **Urgent** (Red/Destructive): Security issues, critical PRs
2. **High** (Orange/Secondary): Maintenance tasks, high-priority items
3. **Medium** (Yellow/Chart-3): Medium-priority work
4. **Low** (Gray/Outline): Nice-to-have items

---

## Data Flow

```
Dashboard (useClient)
 Header (Repository Selection)
 Maintainer Briefing (AI Summary)
 Today's Priorities + Merge Queue
 Maintenance Queue + Security Overview
 Release Assistant + Repository Health
 Contributor Opportunities
```

### Key Props
- `isLoading`: Shows skeleton loading state
- `isEmpty`: Shows empty state before analysis
- `briefing`: Maintainer briefing data
- `analysis`: Repository analysis data

---

## Usage Example

```tsx
<MergeQueue
 pullRequests={analysis?.repository.openPullRequests ?? 0}
 isLoading={isAnalyzing}
 isEmpty={isEmpty}
/>
```

---

## Styling & Theming

### Common Classes
- `.glass-panel`: Frosted glass effect background
- `.glass-panel-hover`: Interactive hover states
- `.list-item-interactive`: Hoverable list items
- `.metric-tile`: Metric display cards
- `.section-glow`: Accent glow effect

### Design Tokens
- `--spacing`: Tailwind spacing scale (4px base)
- `--radius`: Border radius (rem-based)
- Color tokens: primary, secondary, chart-1 to chart-4, destructive

---

## Future Enhancements

- [ ] Connect Merge Queue to real GitHub PR data
- [ ] Link Security Overview to Dependabot alerts
- [ ] Real-time updates using WebSockets
- [ ] Custom task filtering and sorting
- [ ] Export dashboard as report
- [ ] Scheduled email summaries
