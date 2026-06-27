# Dashboard Revamp - Implementation Guide

## Overview

The OSS Command Center dashboard has been completely restructured to serve open source maintainers more effectively. The new layout prioritizes **actionable intelligence** over metrics dashboards, organizing information by urgency and importance.

---

## What Changed

### Core Restructuring

**Previous Layout:**
- Maintainer Briefing (top)
- Today's Priorities + Release Assistant + Repository Health (middle)
- Documentation Drift + Contributor Opportunities (bottom)

**New Layout:**
```
1. Maintainer Briefing (Hero - full width)
2. Today's Priorities + Merge Queue (Action row)
3. Maintenance Queue + Security Overview (Maintenance row)
4. Release Assistant + Repository Health (Planning row)
5. Contributor Opportunities (Community engagement)
```

---

## New Components

### 1. **MergeQueue** Component
**Location:** `src/components/merge-queue.tsx`

**Purpose:** Display top 3 AI-prioritized pull requests requiring review

**Features:**
- PR title and author information
- Priority level indicators (urgent/high/medium)
- Review count tracking
- Quick action button

**Props:**
```typescript
interface MergeQueueProps extends DashboardSectionStateProps {
  pullRequests?: number;
}
```

**Usage:**
```tsx
<MergeQueue
  pullRequests={analysis?.repository.openPullRequests ?? 0}
  isLoading={isAnalyzing}
  isEmpty={isEmpty}
/>
```

---

### 2. **MaintenanceQueue** Component
**Location:** `src/components/maintenance-queue.tsx`

**Purpose:** Aggregate README updates, CHANGELOG entries, and release prep tasks

**Features:**
- README update suggestions with AI insights
- CHANGELOG maintenance reminders
- Release preparation checklist
- Task type badges (readme/changelog/release/build)
- Click-through to detailed editor for README updates

**Props:**
```typescript
interface MaintenanceQueueProps extends DashboardSectionStateProps {
  release?: MaintainerBriefing['release'];
  documentation?: MaintainerBriefing['documentation'];
  onUpdateReadme?: (suggestion: string) => void;
}
```

**Usage:**
```tsx
<MaintenanceQueue
  release={briefing?.release}
  documentation={briefing?.documentation}
  isLoading={isAnalyzing}
  isEmpty={isEmpty}
  onUpdateReadme={hasSuccessfulResult ? handleUpdateReadme : undefined}
/>
```

---

### 3. **SecurityOverview** Component
**Location:** `src/components/security-overview.tsx`

**Purpose:** Display security vulnerabilities and compliance issues

**Features:**
- Severity-based color coding (Critical/High/Medium/Low)
- Outdated dependencies detection
- License compliance checks
- Security scanning status
- Review buttons for critical/high severity items

**Props:**
```typescript
interface SecurityOverviewProps extends DashboardSectionStateProps {
  analysis?: RepositoryAnalysis;
}
```

**Usage:**
```tsx
<SecurityOverview
  analysis={analysis}
  isLoading={isAnalyzing}
  isEmpty={isEmpty}
/>
```

---

## Dashboard Component Updates

**File:** `src/components/dashboard.tsx`

### Changes Made:

1. **Added imports for new components:**
```typescript
import MergeQueue from '@/components/merge-queue';
import MaintenanceQueue from '@/components/maintenance-queue';
import SecurityOverview from '@/components/security-overview';
```

2. **Reorganized main content grid:**
   - Section 1: Full-width Maintainer Briefing
   - Section 2: 2/3 width Today's Priorities + 1/3 width Merge Queue
   - Section 3: 1/2 width Maintenance Queue + 1/2 width Security Overview
   - Section 4: 2/3 width Release Assistant + 1/3 width Repository Health
   - Section 5: Full-width Contributor Opportunities

3. **Maintained responsiveness:**
   - Mobile: Single column layout
   - Desktop (≥1024px): Multi-column with strategic splits

---

## Layout Grid System

### Tailwind Classes Used:

```typescript
// Primary row (Today's & Merge)
<div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* 2/3 width on desktop */}
  </div>
  <div>
    {/* 1/3 width on desktop */}
  </div>
</div>

// Secondary row (Maintenance & Security)
<div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
  {/* 1/2 width each on desktop */}
</div>

// Tertiary row (Release & Health)
<div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* 2/3 width on desktop */}
  </div>
  <div>
    {/* 1/3 width on desktop */}
  </div>
</div>
```

---

## Component Styling Patterns

All new components follow consistent styling:

### Card Structure:
```tsx
<Card className="glass-panel glass-panel-hover border-0">
  <CardHeader>
    <SectionHeader
      icon={<IconComponent className="size-4" />}
      title="Section Title"
      description="Brief description"
      action={<Badge>{count}</Badge>}
    />
  </CardHeader>
  <CardContent>
    {/* Loading state */}
    {/* Empty state */}
    {/* Content */}
  </CardContent>
</Card>
```

### List Items:
```tsx
<div className="group list-item-interactive border-l-2 border-l-{color}/40">
  <div className="flex items-start gap-3">
    <div className="flex size-8 items-center justify-center rounded-lg {bgColor} ring-1 {ringColor}">
      <Icon className="size-4 {textColor}" />
    </div>
    <div className="min-w-0 flex-1">
      {/* Item content */}
    </div>
    <Button variant="ghost" size="icon-sm" className="shrink-0 opacity-0 group-hover:opacity-100">
      <ArrowRight className="size-4" />
    </Button>
  </div>
</div>
```

