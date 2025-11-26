import { dom } from "./dom.js";

function setModeUI(mode) {
  if (!dom.practiceControls || !dom.testControls) return;

  if (mode === "test") {
    // Only switch visible controls; timer is handled in app.js
    dom.practiceControls.classList.add("d-none");
    dom.testControls.classList.remove("d-none");
  } else if (mode === "practice") {
    dom.practiceControls.classList.remove("d-none");
    dom.testControls.classList.add("d-none");
  } else {
    // No mode selected: hide both
    dom.practiceControls.classList.add("d-none");
    dom.testControls.classList.add("d-none");
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

  // Mode radio buttons: Practice vs Test
  if (dom.modePracticeRadio && dom.modeTestRadio) {
    const handleModeChange = () => {
      let mode = null;
      if (dom.modeTestRadio.checked) mode = "test";
      if (dom.modePracticeRadio.checked) mode = "practice";

      // Just toggle layout here
      setModeUI(mode);

      // Let app.js decide behavior (timer, loading questions, etc.)
      if (mode && onModeChange) {
        onModeChange(mode);
      }
    };

    dom.modePracticeRadio.onchange = handleModeChange;
    dom.modeTestRadio.onchange = handleModeChange;

    // Initial state: no mode selected, no controls visible
    setModeUI(null);
  }

  // Start test button
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
