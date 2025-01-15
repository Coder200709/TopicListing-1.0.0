let quizData = {};
let selectedQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let timerInterval;

async function loadQuizData() {
  const response = await fetch("quizDatabase.json");
  quizData = await response.json();
  populateTopics();
}

function populateTopics() {
  const topicList = document.getElementById("topicList");
  topicList.innerHTML = "";

  quizData.mainTopics.forEach((mainTopic, mainTopicIndex) => {
    const mainTopicContainer = document.createElement("div");
    mainTopicContainer.className = "main-topic-container";

    const mainTopicHeader = document.createElement("h3");
    mainTopicHeader.textContent = mainTopic.mainTopicName;
    mainTopicContainer.appendChild(mainTopicHeader);

    const subTopicList = document.createElement("ul");
    subTopicList.className = "subtopic-list";

    mainTopic.subTopics.forEach((subTopic, subTopicIndex) => {
      const subTopicItem = document.createElement("li");
      subTopicItem.className = "subtopic-item";

      const subTopicCheckbox = document.createElement("input");
      subTopicCheckbox.type = "checkbox";
      subTopicCheckbox.id = `${mainTopicIndex}-${subTopicIndex}`;
      subTopicCheckbox.value = JSON.stringify({
        mainTopic: mainTopic.mainTopicName,
        subTopicName: subTopic.subTopicName,
        questions: subTopic.questions,
      });
      subTopicCheckbox.className = "topic-checkbox";
      subTopicCheckbox.onchange = updateMaxQuestions;

      const subTopicLabel = document.createElement("label");
      subTopicLabel.htmlFor = subTopicCheckbox.id;
      subTopicLabel.textContent = `${subTopic.subTopicName} (${mainTopic.mainTopicName})`;

      subTopicItem.appendChild(subTopicCheckbox);
      subTopicItem.appendChild(subTopicLabel);
      subTopicList.appendChild(subTopicItem);
    });

    mainTopicContainer.appendChild(subTopicList);
    topicList.appendChild(mainTopicContainer);
  });
}

function updateMaxQuestions() {
  let totalQuestions = 0;
  const selectedTopics = Array.from(
    document.getElementsByClassName("topic-checkbox")
  )
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => JSON.parse(checkbox.value));

  selectedTopics.forEach((topic) => {
    totalQuestions += topic.questions.length;
  });

  document.getElementById("questionCount").max = totalQuestions;
  document.getElementById("questionCount").value = Math.min(
    document.getElementById("questionCount").value,
    totalQuestions
  );
}

function startQuiz() {
  const selectedTopics = Array.from(
    document.getElementsByClassName("topic-checkbox")
  )
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => JSON.parse(checkbox.value));

  const questionCount = parseInt(
    document.getElementById("questionCount").value
  );
  const timeLimit = parseInt(document.getElementById("timer").value) * 60;

  selectedQuestions = [];
  selectedTopics.forEach((topic) => {
    selectedQuestions.push(...topic.questions);
  });

  selectedQuestions = shuffleArray(selectedQuestions).slice(0, questionCount);

  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  document.getElementById("quiz-settings").style.display = "none";
  document.getElementById("quizSection").style.display = "block";

  startTimer(timeLimit);

  displayQuestion();
}
function startTimer(timeLimit) {
  let remainingTime = timeLimit;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    document.getElementById("timerDisplay").textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    remainingTime--;

    if (remainingTime < 0) {
      clearInterval(timerInterval);
      showResults();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  document.getElementById("timerDisplay").innerHTML = "00:00";
}

function displayQuestion() {
  const questionData = selectedQuestions[currentQuestionIndex];
  const questionContainer = document.getElementById("question");
  const optionsContainer = document.getElementById("options");

  questionContainer.textContent = questionData.question;

  const imageContainer = document.getElementById("questionImage");
  if (questionData.image) {
    imageContainer.style.display = "block";
    imageContainer.src = questionData.image;
  } else {
    imageContainer.style.display = "none";
  }

  optionsContainer.innerHTML = "";
  questionData.options.forEach((option, index) => {
    const optionBtn = document.createElement("button");
    optionBtn.textContent = option;
    optionBtn.onclick = () => selectAnswer(option);
    optionsContainer.appendChild(optionBtn);
  });
}
function selectAnswer(selectedOption) {
  const correctAnswer = selectedQuestions[currentQuestionIndex].answer;
  userAnswers.push({
    question: selectedQuestions[currentQuestionIndex].question,
    selectedOption,
    correctAnswer,
  });

  if (selectedOption === correctAnswer) score++;
  nextQuestion();
}

function nextQuestion() {
  if (currentQuestionIndex < selectedQuestions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  stopTimer();

  document.getElementById("quizSection").style.display = "none";
  document.getElementById("resultsSection").style.display = "block";

  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = `<p>Score: ${score} / ${selectedQuestions.length}</p>`;

  userAnswers.forEach((answer, index) => {
    const result = document.createElement("div");

    const questionText = document.createElement("p");
    questionText.innerHTML = `Q${index + 1}: ${answer.question}`;
    result.appendChild(questionText);

    const imageContainer = document.createElement("img");
    if (selectedQuestions[index].image) {
      imageContainer.src = selectedQuestions[index].image;
      imageContainer.alt = "Question Image";
      imageContainer.style.maxWidth = "200px";
      imageContainer.style.display = "block";
      result.appendChild(imageContainer);
    }

    const optionsList = document.createElement("div");
    optionsList.className = "options-list";

    selectedQuestions[index].options.forEach((option) => {
      const optionItem = document.createElement("div");
      optionItem.className = "option-item";
      optionItem.innerHTML = option;

      if (answer.selectedOption === option) {
        optionItem.style.fontWeight = "bold";
        optionItem.style.color =
          answer.selectedOption === answer.correctAnswer ? "green" : "red";
      }

      optionsList.appendChild(optionItem);
    });

    result.appendChild(optionsList);

    const correctAnswerText = document.createElement("p");
    correctAnswerText.innerHTML = `<strong>Correct answer: </strong> ${answer.correctAnswer}`;
    result.appendChild(correctAnswerText);

    resultsContainer.appendChild(result);
  });
}

function createOption(optionText, resultClass) {
  const optionContainer = document.createElement("div");
  optionContainer.className = resultClass;
  optionContainer.innerHTML = "Selected option " + optionText;
  return optionContainer;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function restartQuiz() {
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("quiz-settings").style.display = "block";

  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  document.getElementById("questionCount").value = 1;

  populateTopics();
}

window.onload = loadQuizData;
