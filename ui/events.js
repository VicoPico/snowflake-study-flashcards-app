import { dom } from "./dom.js";

export function bindUIEvents({ onTopicChange, onNext, onSourceChange }) {
  if (dom.topicSelect) {
    dom.topicSelect.onchange = () => onTopicChange(dom.topicSelect.value);
  }

  if (dom.nextBtn) {
    dom.nextBtn.onclick = onNext;
  }

  if (dom.dataSourceSelect) {
    dom.dataSourceSelect.onchange = () =>
      onSourceChange(dom.dataSourceSelect.value);
  }
}
