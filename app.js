import { CONFIG, PASTE_PLACEHOLDER } from "./config.js";
import { setQuestionsByTopic } from "./state.js";
import { showWarning, clearWarning } from "./ui/warnings.js";
import { bindUIEvents } from "./ui/events.js";
import { initQuiz, loadTopic, nextQuestion } from "./quiz/engine.js";
import { loadFromJson, loadFromGoogleSheets } from "./data/loaders.js";
import { dom } from "./ui/dom.js";

async function loadDataBySource(source) {
  clearWarning();

  try {
    if (source === "local") {
      const qbt = await loadFromJson();
      setQuestionsByTopic(qbt);
    } else {
      const qbt = await loadFromGoogleSheets(CONFIG.googleSheetsCsvUrl);
      setQuestionsByTopic(qbt);
    }

    initQuiz(
      Object.keys(
        dom ? (await import("./state.js")).state.questionsByTopic : {}
      )
    );
  } catch (err) {
    console.error(err);

    showWarning(
      source === "sheets"
        ? "We couldn’t load questions from Google Sheets, so the app is using the built-in local questions instead."
        : "Could not load local questions.json."
    );

    const qbt = await loadFromJson();
    setQuestionsByTopic(qbt);
    initQuiz(Object.keys(qbt));
  }
}

(function init() {
  const noRealUrl =
    !CONFIG.googleSheetsCsvUrl ||
    CONFIG.googleSheetsCsvUrl === PASTE_PLACEHOLDER;

  const defaultSource = noRealUrl ? "local" : "sheets";

  if (dom.dataSourceSelect) dom.dataSourceSelect.value = defaultSource;

  if (noRealUrl) {
    showWarning(
      "No Google Sheets URL is configured, so the app is using the built-in local questions instead."
    );
  }

  loadDataBySource(defaultSource);

  bindUIEvents({
    onTopicChange: loadTopic,
    onNext: nextQuestion,
    onSourceChange: loadDataBySource,
  });
})();
