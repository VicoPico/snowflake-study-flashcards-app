import { TIME_LIMIT } from "../config.js";
import { dom } from "../ui/dom.js";

let timeLeft = TIME_LIMIT;
let timerInterval = null;

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function renderTimer() {
  if (dom.timerText) {
    dom.timerText.textContent = `Time left: ${timeLeft}s`;
  }
  if (dom.timerBar) {
    const pct = Math.max(0, (timeLeft / TIME_LIMIT) * 100);
    dom.timerBar.style.width = `${pct}%`;

    dom.timerBar.classList.toggle("bg-danger", timeLeft <= 10);
    dom.timerBar.classList.toggle(
      "bg-warning",
      timeLeft > 10 && timeLeft <= 20
    );
    dom.timerBar.classList.toggle("bg-primary", timeLeft > 20);
  }
}

export function startTimer(onTimeout) {
  stopTimer();
  timeLeft = TIME_LIMIT;
  renderTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 1000);
}