---

## Visual Hierarchy & Theming

### Color Coding by Priority:

| Priority | Color | Component | Usage |
|----------|-------|-----------|-------|
| Critical | `destructive` | Red badge, red border | Security alerts, blocked PRs |
| High | `secondary` (orange) | Orange badge, orange border | High-priority tasks |
| Medium | `chart-3` (yellow) | Yellow badge | Medium-priority items |
| Low | `primary` / `outline` | Gray/blue | Low-priority work |

### Icon Indicators:

- **AlertOctagon** - High priority items
- **AlertCircle** - Medium/Low priority
- **CheckCircle** - Completed/Healthy status
- **Clock** - Time-based alerts
- **GitPullRequest** - PR-related
- **FileText** - Documentation
- **Shield** - Security
- **Wrench** - Maintenance/Build

---

## State Management

All components follow the `DashboardSectionStateProps` pattern:

```typescript
interface DashboardSectionStateProps {
  isLoading: boolean;    // Show skeleton during analysis
  isEmpty: boolean;      // Show empty state before analysis
}
```

### States:
- **Loading**: Displays animated skeletons
- **Empty**: Displays "Analyze a repository to get started"
- **Populated**: Displays actual data

---

## Data Integration Points

### MergeQueue
- **Currently**: Mock data (3 sample PRs)
- **Can connect to**: GitHub API (`/repos/{owner}/{repo}/pulls`)
- **Sort by**: AI-determined priority score

### MaintenanceQueue
- **Currently**: Generated from briefing data
- **Can connect to**: File change analysis, README quality metrics
- **Triggers**: Documentation gaps, outdated info, release signals

### SecurityOverview
- **Currently**: Mock vulnerability data
- **Can connect to**: Dependabot, GitHub security alerts, license scanning
- **Severity calculation**: CVSS scores, license conflicts

---

## Adding Real Data

To connect these components to real data sources:

### 1. Update `analyzeRepositoryDashboard` action
```typescript
// src/actions/analyzeRepositoryDashboard.ts
const briefing = await generateMaintainerBriefing({
  // Include PR analysis
  pullRequests: analysis.repository.openPullRequests,
  // Include security data
  vulnerabilities: analysis.security,
  // Include maintenance flags
  documentationGaps: analysis.documentation,
});
```

### 2. Pass enhanced data to dashboard
```tsx
<MergeQueue
  pullRequests={briefing.pullRequests}  // From analyzed data
  isLoading={isAnalyzing}
  isEmpty={isEmpty}
/>
```

### 3. Connect to real APIs in components
Each component can fetch additional data via server actions or API routes.

---

## Responsive Behavior

### Mobile (< 1024px)
- All sections stack vertically
- Full-width cards
- Touch-friendly button sizes
- No hover states (use active states instead)

### Desktop (≥ 1024px)
- Multi-column grid layout
- Optimized scan pattern (left to right, top to bottom)
- Hover effects on interactive elements
- 2:1 and 1:1 column splits for visual variety

### Breakpoint
- Primary breakpoint: `lg` (1024px in Tailwind)
- Implemented using `grid-cols-1 gap-5 lg:grid-cols-{2|3}`

---

## Testing the Changes

### Visual Verification:
1. Navigate to `/app` (requires authentication)
2. Enter a repository (e.g., `vercel/next.js`)
3. Wait for analysis to complete
4. Verify layout and component rendering
5. Test responsive by resizing to mobile width

### Component-specific Tests:
- **MergeQueue**: Verify PR data displays and buttons work
- **MaintenanceQueue**: Check README action callback triggers
- **SecurityOverview**: Confirm severity colors match expected levels

### Responsive Testing:
- Desktop (1920px): Multi-column layout
- Tablet (768px): Starting to stack
- Mobile (375px): Full single-column

---

## Performance Considerations

### Rendering:
- Components use `'use client'` for interactivity
- Skeleton loaders show during analysis
- No unnecessary re-renders via memoization

### Bundle Size:
- New components: ~15KB total
- Uses existing dependencies (Lucide, Tailwind, shadcn/ui)
- No new external packages added

### Data Fetching:
- Analysis happens once on dashboard load
- Results cached in component state
- Could be enhanced with SWR for real-time updates

---

## Future Enhancements

### Phase 2:
- Real GitHub API data for MergeQueue
- Dependabot integration for SecurityOverview
- WebSocket updates for real-time sync

### Phase 3:
- Dashboard customization (hide/reorder sections)
- Export dashboard as PDF report
- Scheduled email summaries

### Phase 4:
- Custom alert thresholds
- Workflow automation
- Integration with other tools (Slack, Discord, etc.)

---

## Troubleshooting

### Components not rendering?
- Check that all new component files exist:
  - `src/components/merge-queue.tsx`
  - `src/components/maintenance-queue.tsx`
  - `src/components/security-overview.tsx`
- Verify imports in `src/components/dashboard.tsx`

### Styles not applying?
- Ensure Tailwind classes are recognized
- Check for typos in `glass-panel`, `list-item-interactive` classes
- Verify color tokens exist in theme configuration

### Data not showing?
- Verify `isLoading` and `isEmpty` props are correct
- Check browser console for errors
- Ensure analysis completed successfully before rendering

---

## Documentation Files

- **DASHBOARD_STRUCTURE.md** - Component documentation and data types
- **DASHBOARD_LAYOUT_GUIDE.md** - Visual layout and responsive design guide
- **DASHBOARD_IMPLEMENTATION.md** - This file: implementation details
