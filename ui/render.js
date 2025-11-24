import { dom } from "./dom.js";

export function renderEmpty(msg) {
  dom.questionTitle.textContent = msg;
  dom.questionMeta.textContent = "";
  dom.optionsContainer.innerHTML = "";
  dom.feedback.innerHTML = "";
}

export function renderQuestion(q, onAnswer) {
  dom.feedback.innerHTML = "";
  dom.optionsContainer.innerHTML = "";

  dom.questionTitle.textContent = q.question;
  dom.questionMeta.textContent = `ID: ${q.id} • Topic: ${q.topic} • Difficulty: ${q.difficulty}`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary w-100 text-start mb-2";
    btn.textContent = opt;
    btn.onclick = () => onAnswer(idx, btn);
    dom.optionsContainer.appendChild(btn);
  });
}

export function renderAnswerResult(question, chosenIndex, clickedButton) {
  const buttons = dom.optionsContainer.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = chosenIndex === question.correct_index;

  if (isCorrect) {
    clickedButton.classList.replace("btn-outline-primary", "btn-success");
    dom.feedback.innerHTML = `
      <div class="alert alert-success">
        <strong>Correct.</strong><br>${question.explanation}
      </div>
    `;
  } else {
    clickedButton.classList.replace("btn-outline-primary", "btn-danger");
    const correctAnswer = question.options[question.correct_index];
    dom.feedback.innerHTML = `
      <div class="alert alert-danger">
        <strong>Incorrect.</strong><br>
        Correct answer: <strong>${correctAnswer}</strong><br>
        ${question.explanation}
      </div>
    `;
  }
}

export function renderTimeout(question) {
  const buttons = dom.optionsContainer.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  buttons.forEach((b, i) => {
    if (i === question.correct_index) {
      b.classList.replace("btn-outline-primary", "btn-success");
    }
  });

  const correctAnswer = question.options[question.correct_index];

  dom.feedback.innerHTML = `
    <div class="alert alert-warning">
      <strong>Time’s up.</strong><br>
      Correct answer: <strong>${correctAnswer}</strong><br>
      ${question.explanation}
    </div>
  `;
}

export function renderTopics(topics) {
  dom.topicSelect.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "All topics";
  dom.topicSelect.appendChild(optAll);

  topics.forEach((topic) => {
    const opt = document.createElement("option");
    opt.value = topic;
    opt.textContent = topic;
    dom.topicSelect.appendChild(opt);
  });

  dom.topicSelect.value = "all";
}
