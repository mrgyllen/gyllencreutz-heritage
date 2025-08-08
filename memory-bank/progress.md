## Progress

What works now:
- Admin members list virtualized; fast scroll and render
- Toast cleanup idle-scheduled; fewer timing conflicts
- Performance monitor active with practical thresholds
- Type checks and lints are clean

Remaining:
- Monitor for any regressions when dataset grows
- Evaluate virtualization for any future heavy UI lists

Known issues:
- None blocking; keep an eye on forced reflow warnings if new UI introduces heavy synchronous layout work


