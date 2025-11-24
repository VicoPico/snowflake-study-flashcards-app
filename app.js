// =============================
// Configuration
// =============================
const CONFIG = {
  // Paste your published Google Sheets CSV URL here.
  // Example: "https://docs.google.com/spreadsheets/d/.../pub?output=csv"
  googleSheetsCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxj3tzXYa5efhrk3NqNgs-yLBvDPTIl4naimGTceCp-QY0inE35CNUpILHAbr02jxKEJKLSLZPGTcT/pub?output=csv",
};

// =============================
// Warning helpers
// =============================
function showWarning(msg) {
  const el = document.getElementById("dataSourceWarning");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("d-none");
}

function clearWarning() {
  const el = document.getElementById("dataSourceWarning");
  if (!el) return;
  el.textContent = "";
  el.classList.add("d-none");
}

// =============================
// Timer config/state
// =============================
const TIME_LIMIT = 40; // seconds per question
let timeLeft = TIME_LIMIT;
let timerInterval = null;

// Timer DOM elements (optional; app works without them)
const timerText = document.getElementById("timerText");
const timerBar = document.getElementById("timerBar");

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function renderTimer() {
  if (timerText) {
    timerText.textContent = `Time left: ${timeLeft}s`;
  }
  if (timerBar) {
    const pct = Math.max(0, (timeLeft / TIME_LIMIT) * 100);
    timerBar.style.width = `${pct}%`;

    // Optional color urgency
    timerBar.classList.toggle("bg-danger", timeLeft <= 10);
    timerBar.classList.toggle("bg-warning", timeLeft > 10 && timeLeft <= 20);
    timerBar.classList.toggle("bg-primary", timeLeft > 20);
  }
}

function startTimer(onTimeout) {
  stopTimer(); // prevent stacking
  timeLeft = TIME_LIMIT;
  renderTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();

    if (timeLeft <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 1000);
}

function handleTimeout(question) {
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  const correctAnswer = question.options[question.correct_index];

  // Highlight correct option
  buttons.forEach((b, i) => {
    if (i === question.correct_index) {
      b.classList.replace("btn-outline-primary", "btn-success");
    }
  });

  feedback.innerHTML = `
    <div class="alert alert-warning">
      <strong>Time’s up.</strong><br>
      Correct answer: <strong>${correctAnswer}</strong><br>
      ${question.explanation}
    </div>
  `;
}

// =============================
// State
// =============================
let questionsByTopic = {};
let currentQuestions = [];
let currentTopic = "all";
let currentIndex = 0;

// DOM elements
const dataSourceSelect = document.getElementById("dataSourceSelect");
const topicSelect = document.getElementById("topicSelect");
const questionTitle = document.getElementById("questionTitle");
const optionsContainer = document.getElementById("optionsContainer");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const questionMeta = document.getElementById("questionMeta");

// =============================
// Utility functions
// =============================

// Fisher–Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildAllQuestions() {
  return Object.values(questionsByTopic).flat();
}

