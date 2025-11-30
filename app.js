import { CONFIG, PASTE_PLACEHOLDER, APP_VERSION } from "./config.js";
import { setQuestionsByTopic, getTopics } from "./state.js";
import { showWarning, clearWarning } from "./ui/warnings.js";
import { bindUIEvents } from "./ui/events.js";
import { initQuiz, loadTopic, nextQuestion, startTest } from "./quiz/engine.js";
import { loadFromJson, loadFromGoogleSheets } from "./data/loaders.js";
import { dom } from "./ui/dom.js";
import { renderEmpty } from "./ui/render.js";

// -----------------------------
// Helper: Next button visibility
// -----------------------------
function setNextButtonVisible(flag) {
  if (!dom.nextBtn) return;
  if (flag) {
    dom.nextBtn.classList.remove("d-none");
    dom.nextBtn.disabled = false;
  } else {
    dom.nextBtn.classList.add("d-none");
  }
}

// -----------------------------
// Dark mode initialization
// -----------------------------
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

// -----------------------------
// Data loading
// -----------------------------
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

// -----------------------------
// App initialization
// -----------------------------
function init() {
  // Initialize dark mode toggle
  initDarkMode();

  // Set app version badge
  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  // Hide "Next question" by default until a mode actually starts
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

  // Start initial load (questions only; no quiz yet)
  loadDataBySource(defaultSource);

  // Bind UI events, including mode logic
  bindUIEvents({
    onTopicChange: (topic) => {
      // Only meaningful in practice mode; but safe regardless
      loadTopic(topic || "all");
    },
    onNext: nextQuestion,
    onSourceChange: loadDataBySource,

    // Start test: start a fixed-size test.
    // Timer will show automatically when the first question starts.
    onStartTest: (size) => {
      startTest(size);
    },

    // Mode change: decide behavior per mode
    onModeChange: (mode) => {
      if (mode === "practice") {
        // Show Next button in practice mode
        setNextButtonVisible(true);

        // Make sure timer is visible in practice mode
        if (dom.timerContainer) {
          dom.timerContainer.classList.remove("d-none");
        }
        // Start practice immediately (all topics by default)
        loadTopic("all");
      } else if (mode === "test") {
        // Hide Next button until the test actually starts
        setNextButtonVisible(false);

        // Hide timer until user clicks "Start test"
        if (dom.timerContainer) {
          dom.timerContainer.classList.add("d-none");
        }
        // Clear question area and wait for Start test
        renderEmpty('Select a test size and click "Start test" to begin.');
      } else {
        // No mode (safety fallback)
        setNextButtonVisible(false);
      }
    },
  });
}

init();
