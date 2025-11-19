let questionsByTopic = {};
let currentQuestions = [];
let currentTopic = "all";
let currentIndex = 0;

const topicSelect = document.getElementById("topicSelect");
const questionTitle = document.getElementById("questionTitle");
const optionsContainer = document.getElementById("optionsContainer");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const questionMeta = document.getElementById("questionMeta");

// Shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildAllQuestions() {
  return Object.values(questionsByTopic).flat();
}

function loadTopic(topic) {
  currentTopic = topic;
  currentQuestions =
    topic === "all"
      ? shuffle(buildAllQuestions().slice())
      : shuffle(questionsByTopic[topic].slice());

  currentIndex = 0;
  showQuestion();
}

function showQuestion() {
  feedback.innerHTML = "";
  optionsContainer.innerHTML = "";

  if (!currentQuestions.length) {
    questionTitle.textContent = "No questions available for this topic.";
    questionMeta.textContent = "";
    return;
  }

  if (currentIndex >= currentQuestions.length) {
    questionTitle.textContent = "You've completed all questions 🎉";
    questionMeta.textContent = "";
    return;
  }

  const q = currentQuestions[currentIndex];
  questionTitle.textContent = q.question;
  questionMeta.textContent = `ID: ${q.id} • Topic: ${q.topic} • Difficulty: ${q.difficulty}`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary w-100 text-start mb-2";
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(q, idx, btn);
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(question, chosenIndex, clickedButton) {
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = chosenIndex === question.correct_index;

  if (isCorrect) {
    clickedButton.classList.replace("btn-outline-primary", "btn-success");
    feedback.innerHTML = `<div class="alert alert-success">
      <strong>Correct!</strong><br>${question.explanation}
    </div>`;
  } else {
    clickedButton.classList.replace("btn-outline-primary", "btn-danger");
    const correctAnswer = question.options[question.correct_index];
    feedback.innerHTML = `<div class="alert alert-danger">
      <strong>Incorrect.</strong><br>
      Correct: <strong>${correctAnswer}</strong><br>
      ${question.explanation}
    </div>`;
  }
}

// Next question button
nextBtn.addEventListener("click", () => {
  currentIndex++;
  showQuestion();
});

// Load JSON
fetch("questions.json")
  .then((res) => res.json())
  .then((data) => {
    questionsByTopic = data;

    // Fill dropdown
    const optionAll = document.createElement("option");
    optionAll.value = "all";
    optionAll.textContent = "All topics";
    topicSelect.appendChild(optionAll);

    Object.keys(questionsByTopic).forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      topicSelect.appendChild(opt);
    });

    topicSelect.value = "all";
    loadTopic("all");
  })
  .catch((err) => {
    questionTitle.textContent = "Error loading questions.json 😢";
    console.error(err);
  });

topicSelect.addEventListener("change", () => {
  loadTopic(topicSelect.value);
});
