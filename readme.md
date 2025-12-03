# ❄️ SnowPro Core Quiz App

Live Application: https://vicopico.github.io/snowflake-study-flashcards-app/

A modern, lightweight web-based quiz application for studying the SnowPro Core Certification.
Fully client-side, fast, and designed to make Snowflake exam preparation enjoyable and efficient.

Built with Vanilla JavaScript, Bootstrap 5, and optional integration with a shared Google Sheets question bank.

---

## Features

#### Study Modes

- Practice by topic
- Timed practice tests (10, 25, 50, or 100 randomized questions)
- Mock exam mode (50 or 100 randomized exam questions)

#### Smart Feedback & Scoring

- Immediate explanations after each question
- Supports single-choice and multi-select question types
- Seamless navigation and clean UI interactions
- Automatic session reset when switching modes

#### Performance Analytics

After each session, the app displays:

- Per-topic accuracy in Timed practice tests
- Per-area accuracy in Mock exam mode
- Total questions answered per topic
- Overall accuracy (donut chart)
- A clean and consistent summary card aligned with Snowflake’s design
- Fully responsive Chart.js visualizations

#### Visual Design

- Snowflake-inspired color palette
- Light and dark mode, with automatic dark-mode preference detection
- Custom styles for:
  - Progress bars
  - Mode selectors
  - Topic result badges
  - Charts

#### Data Loading Options

- Load questions from a published Google Sheets CSV
- Automatic fallback to a local questions.json file
- Clear warnings displayed if Sheets loading fails

#### Developer-Friendly

- Modular, readable JavaScript modules
- No build tools required
- Works on any static hosting environment
- Easy to extend with additional questions or topics

---

## How to Run

Simply open `index.html` in your browser.

This project runs correctly on:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- A local file system (file://)

No server or build process is required.

⸻

Using a Google Sheets Question Bank

1. Create your question set in Google Sheets.
2. Publish it as CSV:
   File → Share → Publish to the web → CSV
3. Copy the published link.
4. Add it to config.js:

```js
export const CONFIG = {
  googleSheetsCsvUrl: "https://docs.google.com/.../pub?output=csv",
  TIME_LIMIT: 60,
  APP_VERSION: "v1.x.x",
};
```

---

## Notes

- The published Google Sheets URL is intentionally stored directly in config.js to provide a shared, authoritative question source.
- If loading the sheet fails, the app automatically falls back to the bundled questions.json.

---

## License

This project is licensed under the **MIT License**.
See [LICENSE](LICENSE) file for details.

---

## Contributing

Feel free to fork the project, open issues, or submit pull requests.

You can participate by:

- Updating the shared Google Sheet
- Opening issues
- Submitting pull requests
