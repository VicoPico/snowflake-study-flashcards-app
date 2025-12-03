import { dom } from "./dom.js";

function setModeUI(mode) {
  const practice = dom.practiceControls;
  const test = dom.testControls;

  if (mode === "practice") {
    if (practice) practice.classList.remove("d-none");
    if (test) test.classList.add("d-none");
  } else if (mode === "test" || mode === "mock") {
    if (practice) practice.classList.add("d-none");
    if (test) test.classList.remove("d-none"); // Start button lives here
  } else {
    // No mode selected: hide both
    if (practice) practice.classList.add("d-none");
    if (test) test.classList.add("d-none");
  }
}

export function bindUIEvents({
  onTopicChange,
  onNext,
  onSourceChange,
  onStartTest,
  onModeChange,
}) {
  if (dom.topicSelect && onTopicChange) {
    dom.topicSelect.onchange = () => onTopicChange(dom.topicSelect.value);
  }

  if (dom.nextBtn && onNext) {
    dom.nextBtn.onclick = onNext;
  }

  if (dom.dataSourceSelect && onSourceChange) {
    dom.dataSourceSelect.onchange = () =>
      onSourceChange(dom.dataSourceSelect.value);
  }

  // Mode radios
  const modeRadios = [
    dom.modePracticeRadio,
    dom.modeTestRadio,
    dom.modeMockRadio,
  ].filter(Boolean);

  if (modeRadios.length && onModeChange) {
    const handleModeChange = () => {
      let mode = null;

      if (dom.modePracticeRadio?.checked) mode = "practice";
      if (dom.modeTestRadio?.checked) mode = "test";
      if (dom.modeMockRadio?.checked) mode = "mock";

      setModeUI(mode);
      if (mode) onModeChange(mode);
    };

    modeRadios.forEach((radio) => (radio.onchange = handleModeChange));
    setModeUI(null); // nothing selected initially
  }

  // Start button
  if (dom.startTestBtn && dom.testSizeSelect && onStartTest) {
    dom.startTestBtn.onclick = () => {
      const sizeValue = dom.testSizeSelect.value;
      if (!sizeValue) return;
      const size = parseInt(sizeValue, 10);
      if (!size || size <= 0) return;
      onStartTest(size);
    };
  }
}