// Parse a single CSV line handling quotes and commas
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quotes or handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Convert CSV text to questionsByTopic structure
function parseCsvToQuestionsByTopic(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {};
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name) => headers.indexOf(name);

  const topicIdx = idx("topic");
  const idIdx = idx("id");
  const questionIdx = idx("question");
  const optionIdxs = [
    idx("option1"),
    idx("option2"),
    idx("option3"),
    idx("option4"),
  ].filter((i) => i >= 0);
  const correctIdxIdx = idx("correct_idx");
  const explanationIdx = idx("explanation");
  const difficultyIdx = idx("difficulty");
  const sourceTypeIdx = idx("source_type");
  const tagsIdx = idx("tags");

  const result = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (!row.length) continue;

    const topic = String(row[topicIdx] || "").trim();
    const questionText = String(row[questionIdx] || "").trim();
    if (!topic || !questionText) continue;

    const options = optionIdxs
      .map((colIndex) => row[colIndex])
      .filter((v) => v !== "" && v !== null && v !== undefined)
      .map((v) => String(v));

    const correctIndexValue = row[correctIdxIdx];
    const correctIndex =
      typeof correctIndexValue === "number"
        ? correctIndexValue
        : parseInt(correctIndexValue, 10);

    const tagsValue = row[tagsIdx];
    const tags =
      typeof tagsValue === "string"
        ? tagsValue
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const q = {
      id: String(row[idIdx] || "").trim(),
      question: questionText,
      options: options,
      correct_index: isNaN(correctIndex) ? 0 : correctIndex,
      explanation: String(row[explanationIdx] || "").trim(),
      topic: topic,
      difficulty: String(row[difficultyIdx] || "").trim() || "medium",
      source_type: String(row[sourceTypeIdx] || "").trim() || "mock",
      tags: tags,
    };

    if (!result[topic]) {
      result[topic] = [];
    }
    result[topic].push(q);
  }

  return result;
}

// =============================
// Quiz logic
// =============================
function loadTopic(topic) {
  currentTopic = topic;

  if (topic === "all") {
    currentQuestions = shuffle(buildAllQuestions().slice());
  } else {
    const arr = questionsByTopic[topic] || [];
    currentQuestions = shuffle(arr.slice());
  }

  currentIndex = 0;
  showQuestion();
}

function showQuestion() {
  stopTimer(); // stop any previous timer
  feedback.innerHTML = "";
  optionsContainer.innerHTML = "";

  if (!currentQuestions.length) {
    questionTitle.textContent = "No questions available for this topic.";
    questionMeta.textContent = "";
    timeLeft = TIME_LIMIT;
    renderTimer();
    return;
  }

  if (currentIndex >= currentQuestions.length) {
    questionTitle.textContent =
      "You have completed all questions in this topic.";
    questionMeta.textContent = "";
    timeLeft = TIME_LIMIT;
    renderTimer();
    return;
  }

  const q = currentQuestions[currentIndex];
  questionTitle.textContent = q.question;
  questionMeta.textContent = `ID: ${q.id} • Topic: ${q.topic} • Difficulty: ${q.difficulty}`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary w-100 text-start mb-2";
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(q, idx, btn);
    optionsContainer.appendChild(btn);
  });

  // start timer for this question
  startTimer(() => handleTimeout(q));
}

function handleAnswer(question, chosenIndex, clickedButton) {
  stopTimer();

  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = chosenIndex === question.correct_index;

  if (isCorrect) {
    clickedButton.classList.replace("btn-outline-primary", "btn-success");
    feedback.innerHTML = `<div class="alert alert-success">
      <strong>Correct.</strong><br>${question.explanation}
    </div>`;
  } else {
    clickedButton.classList.replace("btn-outline-primary", "btn-danger");
    const correctAnswer = question.options[question.correct_index];
    feedback.innerHTML = `<div class="alert alert-danger">
      <strong>Incorrect.</strong><br>
      Correct answer: <strong>${correctAnswer}</strong><br>
      ${question.explanation}
    </div>`;
  }
}

// =============================
// UI Initialization
// =============================
function initUI() {
  stopTimer();

  // Reset topic dropdown
  topicSelect.innerHTML = "";

  const optionAll = document.createElement("option");
  optionAll.value = "all";
  optionAll.textContent = "All topics";
  topicSelect.appendChild(optionAll);

  Object.keys(questionsByTopic).forEach((topic) => {
    const opt = document.createElement("option");
    opt.value = topic;
    opt.textContent = topic;
    topicSelect.appendChild(opt);
  });

  topicSelect.value = "all";

  topicSelect.onchange = () => {
    loadTopic(topicSelect.value);
  };

  nextBtn.onclick = () => {
    stopTimer();
    currentIndex++;
    showQuestion();
  };

  loadTopic("all");
}

