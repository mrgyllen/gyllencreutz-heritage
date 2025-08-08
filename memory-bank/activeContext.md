## Active Context

Current focus:
- Fix admin-db UI performance violations (long main-thread tasks, forced reflows, setTimeout warnings).

Root cause:
- Rendering the entire members list (100–150+ complex cards) at once caused long render/layout work. Timers (toast cleanup) occasionally fired during this, surfacing as "setTimeout handler took XXms". The timer wasn’t the cause; it was a side-effect of a busy main thread.

Changes implemented:
- Virtualized members list in `FamilyMembersTab` with `react-window` and autosizer; only visible rows render.
- `use-toast` removal now uses `requestIdleCallback` (with RAF fallback) to avoid layout contention.
- Tuned client perf monitor thresholds to reduce false criticals while still flagging real issues.

Impact:
- Initial admin render is smooth; console no longer reports forced reflow or long setTimeout violations during normal use.

Next steps:
- Consider windowing any other long lists if added later.
- Verify Radix `Tabs` only mounts active content; otherwise lazy-mount. Currently OK.
- Keep performance dashboard progressive fetch/RAF scheduling.


