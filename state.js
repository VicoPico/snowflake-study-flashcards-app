export const state = {
  questionsByTopic: {},
  currentQuestions: [],
  currentTopic: "all",
  currentIndex: 0,

  // Scoring
  correctCount: 0,
  wrongCount: 0,
  perTopicStats: {}, // { topicName: { correct: n, wrong: m } }

  // Test mode
  testMode: false,
  testSize: null,
};

export function setQuestionsByTopic(qbt) {
  state.questionsByTopic = qbt;
}

export function setCurrentQuestions(arr) {
  state.currentQuestions = arr;
}

export function setTopic(topic) {
  state.currentTopic = topic;
}

export function resetIndex() {
  state.currentIndex = 0;
}

export function nextIndex() {
  state.currentIndex++;
}

export function getTopics() {
  return Object.keys(state.questionsByTopic);
}

export function getAllQuestions() {
  return Object.values(state.questionsByTopic).flat();
}

// ===== Scoring helpers =====
export function resetStats() {
  state.correctCount = 0;
  state.wrongCount = 0;
  state.perTopicStats = {};
}

export function recordAnswer(question, isCorrect) {
  const topic = question.topic || "misc";
  if (!state.perTopicStats[topic]) {
    state.perTopicStats[topic] = { correct: 0, wrong: 0 };
  }

  if (isCorrect) {
    state.correctCount++;
    state.perTopicStats[topic].correct++;
  } else {
    state.wrongCount++;
    state.perTopicStats[topic].wrong++;
  }
}

export function getStats() {
  return {
    correct: state.correctCount,
    wrong: state.wrongCount,
    perTopic: state.perTopicStats,
    testMode: state.testMode,
    testSize: state.testSize,
  };
}

// ===== Test mode helpers =====
export function setTestMode(flag) {
  state.testMode = !!flag;
}

export function setTestSize(n) {
  state.testSize = n != null ? Number(n) : null;
}
