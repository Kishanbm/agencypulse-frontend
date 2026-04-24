# Phase 5.4 Frontend Implementation Plan

**Date**: 2026-04-22  
**Status**: Ready to implement  
**Alignment**: Backend Phase 5.1-5.3 complete, Production-ready patterns

---

## Executive Summary

Build **production-ready frontend dashboard viewer** with mock data first, then wire backend.

- **Backend ready**: Dashboard CRUD, batch widget data endpoint, 70/70 tests passing
- **Frontend template**: Google AI Studio clone (incomplete, needs refactoring)
- **Strategy**: UI first → mock data → backend integration
- **Production quality**: Role-based access, error isolation, per-widget loading, formatters

---

## Alignment with Backend

### API Contracts

#### 1. GET `/campaigns/:campaignId/dashboards`
**List all dashboards for a campaign**
```json
Response:
[
  {
    "id": "uuid",
    "name": "Main Dashboard",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": { "widgets": 12 }
  }
]
```
**Role**: CLIENT_USER and above

#### 2. GET `/campaigns/:campaignId/dashboards/:dashboardId`
**Get single dashboard with all widgets**
```json
Response:
{
  "id": "uuid",
  "name": "Main Dashboard",
  "isDefault": true,
  "widgets": [
    {
      "id": "uuid",
      "widgetType": "KPI|LINE_CHART|BAR_CHART|TABLE",
      "platform": "GA4|GOOGLE_ADS|META_ADS",
      "metricKeys": ["sessions", "conversions"],
      "config": { "aggregation": "sum", "comparison": "previous_period" },
      "position": { "x": 0, "y": 0, "w": 4, "h": 2 }
    }
  ]
}
```
**Role**: CLIENT_USER and above

#### 3. POST `/campaigns/:campaignId/dashboards/:dashboardId/widgets/data`
**Batch fetch all widget data in one call**

**Request**:
```json
{
  "widgetIds": ["uuid1", "uuid2", "uuid3"],
  "from": "2024-01-01",
  "to": "2024-01-31"
}
```

**Response**:
```json
{
  "results": [
    {
      "widgetId": "uuid1",
      "widgetType": "KPI",
      "data": {
        "current": { "sessions": 1500, "conversions": 120 },
        "previous": { "sessions": 1200, "conversions": 100 }
      }
    },
    {
      "widgetId": "uuid2",
      "widgetType": "LINE_CHART",
      "data": [
        { "date": "2024-01-01", "sessions": 100, "conversions": 8 },
        { "date": "2024-01-02", "sessions": 120, "conversions": 10 }
      ]
    },
    {
      "widgetId": "uuid3",
      "widgetType": "KPI",
      "data": null  // Failed to fetch
    }
  ]
}
```
**Role**: CLIENT_USER and above

---

## Role-Based Access Control (Frontend)

### Display Logic

| Role | DashboardsList | DashboardViewer | Edit Button |
|---|---|---|---|
| **AGENCY_OWNER** | ✅ All clients | ✅ View + Edit | ✅ Enabled |
| **AGENCY_ADMIN** | ✅ All clients | ✅ View + Edit | ✅ Enabled |
| **AGENCY_STAFF** | ✅ Assigned only | ✅ View only | ❌ Disabled |
| **CLIENT_USER** | ✅ Their client | ✅ View only | ❌ Disabled |

### Implementation

- **Trust backend**: Backend enforces RLS, returns only accessible dashboards
- **Frontend**: No role checks needed (backend guarantees access)
- **UX**: Show "Read-only" badge for non-admins in DashboardViewer

---

## How Competitors Do It (AgencyAnalytics Pattern)

1. **Dashboard List View**
   - Grid/list of dashboards with basic metadata
   - Click to open detail
   - Show widget count + last updated
   - "Create Dashboard" button (admins only)

2. **Dashboard Detail View**
   - Date range picker at top
   - Responsive 12-column grid
   - Widgets load independently (no page-level loading)
   - Per-widget skeleton state
   - Per-widget error with retry button

3. **Widget Components**
   - KPI: Large number + optional trend % + comparison
   - LineChart: Time-series with interactive tooltip
   - BarChart: Categorical data with responsive sizing
   - Table: Sortable columns, paginated or scrollable

4. **Data Fetching**
   - Single batch API call on mount
   - Refetch on date range change
   - TanStack Query for caching
   - Per-widget retry (not whole page)

---

## File Structure

```
src/
├── pages/dashboard/
│   ├── client/
│   │   ├── DashboardsList.tsx       (list all dashboards)
│   │   └── DashboardViewer.tsx      (view one dashboard + widgets)
│   └── ClientDetail.tsx             (update routing only)
├── components/dashboard/
│   ├── DateRangePicker.tsx          (date range controls)
│   ├── DashboardGrid.tsx            (12-col responsive grid)
│   └── widgets/
│       ├── WidgetRenderer.tsx       (factory component)
│       ├── KPIWidget.tsx
│       ├── LineChartWidget.tsx
│       ├── BarChartWidget.tsx
│       ├── TableWidget.tsx
│       ├── WidgetSkeleton.tsx       (per-widget loading)
│       └── WidgetError.tsx          (per-widget error + retry)
├── hooks/
│   └── useDashboardData.ts          (TanStack Query)
└── lib/
    ├── formatters.ts                (1.2K, $1,234, 12.3%)
    └── mapWidgetData.ts             (array → keyed object)
```

---

## Mock Data Strategy

