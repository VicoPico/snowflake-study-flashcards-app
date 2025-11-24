import {
  state,
  setCurrentQuestions,
  setTopic,
  resetIndex,
  nextIndex,
} from "../state.js";
import {
  renderQuestion,
  renderEmpty,
  renderAnswerResult,
  renderTimeout,
  renderTopics,
} from "../ui/render.js";
import { startTimer, stopTimer } from "./timer.js";

// Fisher–Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildAllQuestions() {
  return Object.values(state.questionsByTopic).flat();
}

export function initQuiz(topics) {
  renderTopics(topics);
  loadTopic("all");
}

export function loadTopic(topic) {
  setTopic(topic);

  if (topic === "all") {
    setCurrentQuestions(shuffle(buildAllQuestions().slice()));
  } else {
    const arr = state.questionsByTopic[topic] || [];
    setCurrentQuestions(shuffle(arr.slice()));
  }

  resetIndex();
  showCurrentQuestion();
}

export function showCurrentQuestion() {
  stopTimer();

  if (!state.currentQuestions.length) {
    renderEmpty("No questions available for this topic.");
    return;
  }

  if (state.currentIndex >= state.currentQuestions.length) {
    renderEmpty("You have completed all questions in this topic.");
    return;
  }

  const q = state.currentQuestions[state.currentIndex];
  renderQuestion(q, handleAnswer);

  startTimer(() => {
    renderTimeout(q);
  });
}

export function handleAnswer(chosenIndex, clickedButton) {
  stopTimer();
  const q = state.currentQuestions[state.currentIndex];
  renderAnswerResult(q, chosenIndex, clickedButton);
}

export function nextQuestion() {
  stopTimer();
  nextIndex();
  showCurrentQuestion();
}
