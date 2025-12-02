import { CONFIG, PASTE_PLACEHOLDER, APP_VERSION } from "./config.js";
import { setQuestionsByTopic, getTopics } from "./state.js";
import { showWarning, clearWarning } from "./ui/warnings.js";
import { bindUIEvents } from "./ui/events.js";
import { initQuiz, loadTopic, nextQuestion, startTest } from "./quiz/engine.js";
import { loadFromJson, loadFromGoogleSheets } from "./data/loaders.js";
import { dom } from "./ui/dom.js";
import { renderEmpty } from "./ui/render.js";
import { clearTopicCharts } from "./quiz/charts.js";

// Track current high-level mode for tests
let currentMode = null; // "practice" | "test" | "mock"

// Helper: show/hide "Next question" button
function setNextButtonVisible(show) {
  if (!dom.nextBtn) return;
  if (show) {
    dom.nextBtn.classList.remove("d-none");
  } else {
    dom.nextBtn.classList.add("d-none");
  }
}

// Dark mode init (your previous logic)
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

  // Initial state
  apply(isDark);

  btn.addEventListener("click", () => {
    const currentlyDark = document.body.classList.contains("dark-mode");
    apply(!currentlyDark);
  });
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
  // Dark mode
  initDarkMode();

  // App version badge
  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  // Initially, no mode selected: hide Next
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

  // Timer is hidden initially by HTML (d-none on #timerContainer)

  // Load data (questions) for the chosen source
  loadDataBySource(defaultSource);

  // Bind UI events, including mode logic
  bindUIEvents({
    onTopicChange: (topic) => {
      // Only meaningful in practice mode; but safe regardless
      loadTopic(topic || "all");
    },
    onNext: nextQuestion,
    onSourceChange: loadDataBySource,

    onStartTest: (size) => {
      // Start a test-like session (timed or mock) with the current mode
      const modeForTest = currentMode === "mock" ? "mock" : "test";
      startTest(size, { mode: modeForTest });

      // Once the test actually starts, Next becomes relevant
      setNextButtonVisible(true);

      // Show timer for tests (handled by engine when showing questions)
      if (dom.timerContainer) {
        dom.timerContainer.classList.remove("d-none");
      }
    },

    onModeChange: (mode) => {
      currentMode = mode;
      // Clear any leftover charts when switching modes
      clearTopicCharts();

      if (mode === "practice") {
        // Show timer in practice mode
        if (dom.timerContainer) {
          dom.timerContainer.classList.remove("d-none");
        }
        setNextButtonVisible(true);
        // Start practice immediately (all topics by default)
        loadTopic("all");
      } else if (mode === "test") {
        // Hide timer until user clicks "Start test"
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        setNextButtonVisible(false);
        renderEmpty(
          'Select a test size and click "Start test" to begin a timed practice test.'
        );
      } else if (mode === "mock") {
        // Hide timer until user clicks "Start test"
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        setNextButtonVisible(false);
        renderEmpty(
          'Select a test size and click "Start test" to begin a mock exam.'
        );
      } else {
        // No mode selected
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        setNextButtonVisible(false);
        renderEmpty("Select a mode to begin.");
      }
    },
  });
}

init();
