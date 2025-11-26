import {
  state,
  setCurrentQuestions,
  setTopic,
  resetIndex,
  nextIndex,
  getAllQuestions,
  resetStats,
  recordAnswer,
  getStats,
  setTestMode,
  setTestSize,
} from "../state.js";

import {
  renderQuestion,
  renderEmpty,
  renderAnswerResult,
  renderTimeout,
  renderTopics,
  renderSummary,
} from "../ui/render.js";

import { startTimer, stopTimer } from "./timer.js";

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize quiz after questions load – but DO NOT start questions yet
export function initQuiz(topics) {
  renderTopics(topics);
  // We intentionally do not call loadTopic("all") here.
  // Questions will only start after the user selects a mode.
}

// Normal topic-based mode
export function loadTopic(topic) {
  // Leaving test mode when user manually switches topic
  setTestMode(false);
  setTestSize(null);

  setTopic(topic);

  let questions;
  if (topic === "all") {
    questions = shuffle(getAllQuestions().slice());
  } else {
    const arr = state.questionsByTopic[topic] || [];
    questions = shuffle(arr.slice());
  }

  setCurrentQuestions(questions);
  resetIndex();
  resetStats();
  showCurrentQuestion();
}

// Test mode: build a fixed-length randomized test from ALL questions
export function startTest(size) {
  const all = getAllQuestions().slice();
  if (!all.length) {
    renderEmpty("No questions available to generate a test.");
    return;
  }

  shuffle(all);
  const selected = all.slice(0, Math.min(size, all.length));

  setTestMode(true);
  setTestSize(selected.length);
  setTopic("all"); // logical topic
  setCurrentQuestions(selected);
  resetIndex();
  resetStats();
  showCurrentQuestion();
}

export function showCurrentQuestion() {
  stopTimer();

  if (!state.currentQuestions.length) {
    renderEmpty("No questions available for this selection.");
    return;
  }

  if (state.currentIndex >= state.currentQuestions.length) {
    // End of session (topic run or test)
    const stats = getStats();
    renderSummary(stats);
    return;
  }

  const q = state.currentQuestions[state.currentIndex];
  const total = state.currentQuestions.length;

  renderQuestion(q, handleAnswer, state.currentIndex, total);

  startTimer(() => {
    renderTimeout(q);
    // If you want timeouts to count as wrong immediately, add:
    // recordAnswer(q, false);
  });
}

export function handleAnswer(chosenIndex, clickedButton) {
  stopTimer();

  const q = state.currentQuestions[state.currentIndex];
  const isCorrect = chosenIndex === q.correct_index;

  // Record stats
  recordAnswer(q, isCorrect);

  // Render feedback
  renderAnswerResult(q, chosenIndex, clickedButton);
}

export function nextQuestion() {
  stopTimer();
  nextIndex();
  showCurrentQuestion();
}
