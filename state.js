export const state = {
  questionsByTopic: {},
  currentQuestions: [],
  currentTopic: "all",
  currentIndex: 0,
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
