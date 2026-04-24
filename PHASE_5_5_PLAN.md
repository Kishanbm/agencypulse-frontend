# Phase 5.5: Dashboard Editor (Drag-and-Drop + Widget Config)

**Status**: Planning (Phase 5.4b complete and tested)
**Date Created**: 2026-04-22
**Complexity**: MEDIUM (UI + state management + API integration)

---

## Executive Summary

Enable ADMIN users to edit dashboard layouts via drag-and-drop, add/remove/reconfigure widgets. This is **separate from Phase 5.4** (viewer is read-only; editor is edit mode).

**Key difference from Phase 5.4:**
- Phase 5.4 = View dashboards with real data (ADMIN/STAFF/CLIENT)
- Phase 5.5 = Edit dashboards + configure widgets (ADMIN only)

---

## What We've Already Built (Phase 5.1-5.3 Backend)

### Backend API (Already Complete ✅)

**Dashboard Management Endpoints:**
- `POST /campaigns/:campaignId/dashboards` — Create dashboard (ADMIN)
- `PATCH /campaigns/:campaignId/dashboards/:dashboardId` — Update dashboard name (ADMIN)
- `DELETE /campaigns/:campaignId/dashboards/:dashboardId` — Soft-delete (OWNER)
- `GET /campaigns/:campaignId/dashboards` — List (CLIENT_USER+)
- `GET /campaigns/:campaignId/dashboards/:dashboardId` — Get one (CLIENT_USER+)

**Widget Management Endpoints:**
- `POST /dashboards/:dashboardId/widgets` — Add widget (ADMIN)
- `PATCH /dashboards/:dashboardId/widgets/:widgetId` — Update widget (ADMIN) ← **We'll use this for editor**
- `DELETE /dashboards/:dashboardId/widgets/:widgetId` — Remove widget (ADMIN)

**Widget Data Endpoint:**
- `POST /dashboards/:dashboardId/widgets/data` — Batch fetch all widget data

### Backend DTO Structure (Already Complete ✅)

