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

  // Hide Next button until a session actually starts
  setNextButtonVisible(false);

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

  loadDataBySource(defaultSource);

  bindUIEvents({
    onTopicChange: (topic) => {
      if (currentMode === "practice") {
        clearSessionSummary();
        clearTopicCharts();
        loadTopic(topic || "all");
      }
    },
    onNext: nextQuestion,
    onSourceChange: loadDataBySource,

    onStartTest: (size) => {
      clearSessionSummary();
      clearTopicCharts();

      if (currentMode === "mock") {
        startMockExam(size);
      } else {
        // treat everything else as timed test
        startTest(size);
      }
    },

    onModeChange: (mode) => {
      currentMode = mode;

      // Clear current summary + charts
      clearSessionSummary();
      clearTopicCharts();

      if (mode === "practice") {
        // Show timer, start practice on "all" by default
        if (dom.timerContainer) {
          dom.timerContainer.classList.remove("d-none");
        }
        setNextButtonVisible(true);
        loadTopic("all");
      } else if (mode === "test") {
        // Hide timer until "Start test" is clicked
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        setNextButtonVisible(false);
        renderEmpty('Select a test size and click "Start test" to begin.');
      } else if (mode === "mock") {
        // Same UX as test mode, but will use mock exam pool
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        setNextButtonVisible(false);
        renderEmpty(
          'Select a test size and click "Start test" to begin the mock exam.'
        );
      } else {
        // No mode selected
        setNextButtonVisible(false);
        renderEmpty("Select a mode to begin.");
      }
    },
  });
}

init();
