// ui/render.js
import { dom } from "./dom.js";
import { renderTopicCharts } from "../quiz/charts.js";

export function renderEmpty(message) {
  if (dom.questionTitle) dom.questionTitle.textContent = message;
  if (dom.optionsContainer) dom.optionsContainer.innerHTML = "";
  if (dom.feedback) dom.feedback.innerHTML = "";
  if (dom.questionMeta) dom.questionMeta.textContent = "";
}

export function renderMeta(
  question,
  { index, total, isTestMode, correctCount, answeredCount }
) {
  if (!dom.questionMeta) return;

  const parts = [];

  if (question.id) parts.push(`ID: ${question.id}`);
  if (question.topic) parts.push(`Topic: ${question.topic}`);
  parts.push(`Q ${index} of ${total}`);

  if (isTestMode) {
    parts.push(`Score: ${correctCount}/${answeredCount || 0}`);
  }

  dom.questionMeta.textContent = parts.join(" • ");
}

export function renderQuestion(question, { onAnswer }) {
  if (!dom.questionTitle || !dom.optionsContainer || !dom.feedback) return;
  if (!onAnswer) return;

  dom.questionTitle.textContent = question.question || "";
  dom.optionsContainer.innerHTML = "";
  dom.feedback.innerHTML = "";

  if (question.isMulti) {
    // Multi-select: checkboxes + submit button
    question.options.forEach((opt, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "form-check mb-1";

      const input = document.createElement("input");
      input.className = "form-check-input";
      input.type = "checkbox";
      input.id = `qopt-${idx}`;
      input.value = String(idx);

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = input.id;
      label.textContent = opt;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      dom.optionsContainer.appendChild(wrapper);
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn btn-outline-primary w-100 mt-2";
    submitBtn.textContent = "Submit answer";

    submitBtn.onclick = () => {
      const checks = dom.optionsContainer.querySelectorAll(
        "input.form-check-input"
      );
      const selected = [];
      checks.forEach((c, idx) => {
        if (c.checked) selected.push(idx);
        c.disabled = true;
      });
      submitBtn.disabled = true;
      onAnswer(selected);
    };

    dom.optionsContainer.appendChild(submitBtn);
  } else {
    // Single-answer: buttons
    question.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-primary w-100 text-start mb-2";
      btn.textContent = opt;

      btn.onclick = () => {
        const allBtns = dom.optionsContainer.querySelectorAll("button");
        allBtns.forEach((b) => (b.disabled = true));
        onAnswer([idx]);
      };

      dom.optionsContainer.appendChild(btn);
    });
  }
}

export function renderFeedback(
  question,
  { selectedIndices, correctIndices, isCorrect }
) {
  if (!dom.feedback || !dom.optionsContainer) return;

  const safeSelected = Array.isArray(selectedIndices) ? selectedIndices : [];
  const safeCorrect = Array.isArray(correctIndices) ? correctIndices : [];

  const correctTexts = safeCorrect
    .map((i) => question.options?.[i])
    .filter(Boolean);

  // Colorize options
  const buttons = dom.optionsContainer.querySelectorAll("button");
  const checks = dom.optionsContainer.querySelectorAll(
    "input.form-check-input"
  );

  if (buttons.length) {
    buttons.forEach((btn, idx) => {
      const isSel = safeSelected.includes(idx);
      const isCor = safeCorrect.includes(idx);

      btn.classList.remove("btn-outline-primary", "btn-success", "btn-danger");

      if (isCor) {
        btn.classList.add("btn-success");
      } else if (isSel && !isCor) {
        btn.classList.add("btn-danger");
      } else {
        btn.classList.add("btn-outline-primary");
      }
    });
  } else if (checks.length) {
    checks.forEach((chk, idx) => {
      const isSel = safeSelected.includes(idx);
      const isCor = safeCorrect.includes(idx);
      const label = chk.nextElementSibling;
      if (!label) return;

      label.classList.remove("text-success", "text-danger");

      if (isCor) {
        label.classList.add("text-success");
      } else if (isSel && !isCor) {
        label.classList.add("text-danger");
      }
    });
  }

  const explanation = question.explanation || "";
  const correctHtml = correctTexts.length
    ? `<div>Correct answer(s): <strong>${correctTexts.join(
        ", "
      )}</strong></div>`
    : "";

  dom.feedback.innerHTML = `
    <div class="alert ${isCorrect ? "alert-success" : "alert-danger"}">
      <strong>${isCorrect ? "Correct." : "Incorrect."}</strong><br>
      ${correctHtml}
      ${explanation}
    </div>
  `;
}

// NEW: visually nice per-topic summary
export function renderSessionSummary({
  perTopicStats,
  correctCount,
  answeredCount,
  isTestMode,
}) {
  if (!dom.feedback) return;

  const totalAnswered = answeredCount || 0;
  const overallPct =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const entries = Object.entries(perTopicStats || {});
  if (!entries.length && totalAnswered === 0) {
    return; // nothing to show
  }

  const topicRows = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, stats]) => {
      const pct =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

      return `
        <div class="list-group-item bg-transparent px-0">
          <div class="d-flex justify-content-between align-items-center">
            <strong>${topic}</strong>
            <span class="badge bg-secondary">${pct}%</span>
          </div>
          <div class="small text-muted mb-1">
            ${stats.correct} / ${stats.total} correct
          </div>
          <div class="progress" style="height: 4px;">
            <div
              class="progress-bar"
              role="progressbar"
              style="width: ${pct}%;"
              aria-valuenow="${pct}"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      `;
    })
    .join("");

  const modeLabel = isTestMode ? "Timed practice test" : "Practice session";

  dom.feedback.innerHTML = `
    <div class="card mt-3 shadow-sm session-summary-card">
      <div class="card-body">
        <h6 class="card-title mb-1">Session summary</h6>
        <p class="small text-muted mb-2">${modeLabel}</p>

        <div class="mb-3">
          <span class="badge bg-primary me-2">
            Overall: ${correctCount}/${totalAnswered || 0}
          </span>
          <span class="badge bg-info text-dark">
            ${overallPct}% correct
          </span>
        </div>

        ${
          topicRows
            ? `
          <div class="list-group list-group-flush small">
            ${topicRows}
          </div>
        `
            : `<p class="small text-muted mb-0">No topic-level stats available.</p>`
        }
      </div>
    </div>
  `;
  renderTopicCharts(perTopicStats);
}
