Changelog

All notable changes to this project will be documented in this file.
This project follows a simplified semantic versioning style (MAJOR.MINOR.PATCH).

⸻

v1.6.0 — 2025-12-03

Added
- New Mock Exam Mode with selectable 50- and 100-question exam sizes
- Area-based scoring engine with support for domain grouping via tags
- Updated session summary to display performance by Snowflake knowledge area
- New stacked bar chart + donut chart summarizing results by area
- Dynamic mode-aware test size selector
- New UI radio selector for Mock Exam mode
- Per-mode initialization flow:
- startTest() (Timed Practice Test)
- startMockExam() (Mock Exam)
- Standard practice mode unchanged
- Comprehensive chart and UI clearing logic on mode switches and new sessions

Fixed
- Summary and charts no longer persist after switching modes
- Donut chart legend spacing improved (no more crowding at the bottom)
- X-axis label wrapping for long topic names
- Correct dark-mode grid and tick coloring in charts
- Restored “Start test” button visibility for all modes
- Fixed bug where Mock Exam mode behaved like Timed Test when no mock questions existed

Changed
- Test size selector rebuilt dynamically from JS rather than fixed in HTML
- Summary is now aligned with Snowflake domain areas, not per-topic (e.g., architecture, data-loading, access-control, etc.)
- Chart rendering completely moved to area-level logic
- Improved separation between test, mock exam, and practice flows
- Cleaned up internal UI mode-handling logic (events.js and app.js)

Removed
- Old per-topic summary logic
- Redundant CSS blocks in style.css

⸻

v1.5.0 — 2025-12-02

Added
- Introduced Chart.js analytics (bar + donut charts)
- Added per-topic scoring
- New Snowflake-inspired chart color palette
- Responsive chart layout (vertical on mobile, side-by-side on larger screens)

Fixed
- Infinite chart height bug
- Dark mode inconsistencies across chart containers
- Label overlap on bar chart for long topic names

Changed
- Updated summary card layout
- Improved spacing and visual consistency with Snowflake UI style

⸻

v1.4.0 — 2025-11-30

Added
- Version badge auto-updates from config.js
- Data source selector (Sheets vs Local JSON)
- Automated fallback loading logic
- Improved multi-select question handling

Fixed
- Feedback card layout issues
- Answers not resetting correctly between questions

⸻

Earlier Versions

Versions prior to v1.4.0 included initial project setup, basic UI, core quiz engine, basic modes, and foundational styles.