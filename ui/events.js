import { dom } from "./dom.js";

function setModeUI(mode) {
  if (!dom.practiceControls || !dom.testControls) return;

  if (mode === "test") {
    // Show timer container only after mode is selected
    if (dom.timerContainer) {
      dom.timerContainer.classList.remove("d-none");
    }
    dom.practiceControls.classList.add("d-none");
    dom.testControls.classList.remove("d-none");
  } else if (mode === "practice") {
    // Show timer container only after mode is selected
    if (dom.timerContainer) {
      dom.timerContainer.classList.remove("d-none");
    }

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

      setModeUI(mode);

      if (mode && onModeChange) {
        onModeChange(mode);
      }
    };

    dom.modePracticeRadio.onchange = handleModeChange;
    dom.modeTestRadio.onchange = handleModeChange;

    // Do NOT call handleModeChange() here – wait for the user
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
