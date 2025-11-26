# ❄️ SnowPro Core Quiz App

**Live Application:** https://vicopico.github.io/snowflake-study-flashcards-app/

A simple and lightweight web-based quiz application for studying the **SnowPro Core Certification**.
Built using HTML, Bootstrap, and modular Vanilla JavaScript, with questions loaded from either a public Google Sheets CSV or a local `questions.json` fallback.

The app supports topic-based practice, timed practice tests, explanations, scoring, and a clean UI suitable for individuals or teams preparing for certification.

---

## Features

- **Two study modes**
  - **Practice by topic**
  - **Timed practice test** (25, 50, 75, or 100 random questions)
- **Timer functionality**
  - Progress bar + countdown
  - Timeout automatically moves the quiz forward
- Load questions from:
  - **Published Google Sheets CSV**
  - **Local JSON file** (fallback)
- Topic-based filtering
- Randomized questions and answers
- Explanations shown after answering
- Tracks score during timed tests
- Lightweight, dependency-free, fully client-side
- Works seamlessly on GitHub Pages, Netlify, Vercel, or any static host
- Easy to extend with new topics or updated questions
- Version badge automatically displayed in the UI

---

## Project Structure

```
.
├── index.html
├── app.js                 # Entry point (module)
├── config.js              # Settings (Google Sheets URL, time limit, version)
├── state.js               # Global quiz/test state
├── LICENSE
├── readme.md
├── questions.json         # Local fallback question set
├── data/
│   ├── parsers.js         # CSV → question objects
│   └── loaders.js         # Sheets + JSON loading handlers
├── ui/
│   ├── dom.js             # Central DOM lookup
│   ├── warnings.js        # Data source warnings
│   ├── render.js          # Rendering helpers
│   └── events.js          # UI event binding (topic select, mode select, etc.)
└── quiz/
    ├── engine.js          # Question flow, scoring, topic/test logic
    └── timer.js           # Timer countdown + bar rendering

```

---

## How to Run

Simply open **`index.html`** in your browser — no server required.

### Hosting

The app works perfectly on any static hosting provider:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Local file system

---

## Using a Google Sheets Question Bank

1. Prepare your question set in Google Sheets
2. Publish the sheet:  
   **File → Share → Publish to the web → CSV**
3. Copy the generated CSV URL
4. Paste it into `config.js`:

```js
export const CONFIG = {
  googleSheetsCsvUrl: "https://docs.google.com/.../pub?output=csv",
  TIME_LIMIT: 40,
  APP_VERSION: "v1.0.0",
};
```

> **Note about the Google Sheets URL**  
> The URL for the public Google Sheets question bank is intentionally **hard-coded** in `config.js`.  
> This guarantees that everyone using the app pulls from the same shared, curated set of Snowflake questions.
>
> The community is encouraged to **contribute new questions, corrections, or improvements** by updating the shared Google Sheet or submitting pull requests.  
> The goal is to keep the content extremely reliable while continuously expanding the coverage of Snowflake topics.

If the sheet cannot be loaded, the app automatically falls back to questions.json.

---

## License

This project is licensed under the **MIT License**.
See [LICENSE](LICENSE) file for details.

---

## Contributing

Feel free to fork the project, open issues, or submit pull requests.