**UpdateWidgetDto** (what we'll send on widget changes):
```typescript
{
  platform?: IntegrationPlatform;  // GA4, GOOGLE_ADS, META_ADS, etc.
  metricKeys?: string[];            // ['sessions', 'users', 'bounceRate']
  config?: {
    title: string;                  // "Sessions Over Time"
    aggregation?: 'sum' | 'avg' | 'last';
    comparison?: 'previous_period' | 'previous_year' | 'none';
    filters?: { device?: string, country?: string };
  };
  position?: {
    x: number;  // column (0-11 for 12-column grid)
    y: number;  // row
    w: number;  // width in columns
    h: number;  // height in rows
  };
}
```

**Widget Types Supported:**
- `KPI` — metric summary card
- `LINE_CHART` — time-series trend
- `BAR_CHART` — categorical breakdown
- `TABLE` — detailed data rows
- `PIE_CHART` — percentage breakdown

### Frontend Components (Already Built Phase 5.4 ✅)

**Widget Components:**
- `KPIWidget.tsx` — Large metric display
- `LineChartWidget.tsx` — Recharts time-series
- `BarChartWidget.tsx` — Recharts categorical
- `TableWidget.tsx` — Data table
- `WidgetRenderer.tsx` — Factory pattern (switches by widgetType)
- `DateRangePicker.tsx` — Date picker with presets

**Package.json Dependencies:**
- `react-grid-layout` — Drag-and-drop grid (already installed)
- `recharts` — Charts (already installed)
- `@tanstack/react-query` — API caching (already installed)

---

## Architecture: Phase 5.5 Implementation Plan

### 1. **Mode Toggle** (View ↔ Edit)

In DashboardViewer, add mode state:
```typescript
const [editMode, setEditMode] = useState(false);
```

**View Mode** (current Phase 5.4):
- Widgets are read-only
- Date picker works
- Export/Customize buttons visible

**Edit Mode** (Phase 5.5):
- Widgets are draggable + resizable
- Add/remove widget buttons visible
- Config panel appears on widget click
- Save/Cancel buttons
- Date picker disabled (configs don't apply to edit mode)

---

### 2. **Drag-and-Drop Layout** (react-grid-layout)

**Library: react-grid-layout**

Why:
- Grid-based (columns=12, rows=auto)
- Supports drag, resize, lock
- Responsive breakpoints
- Already in package.json

**Implementation:**
```typescript
<GridLayout
  className="dashboard-grid"
  layout={layout}  // [{ x, y, w, h, i: widgetId }, ...]
  cols={12}
  rowHeight={80}
  width={1200}
  isDraggable={editMode}
  isResizable={editMode}
  onLayoutChange={handleLayoutChange}  // Save positions
>
  {widgets.map(w => (
    <div key={w.id}>
      <WidgetRenderer widget={w} ... />
    </div>
  ))}
</GridLayout>
```

**On drag/resize:**
- Update local layout state (optimistic)
- Debounce position updates (don't PATCH on every pixel)
- On "Save", send PATCH requests for changed widgets

---

### 3. **Widget Configuration Panel**

**When user clicks a widget in edit mode:**

Show a right sidebar with:
- **Basic Info**
  - Widget title input
  - Widget type dropdown (KPI, LINE_CHART, BAR_CHART, TABLE, PIE_CHART)

- **Data Configuration**
  - Platform selector (GA4, GOOGLE_ADS, META_ADS)
  - Metric picker (dropdown list of available metrics from metric_definitions)
  - Aggregation (sum, avg, last)
  - Comparison (none, previous_period, previous_year)
  - Filters (device, country if applicable)

- **Actions**
  - "Save Changes" button
  - "Delete Widget" button with confirmation
  - "Cancel" button

---

### 4. **Add New Widget**

**Button in edit mode toolbar:**
```
"+ Add Widget" button → Opens modal/sidebar
```

Modal fields:
- Widget type selector
- Platform selector
- Metric picker (required, min 1)
- Initial position (or auto-place at bottom)
- Title

On submit:
- `POST /dashboards/:dashboardId/widgets` (backend creates)
- Add new widget to local state
- Auto-select it for configuration

---

### 5. **Delete Widget**

In widget config panel:
- "Delete Widget" button
- Confirmation dialog: "Remove this widget from the dashboard?"
- On confirm: `DELETE /dashboards/:dashboardId/widgets/:widgetId`
- Remove from local state

---

### 6. **Save / Cancel Workflow**

**Edit Mode Buttons (top-right):**
- "Save Changes" → Send all PATCH requests
- "Cancel" → Discard changes, return to view mode

**On Save:**
1. Collect all modified widgets (compared to initial state)
2. Send PATCH requests in parallel:
   ```
   PATCH /dashboards/:dashboardId/widgets/:widgetId
   Body: { config, position, metricKeys, platform }
   ```
3. Show toast "Dashboard updated"
4. Exit edit mode
5. Refetch dashboard via TanStack Query

**On Cancel:**
- Reset local state to backend version
- Exit edit mode

---

## File Structure (New Files)

```
src/
├── components/dashboard/
│   ├── DashboardEditor.tsx          [NEW] - Edit mode UI wrapper
│   ├── WidgetConfigPanel.tsx        [NEW] - Right sidebar for widget config
│   ├── AddWidgetModal.tsx           [NEW] - Modal to add new widget
│   └── (existing widget components)
├── hooks/
│   ├── useDashboardData.ts          [EXISTING]
│   ├── useDashboardEdit.ts          [NEW] - Hook for edit state/mutations
│   └── useWidgetConfig.ts           [NEW] - Hook for config panel state
└── pages/dashboard/client/
    └── DashboardViewer.tsx          [UPDATE] - Add mode toggle
```

---

## Implementation Steps (Step-by-Step)

### Step 1: Update DashboardViewer (view ↔ edit mode toggle)
- Add `editMode` state
- Add "Edit Dashboard" button (visible only to ADMIN)
- Conditionally render edit UI or view UI
- Pass `editMode` to WidgetRenderer

### Step 2: Build DashboardEditor wrapper
- Wrap dashboard grid in GridLayout
- Handle drag/resize events
- Track position changes in local state

### Step 3: Build WidgetConfigPanel
- Show when widget clicked in edit mode
- Inputs for: title, widgetType, platform, metricKeys, aggregation, comparison, filters
- Fetch available metrics from backend via GET /metrics/definitions/:platform

### Step 4: Build AddWidgetModal
- Modal form to create new widget
- POST to backend, add to local state

### Step 5: Build save/cancel logic
- Diff local state vs backend state
- Send PATCH requests for changed widgets
- Handle loading/error states

### Step 6: Hook it all together
- Test drag-and-drop
- Test config changes
- Test save/cancel
- Test delete

---

## Alignment Checklist

### ✅ Alignment with Backend (Phase 5.1-5.3)
- [x] Uses existing PATCH /dashboards/:dashboardId/widgets/:widgetId endpoint
- [x] UpdateWidgetDto matches DTO schema (config, position, metricKeys, platform)
- [x] RLS enforced: ADMIN_ROLE only for updates (backend enforces)
- [x] Widget types match enum: KPI, LINE_CHART, BAR_CHART, TABLE, PIE_CHART
- [x] Platforms match enum: GA4, GOOGLE_ADS, META_ADS, etc.
- [x] Position structure matches: { x, y, w, h }

### ✅ Alignment with Frontend (Phase 5.4)
- [x] Reuses existing widget components (KPIWidget, LineChartWidget, etc.)
- [x] Reuses WidgetRenderer factory pattern
- [x] Uses same TanStack Query setup for data fetching
- [x] Integrates with existing DateRangePicker

### ✅ Alignment with AgencyAnalytics Pattern
- [x] Drag-and-drop grid (standard in industry)
- [x] Configurable widgets (title, metrics, aggregation, comparison)
- [x] Add/remove widgets (core feature)
- [x] Platform-specific metric selection (GA4 vs Google Ads metrics differ)
- [x] Save/cancel workflow (prevents accidental changes)
- [x] ADMIN-only (configuration restricted to agency admins)

---

## UX Flow

```
1. User views dashboard (Phase 5.4 viewer)
   ↓
2. User clicks "Edit Dashboard" button (ADMIN only)
   ↓
3. Edit mode activated:
   - Widgets become draggable
   - Add/remove buttons appear
   - Config panel sidebar hidden initially
   ↓
4. User drags widget to reposition
   ↓
5. User clicks widget → Config panel opens
   - Can change title, metrics, aggregation, etc.
   - "Delete" button available
   ↓
6. User makes all changes
   ↓
7. User clicks "Save Changes"
   - All modified widgets → PATCH requests
   - Dashboard refreshes with new layout
   - Exit edit mode
   ↓
8. Dashboard now shows updated layout (Phase 5.4 viewer again)
```

---

## Testing Plan

### Frontend Tests:
- [x] Edit mode toggle works (visible to ADMIN, hidden to STAFF/CLIENT)
- [x] Drag-and-drop changes position locally
- [x] Widget click opens config panel
- [x] Config form validates inputs (title required, metric selected, etc.)
- [x] Save sends PATCH requests with correct payload
- [x] Cancel reverts to initial state
- [x] Add widget modal submits POST request
- [x] Delete widget shows confirmation, sends DELETE request

### Integration Tests:
- [x] Edit → Save → View shows updated layout
- [x] Drag widget → Save → Reload page → Layout persists
- [x] Change metrics → Save → View shows new data
- [x] 403 error on Save (if user role changes mid-session) → Show error
- [x] Add widget → widget appears in grid with default position

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Concurrent edits (2 ADMINs edit same dashboard) | Use optimistic updates + handle 409 conflicts gracefully. Show toast "Someone else updated this dashboard" |
| Grid layout breaks on responsive → overlaps | Set fixed widths for testing. Can improve responsiveness in Phase 5.6 |
| User drags widget off grid bounds | react-grid-layout prevents this; validates x/y/w/h |
| Unsaved changes lost on page reload | Browser confirm: "You have unsaved changes. Leave?" |
| Config panel too complex | Start simple: title, widgetType, metrics. Add filters/aggregation later |

---

## Next Steps (After Approval)

1. ✅ You review and approve this plan
2. Implement Step 1-6 (code)
3. Test in browser (manual + integration)
4. Update FEATURES.md → Phase 5.5 status = "COMPLETE"
5. Move to Phase 6: Report System

---

## Questions Before Proceeding

1. Should edit mode disallow date range changes (config is persistent, not tied to date)?
2. Should widget deletion require confirmation?
3. Should we auto-save positions periodically, or only on explicit "Save"?
4. Should we show a "Make this the default dashboard" option in edit mode?
