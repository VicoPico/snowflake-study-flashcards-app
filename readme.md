# ❄️ SnowPro Core Quiz App

**Live Application:** https://vicopico.github.io/snowflake-study-flashcards-app/

A simple web-based quiz application for studying the **SnowPro Core Certification**.
Built using HTML, Bootstrap, and Vanilla JavaScript, with questions loaded from either a public Google Sheets CSV or a local questions.json file.

The application supports question topics, randomized answers, explanations, and a simple interface suitable for self-study or team learning.

---

## Features

- Load questions by topic from a published Google Sheets CSV URL or local questions.json file (fallback)
- Topic-based filtering
- Timer: progress bar, timeout feedback, and integration with question flow
- Shuffle questions automatically
- Explanations for each answer
- Display answer correctness + explanations
- Lightweight and dependency-free
- Fully client-side (no backend required)
- Easy to extend with new topics/questions
- Compatible with GitHub Pages and other static hosts

---

## Project Structure

```
.
├── index.html
├── app.js                 # Entry point (module)
├── config.js
├── state.js
├── LICENSE
├── readme.md
├── questions.json
├── data/
│   ├── parsers.js
│   └── loaders.js
├── ui/
│   ├── dom.js
│   ├── warnings.js
│   ├── render.js
│   └── events.js
└── quiz/
    ├── engine.js
    └── timer.js

```

---

## How to Run

Just open `index.html` in your browser — no server required.

You can also host it on:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

---

## License

This project is licensed under the **MIT License**.  
See [LICENSE](LICENSE) file for details.

---

## Contributing

Feel free to fork the project, open issues, or submit pull requests.

---
