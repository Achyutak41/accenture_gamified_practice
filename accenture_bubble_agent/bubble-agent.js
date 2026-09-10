/*
  Accenture Bubble Agent
  ----------------------
  Question engine for clickable bubble-style gamified questions.

  Supported task types:
    - smallest
    - largest
    - closest
    - greatest_difference
    - smallest_difference

  Minimum practice length: 50 questions.
  There is no maximum; the engine keeps generating questions until the
  15-minute timer ends.
*/

const BUBBLE_CONFIG = {
  durationSeconds: 15 * 60,
  minimumQuestions: 50,
  optionsPerQuestion: 3
};

const TASKS = [
  { type: "smallest", text: "Select the smallest value." },
  { type: "largest", text: "Select the largest value." },
  { type: "closest", text: "Select the value closest to {target}." }
];

const state = {
  questionNumber: 1,
  score: 0,
  answered: 0,
  timeLeft: BUBBLE_CONFIG.durationSeconds,
  currentQuestion: null,
  locked: false,
  timerId: null
};

const $ = (id) => document.getElementById(id);

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  const n = Math.random() * (max - min) + min;
  return Number(n.toFixed(decimals));
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function formatNumber(n) {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(2)));
}

function makeArithmeticExpression() {
  const type = randInt(1, 5);

  if (type === 1) {
    const a = randFloat(2, 20, 1);
    const b = randFloat(1, 9, 1);
    const c = randInt(1, 10);
    return {
      expression: `${formatNumber(a)} × ${formatNumber(b)} + ${c}`,
      value: a * b + c
    };
  }

  if (type === 2) {
    const a = randInt(4, 30);
    const b = randFloat(1, 9, 1);
    const c = randFloat(0.5, 8, 1);
    return {
      expression: `${a} − ${formatNumber(b)} + ${formatNumber(c)}`,
      value: a - b + c
    };
  }

  if (type === 3) {
    const root = randInt(4, 20);
    const divisor = randInt(2, 6);
    const add = randInt(1, 9);
    return {
      expression: `√${root * root} ÷ ${divisor} + ${add}`,
      value: root / divisor + add
    };
  }

  if (type === 4) {
    const a = randInt(10, 60);
    const b = randInt(2, 9);
    const c = randInt(1, 10);
    return {
      expression: `(${a} + ${b}) ÷ ${c}`,
      value: (a + b) / c
    };
  }

  const a = randFloat(1, 30, 1);
  const b = randFloat(1, 15, 1);
  return {
    expression: `${formatNumber(a)} × ${formatNumber(b)}`,
    value: a * b
  };
}

function generateDistinctExpressions(count = 3) {
  const items = [];
  const seen = new Set();

  while (items.length < count) {
    const item = makeArithmeticExpression();
    const rounded = Number(item.value.toFixed(6));

    if (!seen.has(rounded)) {
      seen.add(rounded);
      items.push({
        label: item.expression,
        value: item.value
      });
    }
  }

  return items;
}

function chooseTask(items) {
  const task = TASKS[randInt(0, TASKS.length - 1)];

  if (task.type === "smallest") {
    const answer = Math.min(...items.map(x => x.value));
    return { ...task, target: null, answer };
  }

  if (task.type === "largest") {
    const answer = Math.max(...items.map(x => x.value));
    return { ...task, target: null, answer };
  }

  const values = items.map(x => x.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const target = Number((average + randFloat(-3, 3, 1)).toFixed(1));

  const answer = values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best
  );

  return { ...task, target, answer };
}

function generateQuestion() {
  let items = generateDistinctExpressions(BUBBLE_CONFIG.optionsPerQuestion);
  let task = chooseTask(items);

  return {
    items,
    task,
    answer: task.answer
  };
}

function renderQuestion() {
  state.locked = false;
  state.currentQuestion = generateQuestion();

  const { items, task } = state.currentQuestion;

  $("questionNumber").textContent = state.questionNumber;
  $("score").textContent = state.score;
  $("progressText").textContent = `${state.answered} answered`;
  $("progressBar").style.width =
    `${Math.min((state.answered / BUBBLE_CONFIG.minimumQuestions) * 100, 100)}%`;

  $("instruction").textContent =
    task.type === "closest"
      ? task.text.replace("{target}", formatNumber(task.target))
      : task.text;

  $("hint").textContent = "Click the bubble that is your answer.";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("nextButton").hidden = true;

  const container = $("bubbles");
  container.innerHTML = "";

  shuffle(items).forEach(item => {
    const button = document.createElement("button");
    button.className = "bubble";
    button.type = "button";
    button.textContent = item.label;

    // Store the calculated numerical answer, not the displayed expression.
    button.dataset.value = String(item.value);

    button.addEventListener("click", () => handleAnswer(button, item));
    container.appendChild(button);
  });
}

function handleAnswer(button, item) {
  if (state.locked) return;
  state.locked = true;
  state.answered++;

  const correct =
    Math.abs(item.value - state.currentQuestion.answer) < 0.000001;

  document.querySelectorAll(".bubble").forEach(b => b.disabled = true);

  const correctButton = [...document.querySelectorAll(".bubble")]
    .find(b => Math.abs(Number(b.dataset.value) - state.currentQuestion.answer) < 0.000001);

  if (correctButton) correctButton.classList.add("correct");

  if (correct) {
    state.score++;
    button.classList.add("correct");
    $("feedback").textContent = "Correct! ✓";
    $("feedback").className = "feedback correct-text";
  } else {
    button.classList.add("wrong");
    $("feedback").textContent =
      `Not quite. Correct answer: ${formatNumber(state.currentQuestion.answer)}`;
    $("feedback").className = "feedback wrong-text";
  }

  $("score").textContent = state.score;
  $("progressText").textContent = `${state.answered} answered`;
  $("progressBar").style.width =
    `${Math.min((state.answered / BUBBLE_CONFIG.minimumQuestions) * 100, 100)}%`;

  $("nextButton").hidden = false;
}

function nextQuestion() {
  state.questionNumber++;
  renderQuestion();
}

function finishPractice(reason = "Time's up!") {
  clearInterval(state.timerId);
  document.querySelectorAll(".bubble").forEach(b => b.disabled = true);
  $("nextButton").hidden = true;

  $("instruction").textContent = reason;
  $("hint").textContent =
    `Final score: ${state.score}/${state.answered}. ` +
    `Minimum target: ${BUBBLE_CONFIG.minimumQuestions} questions.`;
  $("feedback").textContent =
    state.answered >= BUBBLE_CONFIG.minimumQuestions
      ? "Practice complete. Great work!"
      : "Time ended before 50 questions. Try again and improve your speed.";
  $("feedback").className = "feedback";
}

function updateTimer() {
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  $("timer").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (state.timeLeft <= 0) {
    finishPractice();
    return;
  }

  state.timeLeft--;
}

function startTimer() {
  updateTimer();
  state.timerId = setInterval(updateTimer, 1000);
}

$("nextButton").addEventListener("click", nextQuestion);

renderQuestion();
startTimer();
