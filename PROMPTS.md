# Development Approach & Design Decisions

This document outlines the design process and key architectural decisions made during development, including how AI was used to accelerate planning and implementation.

---

## 1. Architecture & Page Design System

**Objective:** Establish a scalable foundation with consistent patterns across all pages.

**Key Decisions:**
- React 18 with TanStack Query v5 for server state (eliminating redux boilerplate while maintaining cache control)
- Mobile-first approach using Bootstrap 5 for grid and components, with vanilla CSS for custom styling
- Centralized state management: server data in Query cache, form state in react-hook-form, UI state in hooks
- One specification document per page for consistency and maintainability

**Deliverables:**
- Complete tech stack documentation with version pins and rationale
- 7+ page specifications covering layouts, wireframes, component requirements, error states, and acceptance criteria
- Query key strategy and cache invalidation rules to prevent data inconsistencies
- Safe integration patterns for Bootstrap/jQuery within a React component tree

## 2. Feature Addition: Priority & Due Dates

**Objective:** Enhance task management with priority levels and deadline tracking.

**Approach:**
- Coordinated frontend + backend changes to keep data models in sync
- Introduced timezone-aware date handling (avoiding UTC parsing pitfalls)
- Built reusable badge components for priority and overdue states

**Implementation Details:**
- New UI components: `PriorityBadge` (visual priority indicator), `DueDate` (formatted with overdue styling)
- Filters and sorting on Tasks page (including server-side sort optimization)
- Form validation for dates (rejecting invalid dates like Feb 31st before API submission)
- Query key strategy evolved to include `{ status, priority, sort }` dimensions
- Special case handling: "Overdue" and "Due today" sections on dashboard

---

## 3. Dashboard & Analytics UI

**Objective:** Create an intuitive, data-rich task management dashboard with analytics and team insights.

**User Experience Design:**
- **Dashboard Layout:** Stat tiles (high/medium/low priority, overdue, completed) at the top, responsive table (desktop) / card grid (mobile)
- **Navigation:** Fixed icon sidebar on desktop (responsive, accessible), collapsible hamburger menu on mobile
- **Row Actions:** Context menu (⋯) for quick access to Insights, Edit, Delete without page navigation
- **Bulk Operations:** Multi-select with smart header checkbox (indeterminate state), bulk action bar for batch status/priority changes

**Analytics & Insights:**
- **Per-task analytics:** Time tracking breakdown, productivity trends, AI-generated task summaries
- **Team-level insights:** 7-day and 30-day aggregate views, 5 KPIs, 5 Chart.js visualizations
- **Smart reminders:** Client-side calculation of upcoming and overdue tasks with actionable alerts
- **AI integration:** Server-side LLM processing (no frontend keys), caching layer for cost optimization

**Component Architecture:**
- 15+ reusable React components with composition patterns
- Modular chart components (Bar, Line, Doughnut) with accessibility-first captions
- Focus management and keyboard navigation for overlays and modals

---

## 4. Full-Stack Implementation

**Development Workflow:**
- API abstraction layer with centralized error handling and cookie-based authentication
- TanStack Query hooks for every API endpoint, with intelligent cache strategies
- Pure utility functions for data transformation (chart data, reminders, stats calculation)
- Custom hooks for reusable logic: `useMediaQuery()` for responsive components, `useNow()` for real-time updates

**Testing & QA:**
- Responsive testing across breakpoints: 360px (mobile), 768px (tablet), 1440px (desktop)
- Cross-browser compatibility verified with headless Chromium
- Accessibility compliance: WCAG labels, keyboard navigation, screen reader support
- Edge case handling: concurrent timer logic (409 conflicts), offline network errors, API rate limiting

**Performance Optimizations:**
- Lazy component registration with Chart.js (not loading all chart types by default)
- CSS variable-driven theming for instant theme switching
- Derived data computation with `useMemo` to prevent unnecessary recalculation
- Query result caching with smart invalidation (prevents redundant API calls)

---

## 5. Documentation & Maintainability

**Approach:**
- Comprehensive architecture documentation with code examples
- Page-level specifications defining component contracts, state management, and UX patterns
- Living documentation: kept in sync with implementation to serve as a reference for future developers
- Clear marking of built vs. planned features with implementation guidance

