import { CONFIG, PASTE_PLACEHOLDER, APP_VERSION } from "./config.js";
import { setQuestionsByTopic, getTopics } from "./state.js";
import { showWarning, clearWarning } from "./ui/warnings.js";
import { bindUIEvents } from "./ui/events.js";
import {
  initQuiz,
  loadTopic,
  nextQuestion,
  startTest,
  startMockExam,
} from "./quiz/engine.js";
import { loadFromJson, loadFromGoogleSheets } from "./data/loaders.js";
import { dom } from "./ui/dom.js";
import { renderEmpty, clearSessionSummary } from "./ui/render.js";
import { clearTopicCharts } from "./quiz/charts.js";

let currentMode = null; // "practice" | "test" | "mock" | null

// Test size presets for different modes
const TEST_SIZES_STANDARD = [
  { value: "", label: "Select test size…" },
  { value: "10", label: "10 questions" },
  { value: "25", label: "25 questions" },
  { value: "50", label: "50 questions" },
  { value: "100", label: "100 questions" },
];

const TEST_SIZES_MOCK = [
  { value: "", label: "Select exam size…" },
  { value: "50", label: "50 questions" },
  { value: "100", label: "100 questions" },
];

function setTestSizeOptions(mode = "test") {
  if (!dom.testSizeSelect) return;

  const config = mode === "mock" ? TEST_SIZES_MOCK : TEST_SIZES_STANDARD;

  dom.testSizeSelect.innerHTML = "";
  config.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    dom.testSizeSelect.appendChild(opt);
  });
}

function initDarkMode() {
  const btn = document.getElementById("darkModeToggle");
  const icon = document.getElementById("darkModeIcon");
  const darkLink = document.getElementById("darkStyles");
  if (!btn) return;

  const saved = localStorage.getItem("snowpro-dark-mode");

  let isDark;
  if (saved === "1") {
    isDark = true;
  } else if (saved === "0") {
    isDark = false;
  } else {
    isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  const apply = (enabled) => {
    document.body.classList.toggle("dark-mode", enabled);
    if (darkLink) {
      darkLink.disabled = !enabled;
    }
    localStorage.setItem("snowpro-dark-mode", enabled ? "1" : "0");
    if (icon) {
      icon.className = enabled ? "bi bi-moon-fill" : "bi bi-sun-fill";
    }
  };

  apply(isDark);

  btn.addEventListener("click", () => {
    const currentlyDark = document.body.classList.contains("dark-mode");
    apply(!currentlyDark);
  });
}

// Utility from earlier: hide/show Next button
function setNextButtonVisible(flag) {
  if (!dom.nextBtn) return;
  if (flag) {
    dom.nextBtn.classList.remove("d-none");
  } else {
    dom.nextBtn.classList.add("d-none");
  }
}

async function loadDataBySource(source) {
  clearWarning();

  try {
    let qbt;

    if (source === "local") {
      console.info("Loading questions from local questions.json...");
      qbt = await loadFromJson();
    } else {
      console.info("Attempting to load questions from Google Sheets...");
      qbt = await loadFromGoogleSheets(CONFIG.googleSheetsCsvUrl);
    }

    setQuestionsByTopic(qbt);
    initQuiz(getTopics());
    // No questions shown yet – wait for mode selection
  } catch (err) {
    console.error("Primary load failed:", err);

    if (source === "sheets") {
      showWarning(
        "We couldn’t load questions from Google Sheets, so the app is using the built-in local questions instead. Your quiz still works, but changes in the sheet won’t show up until the connection issue is fixed."
      );
    } else {
      showWarning(
        "Could not load local questions.json. Please ensure the file exists and is valid."
      );
    }

    try {
      const fallback = await loadFromJson();
      setQuestionsByTopic(fallback);
      initQuiz(getTopics());
    } catch (fallbackErr) {
      console.error("Fallback local load also failed:", fallbackErr);
      showWarning(
        "We were unable to load questions from either Google Sheets or the local file."
      );
    }
  }
}

function init() {
  initDarkMode();

  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  console.log("SnowPro App Version:", APP_VERSION);
  console.log("Google Sheets URL:", CONFIG.googleSheetsCsvUrl);

  const noRealUrl =
    !CONFIG.googleSheetsCsvUrl ||
    CONFIG.googleSheetsCsvUrl === PASTE_PLACEHOLDER;

  const defaultSource = noRealUrl ? "local" : "sheets";

  if (dom.dataSourceSelect) {
    dom.dataSourceSelect.value = defaultSource;
  }

  if (noRealUrl) {
    showWarning(
      "No Google Sheets URL is configured, so the app is using the built-in local questions instead. Add a published Sheets CSV URL in config.js to load shared questions."
    );
  }

  // Default test sizes (Timed practice test)
  setTestSizeOptions("test");

  loadDataBySource(defaultSource);

  bindUIEvents({
    onTopicChange: (topic) => {
      loadTopic(topic || "all");
    },

    onNext: nextQuestion,

    onSourceChange: (source) => {
      loadDataBySource(source);
    },

    // Handle "Start test" button (used for Test + Mock modes)
    onStartTest: (size) => {
      if (currentMode === "mock") {
        startMockExam(size);
      } else {
        startTest(size);
      }
    },

    // Handle mode switching
    onModeChange: (mode) => {
      currentMode = mode;

      // Always reset summary + charts when switching modes
      clearSessionSummary();
      clearTopicCharts();

      if (mode === "practice") {
        // Practice by topic
        setNextButtonVisible(true);
        if (dom.timerContainer) dom.timerContainer.classList.remove("d-none");
        loadTopic("all");
      } else if (mode === "test") {
        // Timed practice test
        setNextButtonVisible(false);
        if (dom.timerContainer) dom.timerContainer.classList.add("d-none");
        setTestSizeOptions("test");

        renderEmpty('Select a test size and click "Start test" to begin.');
      } else if (mode === "mock") {
        // Mock exam mode
        setNextButtonVisible(false);
        if (dom.timerContainer) dom.timerContainer.classList.add("d-none");
        setTestSizeOptions("mock");

        renderEmpty(
          'Select an exam size and click "Start test" to begin the Mock Exam.'
        );
      }
    },
  });
}

init();
