// ui/dom.js
export const dom = {
  dataSourceWarning: document.getElementById("dataSourceWarning"),
  dataSourceSelect: document.getElementById("dataSourceSelect"),

  // Mode selector
  modePracticeRadio: document.getElementById("modePractice"),
  modeTestRadio: document.getElementById("modeTest"),
  modeMockRadio: document.getElementById("modeMock"),

  // Practice vs Test controls
  practiceControls: document.getElementById("practiceControls"),
  testControls: document.getElementById("testControls"),

  // Question / options UI
  topicSelect: document.getElementById("topicSelect"),
  questionTitle: document.getElementById("questionTitle"),
  optionsContainer: document.getElementById("optionsContainer"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("nextBtn"),
  questionMeta: document.getElementById("questionMeta"),

  // Timer
  timerContainer: document.getElementById("timerContainer"),
  timerText: document.getElementById("timerText"),
  timerBar: document.getElementById("timerBar"),

  // Test size controls
  testSizeSelect: document.getElementById("testSizeSelect"),
  startTestBtn: document.getElementById("startTestBtn"),

  // Charts (session summary)
  scoreCharts: document.getElementById("scoreCharts"),
};
