# Dashboard Layout Guide - Visual Structure

## ASCII Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER                              │
│  Repository Picker | Analysis Status | User Menu            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           MAINTAINER BRIEFING (Full Width)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Summary Text                                             ││
│  │ Health Score: 78/100 | Est Time: 45min | Status: Healthy││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬─────────────────────┐
│  TODAY'S PRIORITIES                  │  MERGE QUEUE        │
│  (2/3 width)                         │  (1/3 width)        │
│  ┌──────────────────────────────────┐│┌───────────────────┐│
│  │ [HIGH] Fix auth bug              │││ PR#123: Security  ││
│  │ [MEDIUM] Update docs             │││ PR#124: Features  ││
│  │ [LOW] Refactor utils             │││ PR#125: Deps      ││
│  └──────────────────────────────────┘│└───────────────────┘│
└──────────────────────────────────────┴─────────────────────┘

┌──────────────────────────────────────┬─────────────────────┐
│  AI MAINTENANCE QUEUE                │  SECURITY OVERVIEW  │
│  (1/2 width)                         │  (1/2 width)        │
│  ┌──────────────────────────────────┐│┌───────────────────┐│
│  │ README: Add API docs             │││ 🔴 Outdated deps  ││
│  │ CHANGELOG: Add v2.1 notes        │││ 🟡 License issue  ││
│  │ RELEASE: Prepare v2.1.0          │││ 🟢 Scanning OK    ││
│  └──────────────────────────────────┘│└───────────────────┘│
└──────────────────────────────────────┴─────────────────────┘

┌──────────────────────────────────────┬─────────────────────┐
│  RELEASE ASSISTANT                   │  REPOSITORY HEALTH  │
│  (2/3 width)                         │  (1/3 width)        │
│  ┌──────────────────────────────────┐│┌───────────────────┐│
│  │ Version bump suggestions          │││ ⭐ 1.2K           ││
│  │ Changelog generation              │││ 🔀 245 Forks      ││
│  │ Release checklist                 │││ 🐛 89 Issues      ││
│  └──────────────────────────────────┘│└───────────────────┘│
└──────────────────────────────────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          CONTRIBUTOR OPPORTUNITIES (Full Width)             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Good first issues | Mentoring opportunities             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Desktop Layout (≥ 1024px)

### Row 1: Maintainer Briefing
```
┌─────────────────────────────────┐
│    Maintainer Briefing (100%)    │
│    lg:col-span-1 (Full width)    │
└─────────────────────────────────┘
```

### Row 2: Today's Priorities & Merge Queue
```
┌──────────────────────────┬─────────────┐
│ Today's Priorities       │ Merge Queue │
│ lg:col-span-2 (66.67%)   │ lg:col-1    │
│ space-y-5                │ (33.33%)    │
└──────────────────────────┴─────────────┘
Grid: grid-cols-1 gap-5 lg:grid-cols-3
```

### Row 3: Maintenance & Security
```
┌──────────────────────┬──────────────────────┐
│ Maintenance Queue    │ Security Overview    │
│ lg:col-span-1        │ lg:col-span-1        │
│ (50%)                │ (50%)                │
└──────────────────────┴──────────────────────┘
Grid: grid-cols-1 gap-5 lg:grid-cols-2
```

### Row 4: Release & Repository Health
```
┌──────────────────────────┬─────────────┐
│ Release Assistant        │ Repository  │
│ lg:col-span-2 (66.67%)   │ Health      │
│                          │ lg:col-1    │
│                          │ (33.33%)    │
└──────────────────────────┴─────────────┘
Grid: grid-cols-1 gap-5 lg:grid-cols-3
```

### Row 5: Contributor Opportunities
```
┌─────────────────────────┐
│ Contributor            │
│ Opportunities (100%)    │
└─────────────────────────┘
Grid: grid-cols-1 gap-5 (Full width)
```

---

## Mobile Layout (< 1024px)

All sections stack vertically in a single column:

```
1. Maintainer Briefing
2. Today's Priorities
3. Merge Queue
4. Maintenance Queue
5. Security Overview
6. Release Assistant
7. Repository Health
8. Contributor Opportunities
```

---

## Component Widths in Tailwind

| Component | Desktop | Mobile | Tailwind Classes |
|-----------|---------|--------|------------------|
| Maintainer Briefing | 100% | 100% | `grid-cols-1` |
| Today's Priorities | 66% | 100% | `lg:col-span-2` |
| Merge Queue | 33% | 100% | `lg:col-span-1` |
| Maintenance Queue | 50% | 100% | `lg:col-span-1` |
| Security Overview | 50% | 100% | `lg:col-span-1` |
| Release Assistant | 66% | 100% | `lg:col-span-2` |
| Repository Health | 33% | 100% | `lg:col-span-1` |
| Contributor Opp. | 100% | 100% | `grid-cols-1` |

---

## Spacing & Gaps

```typescript
// Container spacing
px-6 py-10  // Horizontal and vertical padding

// Section gaps
gap-5       // 1.25rem (20px) between sections
mb-8        // 2rem (32px) between major sections

// Internal component spacing
p-6         // Padding inside cards
space-y-2.5 // Vertical spacing for list items
```

---

## Visual Hierarchy

### Primary Sections (Highest Priority)
1. **Today's Priorities** - Action items
2. **Merge Queue** - Code review needs

### Secondary Sections (Important)
3. **Maintenance Queue** - Documentation & releases
4. **Security Overview** - Vulnerability alerts

### Tertiary Sections (Reference)
5. **Release Assistant** - Version management
6. **Repository Health** - Metrics

### Supplementary
7. **Contributor Opportunities** - Community engagement

---

## Component Order in Code

```tsx
<main>
  {/* Section 1 */}
  <section>
    <MaintainerBriefing />
  </section>

  {/* Section 2: Primary Row */}
  <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <TodaysPriorities />
    </div>
    <div>
      <MergeQueue />
    </div>
  </div>

  {/* Section 3: Secondary Row */}
  <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
    <MaintenanceQueue />
    <SecurityOverview />
  </div>

  {/* Section 4: Release Row */}
  <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <ReleaseAssistant />
    </div>
    <div>
      <RepositoryHealth />
    </div>
  </div>

  {/* Section 5: Full Width */}
  <div>
    <ContributorOpportunities />
  </div>
</main>
```

---

## Responsive Breakpoints

### Tailwind Breakpoints Used
- `md`: 768px - Used for some internal component layouts
- `lg`: 1024px - **PRIMARY** breakpoint for dashboard layout
- Default (mobile-first): Single column layout

### Media Query Strategy
```css
/* Mobile-first approach */
.grid-cols-1           /* Default: 1 column */
lg:grid-cols-2         /* At lg+: 2 columns */
lg:grid-cols-3         /* At lg+: 3 columns */
lg:col-span-1          /* At lg+: Take 1 column of parent */
lg:col-span-2          /* At lg+: Take 2 columns of parent */
```

---

## Scroll Behavior

- **Full-page scroll**: Natural vertical scroll
- **No horizontal scroll**: All content fits within viewport width
- **Lazy loading**: Sections load as dashboard analysis completes
- **Fixed header**: Navigation stays accessible while scrolling

---

## Future Layout Adjustments

Potential responsive enhancements:

```tsx
// Could add XL breakpoint for larger screens
xl:grid-cols-4  // Four-column layout on very wide screens

// Could add sticky sections
sticky top-20   // Keep certain cards visible while scrolling

// Could add compact view option
data-view="compact"  // Toggle between detailed/compact layouts
```