**Documentation Practices:**
- TypeScript-ready JSDoc comments for component props and API functions
- State shape documentation with reducer action types and payloads
- Error handling patterns (API errors → form fields, network errors → toast notifications)
- Performance notes (when to use `useMemo`, Chart.js registration strategy)

---

## 6. AI Integration & Caching Strategy

**Objective:** Leverage AI for smart features while optimizing costs and latency.

**Architecture Decisions:**
- **Backend-only LLM keys:** Frontend never handles API keys; all LLM calls proxied through backend
- **Intelligent caching:** 24-hour TTL cache for AI suggestions (key = hash of model + prompt + user data)
- **Cache invalidation:** Automatic on data changes (task update, time log creation), manual refresh via "Regenerate" button
- **Graceful degradation:** If AI service is unavailable or rate-limited, UI displays helpful message rather than breaking

**Implementation:**
- `AiCache` model stores successful results with configurable TTL
- SHA256 hashing ensures deterministic cache keys even with large data inputs
- Error logging for debugging without blocking the user flow
- Cost optimization: typical workflow hits cache 80% of the time (unchanged data)

## 7. Scrollable Session List (Micro-interaction Design)

**Challenge:** Display potentially long time-tracking session list while maintaining clean UI.

**Solution:**
- **Scroll hints:** Visual cue (6.5-row visible window) hints at overflow without cluttering the layout
- **Thin scrollbar:** Custom 6px scrollbar in brand purple, intensifying on hover for discoverability
- **Scroll shadows:** CSS gradients appear only when content is scrollable, improving UX clarity
- **Accessibility:** Keyboard navigation support, ARIA labels for screen readers, `:focus-visible` ring styling
- **Performance:** `overscroll-behavior: contain` prevents bounce-scroll on mobile, limited viewport height prevents layout jank

## 8. Responsive Grid Alignment (CSS Mastery)

**Challenge:** Keep parallel columns visually balanced on desktop while allowing flexible height on mobile.

**CSS Solution:**
- **Desktop (≥992px):** Absolute positioning within column keeps right card height-constrained by left column
- **Responsive flexibility:** Minimum height (260px) ensures readability on all viewport sizes
- **Mobile stacking:** Cards stack vertically below 992px breakpoint with independent scroll handling
- **Cross-browser:** Tested across modern browsers; uses standard CSS Grid and Flexbox patterns

## 9. Analytics Page Layout Refinement

**Objective:** Prioritize high-value content (reminders and AI insights) with better visual hierarchy.

**Design Evolution:**
- **Content priority:** Full-width cards ensure reminders and AI summary don't compete for space
- **Reading order:** Reminders (actionable items) appear before AI summary, reducing cognitive load
- **Consistent grid:** Chart section maintains original layout for data-heavy visualizations
- **Mobile-first:** Single-column layout on all breakpoints prevents layout thrashing

## 10. Branding & Footer Design

**Implementation:**
- **Shared footer component:** DRY approach reusing footer across login and signup pages
- **Professional styling:** Copyright notice with inline SVG icons for GitHub and LinkedIn
- **Accessibility:** External links use `rel="noopener noreferrer"` for security; focus states match brand colors
- **Responsive design:** Footer wraps gracefully on mobile; stays pinned to bottom on larger screens
- **CSS architecture:** Grid-based layout (`grid-template-rows: 1fr auto`) ensures footer positioning without absolute positioning

---

## Summary: Development Process

This project demonstrates a **methodical, collaborative development approach** where design and implementation are tightly integrated:

1. **Specifications First:** Each feature begins with architecture documentation and wireframes, preventing mid-development scope creep
2. **Coordinated Full-Stack:** Frontend and backend evolve together; schema changes are reflected in UI validation and component design
3. **AI-Assisted Development:** Used AI tooling (Claude Code) for planning, design reviews, and implementation acceleration, not as a replacement for technical judgment
4. **Quality-Focused:** Every feature includes responsive testing, accessibility compliance, and error state handling from the start
5. **Living Documentation:** Specs stay current with implementation, serving as onboarding material and a reference for future changes

**Key Skills Demonstrated:**
- React component architecture and state management patterns
- Modern CSS (Grid, Flexbox, CSS variables) with responsive mobile-first design
- HTTP layer abstraction and error handling
- TanStack Query for advanced caching and data synchronization
- Chart.js data visualization with accessibility best practices
- Full-stack coordination and API contract design
- Performance optimization (lazy loading, memoization, query deduplication)
