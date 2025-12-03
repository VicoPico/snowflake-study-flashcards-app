import { getQuestionsByTopic } from "../state.js";
import { dom } from "../ui/dom.js";
import { startTimer, stopTimer } from "./timer.js";
import {
  renderQuestion,
  renderFeedback,
  renderEmpty,
  renderMeta,
  renderSessionSummary,
  clearSessionSummary,
} from "../ui/render.js";

let currentQuestions = [];
let currentIndex = 0;
let isTestMode = false;
let isMockMode = false;
let correctCount = 0;
let answeredCount = 0;

// Per-topic stats { [topic]: { correct, total } }
let perTopicStats = {};
// Per-area stats { [areaKey]: { correct, total } }, e.g. "data-loading"
let perAreaStats = {};

// Simple Fisher–Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function normalizeQuestion(raw) {
  const q = { ...raw };

  // Normalize correct_index
  if (typeof q.correct_index === "string") {
    const ci = parseInt(q.correct_index, 10);
    q.correct_index = isNaN(ci) ? 0 : ci;
  } else if (typeof q.correct_index !== "number") {
    q.correct_index = 0;
  }

  // Normalize correct_indices (multi-select)
  let arr = [];
  if (Array.isArray(q.correct_indices)) {
    arr = q.correct_indices
      .map((v) => (typeof v === "number" ? v : parseInt(String(v).trim(), 10)))
      .filter((n) => !isNaN(n));
  } else if (typeof q.correct_indices === "string") {
    const trimmed = q.correct_indices.trim();
    if (trimmed) {
      arr = trimmed
        .split(/[,;]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    }
  }

  q.correct_indices = arr;
  q.isMulti = Array.isArray(arr) && arr.length > 0;

  // Normalize tags to array of strings
  if (typeof q.tags === "string") {
    q.tags = q.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (!Array.isArray(q.tags)) {
    q.tags = [];
  }

  return q;
}

function evaluateQuestion(question, selectedIndices) {
  if (question.isMulti) {
    const correctSet = new Set(question.correct_indices);
    const selectedSet = new Set(selectedIndices);

    if (selectedSet.size !== correctSet.size) {
      return { isCorrect: false, correctIndices: [...correctSet] };
    }

    const allMatch = [...correctSet].every((idx) => selectedSet.has(idx));
    return { isCorrect: allMatch, correctIndices: [...correctSet] };
  } else {
    const correctIdx = question.correct_index;
    const isCorrect =
      selectedIndices.length === 1 && selectedIndices[0] === correctIdx;
    return { isCorrect, correctIndices: [correctIdx] };
  }
}

// Helper: derive primary area key from tags/topic
function getPrimaryAreaKey(question) {
  if (Array.isArray(question.tags) && question.tags.length > 0) {
    const tag0 = String(question.tags[0] || "")
      .trim()
      .toLowerCase();
    if (tag0) return tag0;
  }

  // Fallback: slugify topic
  const topic = String(question.topic || "unknown");
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Update both per-topic and per-area stats after each question
function recordStats(question, isCorrect) {
  const topicKey = question.topic || "Unknown";

  if (!perTopicStats[topicKey]) {
    perTopicStats[topicKey] = { correct: 0, total: 0 };
  }
  perTopicStats[topicKey].total += 1;
  if (isCorrect) {
    perTopicStats[topicKey].correct += 1;
  }

  const areaKey = getPrimaryAreaKey(question);
  if (!perAreaStats[areaKey]) {
    perAreaStats[areaKey] = { correct: 0, total: 0 };
  }
  perAreaStats[areaKey].total += 1;
  if (isCorrect) {
    perAreaStats[areaKey].correct += 1;
  }
}

function showCurrentQuestion() {
  stopTimer();

  if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
    const baseMessage =
      isTestMode || isMockMode
        ? `Session complete. Score: ${correctCount}/${answeredCount || 1}.`
        : "You have reached the end of the available questions.";

    renderEmpty(baseMessage);

    // Decide which stats map to use for summary & charts
    const useStats = isMockMode ? perAreaStats : perTopicStats;
    const modeLabel = isMockMode
      ? "Mock exam"
      : isTestMode
      ? "Timed practice test"
      : "Practice session";

    const labelKind = isMockMode ? "area" : "topic";

    renderSessionSummary({
      statsMap: useStats,
      correctCount,
      answeredCount,
      modeLabel,
      labelKind,
    });

    // Hide Next button at the very end
    if (dom.nextBtn) {
      dom.nextBtn.classList.add("d-none");
    }
    return;
  }

  const raw = currentQuestions[currentIndex];
  const q = normalizeQuestion(raw);

  // Ensure Next button visible while in the middle of a session
  if (dom.nextBtn) {
    dom.nextBtn.classList.remove("d-none");
  }

  renderMeta(q, {
    index: currentIndex + 1,
    total: currentQuestions.length,
    isTestMode,
    isMockMode,
    correctCount,
    answeredCount,
  });

  let answered = false;

  const onAnswer = (selectedIndices) => {
    if (answered) return;
    answered = true;
    stopTimer();

    const { isCorrect, correctIndices } = evaluateQuestion(q, selectedIndices);

    answeredCount++;
    if (isCorrect) {
      correctCount++;
    }
    recordStats(q, isCorrect);

    renderFeedback(q, {
      selectedIndices,
      correctIndices,
      isCorrect,
    });
  };

  renderQuestion(q, { onAnswer });

  // Start timer; timeout counts as no selection
  startTimer(() => {
    if (!answered) {
      onAnswer([]); // treat as unanswered/incorrect
    }
  });
}

// Initialize quiz once questionsByTopic is set
export function initQuiz(topics) {
  if (!dom.topicSelect) return;

  dom.topicSelect.innerHTML = "";

  const optionAll = document.createElement("option");
  optionAll.value = "all";
  optionAll.textContent = "All topics";
  dom.topicSelect.appendChild(optionAll);

  (topics || []).forEach((topic) => {
    const opt = document.createElement("option");
    opt.value = topic;
    opt.textContent = topic;
    dom.topicSelect.appendChild(opt);
  });

  dom.topicSelect.value = "all";
}

// Practice mode: load questions for a topic (or all)
export function loadTopic(topic) {
  const qbt = getQuestionsByTopic();
  let arr = [];

  if (topic === "all") {
    arr = Object.values(qbt).flat();
  } else {
    arr = qbt[topic] || [];
  }

  arr = shuffle(arr.slice());

  currentQuestions = arr;
  currentIndex = 0;
  isTestMode = false;
  isMockMode = false;
  correctCount = 0;
  answeredCount = 0;
  perTopicStats = {};
  perAreaStats = {};
  clearSessionSummary();

  if (!currentQuestions.length) {
    stopTimer();
    renderEmpty("No questions available for this topic.");
    if (dom.nextBtn) dom.nextBtn.classList.add("d-none");
    return;
  }

  showCurrentQuestion();
}

// Test mode: build a fixed-size random test from all non-mock topics
export function startTest(size) {
  const qbt = getQuestionsByTopic();
  let pool = Object.entries(qbt)
    .filter(([topic]) => !topic.toLowerCase().startsWith("mock exam"))
    .flatMap(([, arr]) => arr || []);

  pool = shuffle(pool.slice());

  const actualSize = Math.min(size, pool.length);
  currentQuestions = pool.slice(0, actualSize);
  currentIndex = 0;
  isTestMode = true;
  isMockMode = false;
  correctCount = 0;
  answeredCount = 0;
  perTopicStats = {};
  perAreaStats = {};
  clearSessionSummary();

  if (!currentQuestions.length) {
    stopTimer();
    renderEmpty("No questions available to build a test.");
    if (dom.nextBtn) dom.nextBtn.classList.add("d-none");
    return;
  }

  showCurrentQuestion();
}

// Mock exam mode: only use topics that start with "Mock Exam"
export function startMockExam(size) {
  const qbt = getQuestionsByTopic();

  let pool = Object.entries(qbt)
    .filter(([topic]) => topic.toLowerCase().startsWith("mock exam"))
    .flatMap(([, arr]) => arr || []);

  pool = shuffle(pool.slice());

  const actualSize = Math.min(size, pool.length);
  currentQuestions = pool.slice(0, actualSize);
  currentIndex = 0;
  isTestMode = false;
  isMockMode = true;
  correctCount = 0;
  answeredCount = 0;
  perTopicStats = {};
  perAreaStats = {};
  clearSessionSummary();

  if (!currentQuestions.length) {
    stopTimer();
    renderEmpty(
      'No mock exam questions found. Ensure your sheet uses topics like "Mock Exam 1".'
    );
    if (dom.nextBtn) dom.nextBtn.classList.add("d-none");
    return;
  }

  showCurrentQuestion();
}

export function nextQuestion() {
  if (!currentQuestions.length) {
    renderEmpty("No questions loaded.");
    if (dom.nextBtn) dom.nextBtn.classList.add("d-none");
    return;
  }

  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    showCurrentQuestion();
  } else {
    stopTimer();
    const baseMessage =
      isTestMode || isMockMode
        ? `Session complete. Score: ${correctCount}/${answeredCount || 1}.`
        : "You have reached the end of the available questions.";

    renderEmpty(baseMessage);

    const useStats = isMockMode ? perAreaStats : perTopicStats;
    const modeLabel = isMockMode
      ? "Mock exam"
      : isTestMode
      ? "Timed practice test"
      : "Practice session";
    const labelKind = isMockMode ? "area" : "topic";

    renderSessionSummary({
      statsMap: useStats,
      correctCount,
      answeredCount,
      modeLabel,
      labelKind,
    });

    if (dom.nextBtn) {
      dom.nextBtn.classList.add("d-none");
    }
  }
}
