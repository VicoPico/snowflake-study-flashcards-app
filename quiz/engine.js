import { getQuestionsByTopic } from "../state.js";
import { dom } from "../ui/dom.js";
import { startTimer, stopTimer } from "./timer.js";
import {
  renderQuestion,
  renderFeedback,
  renderEmpty,
  renderMeta,
  renderSessionSummary,
} from "../ui/render.js";

// Internal state
let currentQuestions = [];
let currentIndex = 0;

// Mode flags
// "test-like" means either Timed practice test OR Mock exam
let isTestLike = false;
let isMockExam = false;

let correctCount = 0;
let answeredCount = 0;

// Per-topic stats { [topic]: { correct, total } }
let perTopicStats = {};

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

  // Normalize correct_index (single-answer)
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

// Per-topic stats update
function recordTopicStat(question, isCorrect) {
  const topic = question.topic || "Unknown";
  if (!perTopicStats[topic]) {
    perTopicStats[topic] = { correct: 0, total: 0 };
  }
  perTopicStats[topic].total += 1;
  if (isCorrect) {
    perTopicStats[topic].correct += 1;
  }
}

function endOfSession() {
  const baseMessage = isTestLike
    ? `Test complete. Score: ${correctCount}/${answeredCount || 1}.`
    : "You have reached the end of the available questions.";

  renderEmpty(baseMessage);

  renderSessionSummary({
    perTopicStats,
    correctCount,
    answeredCount,
    isTestMode: isTestLike,
    isMockExam,
  });

  if (dom.nextBtn) {
    dom.nextBtn.classList.add("d-none");
  }
}

function showCurrentQuestion() {
  stopTimer();

  if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
    endOfSession();
    return;
  }

  const raw = currentQuestions[currentIndex];
  const q = normalizeQuestion(raw);

  renderMeta(q, {
    index: currentIndex + 1,
    total: currentQuestions.length,
    isTestMode: isTestLike,
    correctCount,
    answeredCount,
  });

  // We are in the middle of a session: ensure Next button is visible
  if (dom.nextBtn) {
    dom.nextBtn.classList.remove("d-none");
  }

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
    recordTopicStat(q, isCorrect);

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

  // Practice mode flags
  isTestLike = false;
  isMockExam = false;
  correctCount = 0;
  answeredCount = 0;
  perTopicStats = {};

  if (!currentQuestions.length) {
    stopTimer();
    renderEmpty("No questions available for this topic.");
    if (dom.nextBtn) dom.nextBtn.classList.add("d-none");
    return;
  }

  showCurrentQuestion();
}

// Test mode: build a fixed-size random test (timed or mock)
export function startTest(size, options = {}) {
  const { mode = "test" } = options;

  const qbt = getQuestionsByTopic();

  let poolArray = [];
  if (mode === "mock") {
    // Prefer topics that look like mock exam topics (e.g. "Mock Exam 1")
    for (const [topic, questions] of Object.entries(qbt)) {
      if (topic.toLowerCase().startsWith("mock")) {
        poolArray = poolArray.concat(questions);
      }
    }
    // If none found yet, gracefully fall back to all questions
    if (!poolArray.length) {
      poolArray = Object.values(qbt).flat();
    }
  } else {
    // Normal timed test: use all questions
    poolArray = Object.values(qbt).flat();
  }

  const pool = shuffle(poolArray.slice());
  const actualSize = Math.min(size, pool.length);

  currentQuestions = pool.slice(0, actualSize);
  currentIndex = 0;

  isTestLike = true;
  isMockExam = mode === "mock";
  correctCount = 0;
  answeredCount = 0;
  perTopicStats = {};

  if (!currentQuestions.length) {
    stopTimer();
    renderEmpty("No questions available to build a test.");
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
    endOfSession();
  }
}