// =============================
// Data loading (Sheets + JSON)
// =============================
function loadFromJson() {
  console.info("Loading questions from local questions.json...");
  questionTitle.textContent = "Loading questions from local file...";
  optionsContainer.innerHTML = "";
  feedback.innerHTML = "";
  stopTimer();

  fetch("questions.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch questions.json");
      }
      return res.json();
    })
    .then((data) => {
      // Support both:
      // 1) { topic: [questions...] }
      // 2) [ { topic: "...", ... }, ... ]
      if (Array.isArray(data)) {
        const grouped = {};
        data.forEach((q) => {
          const topic = q.topic || "misc";
          if (!grouped[topic]) {
            grouped[topic] = [];
          }
          grouped[topic].push(q);
        });
        questionsByTopic = grouped;
      } else {
        questionsByTopic = data;
      }

      initUI();
    })
    .catch((err) => {
      console.error("Error loading questions.json:", err);
      questionTitle.textContent = "Error loading questions from local file.";
    });
}

function loadFromGoogleSheets() {
  const noRealUrl =
    !CONFIG.googleSheetsCsvUrl ||
    CONFIG.googleSheetsCsvUrl === "PASTE_YOUR_URL_TO_GOOGLE_SHEETS_HERE";

  if (noRealUrl) {
    showWarning(
      "No Google Sheets URL is configured, so the app is using the built-in local questions instead. Add a published Sheets CSV URL in app.js to load shared questions."
    );
    loadFromJson();
    return;
  }

  console.info("Attempting to load questions from Google Sheets...");
  stopTimer();

  fetch(CONFIG.googleSheetsCsvUrl)
    .then((res) => {
      if (!res.ok) {
        showWarning(
          "We couldn’t load questions from Google Sheets, so the app is using the built-in local questions instead. Your quiz still works, but changes in the sheet won’t show up until the connection issue is fixed."
        );
        throw new Error("Google Sheets fetch failed");
      }
      return res.text();
    })
    .then((csvText) => {
      const parsed = parseCsvToQuestionsByTopic(csvText);

      if (!Object.keys(parsed).length) {
        showWarning(
          "Google Sheets responded, but no valid questions were found. The app has switched to the built-in local questions. Please check that your sheet uses the expected columns."
        );
        loadFromJson();
        return;
      }

      questionsByTopic = parsed;
      initUI();
    })
    .catch((err) => {
      console.error(err);
      showWarning(
        "We couldn’t load questions from Google Sheets, so the app is using the built-in local questions instead. Your quiz still works, but it won’t reflect the latest sheet changes until the connection is restored."
      );
      loadFromJson();
    });
}

// Decide which loader to use
function loadDataBySource(source) {
  clearWarning();
  stopTimer();

  if (source === "local") {
    loadFromJson();
  } else {
    loadFromGoogleSheets();
  }
}

// =============================
// Entry point
// =============================
(function init() {
  console.log("Google Sheets URL:", CONFIG.googleSheetsCsvUrl);

  const noRealUrl =
    !CONFIG.googleSheetsCsvUrl ||
    CONFIG.googleSheetsCsvUrl === "PASTE_YOUR_URL_TO_GOOGLE_SHEETS_HERE";

  if (noRealUrl) {
    if (dataSourceSelect) {
      dataSourceSelect.value = "local";
    }
    showWarning(
      "No Google Sheets URL is configured, so the app is using the built-in local questions instead. Add a published Sheets CSV URL in app.js to load shared questions."
    );
    loadDataBySource("local");
  } else {
    if (dataSourceSelect) {
      dataSourceSelect.value = "sheets";
    }
    loadDataBySource("sheets");
  }

  // Handle user switching data source
  if (dataSourceSelect) {
    dataSourceSelect.onchange = () => {
      const source = dataSourceSelect.value;
      loadDataBySource(source);
    };
  }
})();