### Phase 1: Mock Dashboard & Widgets

**DashboardsList mock**:
```typescript
const mockDashboards = [
  { id: '1', name: 'Main Dashboard', isDefault: true, _count: { widgets: 4 } },
  { id: '2', name: 'Performance', isDefault: false, _count: { widgets: 3 } },
];
```

**DashboardViewer mock**:
```typescript
const mockDashboard = {
  id: '1',
  name: 'Main Dashboard',
  widgets: [
    { id: 'w1', widgetType: 'KPI', ... },
    { id: 'w2', widgetType: 'LINE_CHART', ... },
  ],
};

const mockWidgetData = {
  results: [
    {
      widgetId: 'w1',
      widgetType: 'KPI',
      data: { current: { sessions: 1500, conversions: 120 }, previous: { ... } }
    },
    {
      widgetId: 'w2',
      widgetType: 'LINE_CHART',
      data: [{ date: '2024-01-01', sessions: 100, conversions: 8 }, ...]
    },
  ]
};
```

---

## Key Design Decisions

1. **WidgetRenderer** — Factory component, switches on `widgetType`, returns correct component
   - Keeps DashboardViewer clean
   - Scales to new widget types
   - Replaces inline conditionals

2. **mapWidgetData helper** — Converts batch API response
   ```typescript
   const widgetDataMap = mapWidgetData(results);
   // widgetDataMap[widgetId] → widget data
   ```

3. **Per-widget error isolation** — One widget fails, others still load
   - WidgetError component with retry button
   - No page-level error state

4. **TanStack Query caching** — Stale data until date range changes
   ```typescript
   const { data, isLoading, error } = useQuery({
     queryKey: ['dashboardData', campaignId, dashboardId, from, to],
     staleTime: 5 * 60 * 1000,
     retry: 1,
   });
   ```

5. **KPI Formatting** — Professional number display
   - Numbers: 1,234,567 → 1.2M
   - Currency: $5000 → $5K
   - Percent: 0.234 → 23.4%

6. **Date Range Picker** — Simple React `useState`, not Zustand
   - Changes trigger refetch via TanStack Query

7. **Responsive Grid** — 12-column layout
   - Mobile: 1 column
   - Tablet: 2 columns
   - Desktop: 4 columns
   - Widgets specify grid position

8. **Loading Strategy** — Per-widget skeletons, not whole page
   - Renders layout immediately
   - Each widget shows Recharts shimmer
   - No page-level spinner

9. **Empty States** — Handle zero data gracefully
   - KPI: "No data"
   - Chart: "No data available"
   - Table: Empty state message

10. **Error Handling** — Graceful widget-level failures
    - Try/catch in batch endpoint (already done)
    - Widget shows error UI + retry
    - Single retry per widget

---

## Implementation Order (Production-First)

### Phase 5.4a: Build UI with Mock Data

1. **Routing** — Update ClientDetail to support nested dashboard routes
2. **DashboardsList** — Mock list of dashboards, click to open
3. **DashboardViewer** — Mock dashboard layout with placeholder widgets
4. **Widget Components** — KPI, LineChart, BarChart, Table (mock data)
5. **WidgetRenderer** — Factory component for widget type switching
6. **Helpers** — Formatters, mapWidgetData, DateRangePicker
7. **Error/Loading States** — WidgetSkeleton, WidgetError, per-widget loading
8. **Styling & Polish** — Responsive layout, transitions, hover effects

### Phase 5.4b: Backend Integration (Later)

1. Replace mock `useDashboardData` with real TanStack Query hook
2. Call real `/dashboards` list endpoint
3. Call real `/dashboards/:id` detail endpoint
4. Call real batch `/widgets/data` endpoint
5. Handle real error states + retry logic

---

## Production-Ready Checklist

✅ API contract alignment (batch endpoint ready)  
✅ Role-based display (no editing for non-admins)  
✅ Per-widget error isolation  
✅ Per-widget loading states  
✅ KPI formatting (1.2K, $5K, 23.4%)  
✅ Empty state UI  
✅ Responsive grid (mobile, tablet, desktop)  
✅ TanStack Query caching  
✅ WidgetRenderer factory  
✅ mapWidgetData helper  
✅ TypeScript strict types  
✅ Shadcn UI components  
✅ Recharts integration  

---

## Success Criteria

After Phase 5.4a (before backend integration):
- ✅ DashboardsList shows 2+ mock dashboards
- ✅ Click dashboard opens DashboardViewer
- ✅ Dashboard shows 4+ widget cards with mock data
- ✅ Date range picker visible + functional
- ✅ Each widget shows skeleton while "loading"
- ✅ Widgets display KPI, line chart, bar chart, table with mock data
- ✅ All numbers formatted correctly (1.2K, $5K, 23.4%)
- ✅ Non-admin role shows "Read-only" badge
- ✅ Responsive on mobile, tablet, desktop

After Phase 5.4b (backend integration):
- ✅ Real dashboards loaded from API
- ✅ Real widget data fetched via batch endpoint
- ✅ Date range changes trigger refetch
- ✅ Widget errors show error UI + retry
- ✅ No console errors

---

## Notes

- **No backend changes** — Phase 5.1-5.3 complete, API ready
- **Frontend only** — Pure React UI, no server.ts or Express
- **TanStack Query** — Already in dependencies
- **Recharts** — Already in use (Overview.tsx example)
- **Shadcn UI** — Already set up

Start: Step 1 (Routing update)
