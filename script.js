const screens = {
  question: document.getElementById("questionScreen"),
  activity: document.getElementById("activityScreen"),
  date: document.getElementById("dateScreen"),
  final: document.getElementById("finalScreen")
};

const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const activityButtons = document.querySelectorAll("[data-activity]");
const activityNextButton = document.getElementById("activityNextButton");
const dateButtons = document.querySelectorAll("[data-date]");
const customTime = document.getElementById("customTime");
const confirmButton = document.getElementById("confirmButton");
const summaryActivity = document.getElementById("summaryActivity");
const summaryDate = document.getElementById("summaryDate");
const summaryTime = document.getElementById("summaryTime");

const form = document.getElementById("dateForm");
const submitButton = document.getElementById("submitChoiceButton");
const formStatus = document.getElementById("formStatus");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const fireworksContext = fireworksCanvas.getContext("2d");

let selectedActivity = "";
let selectedDate = "";
let selectedTime = "";
let noButtonEscapes = 0;
const dodgeDistance = 70;
let noButtonIsMoving = false;
let fireworksAnimationId = 0;
let fireworksParticles = [];
let fireworksTimeouts = [];

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  screens[screenName].classList.add("active");
}

function resizeFireworksCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;

  fireworksCanvas.width = window.innerWidth * pixelRatio;
  fireworksCanvas.height = window.innerHeight * pixelRatio;
  fireworksContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createFireworkBurst(x, y) {
  const colors = ["#f8fafc", "#22d3ee", "#8b5cf6", "#d946ef", "#ec4899"];
  const particleCount = 86;

  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount;
    const speed = 4 + Math.random() * 7.5;

    fireworksParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.8 + Math.random() * 4.8,
      life: 1,
      decay: 0.007 + Math.random() * 0.007,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function animateFireworks() {
  fireworksContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  fireworksParticles = fireworksParticles.filter((particle) => particle.life > 0);

  fireworksParticles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.045;
    particle.vx *= 0.992;
    particle.life -= particle.decay;

    fireworksContext.globalAlpha = Math.max(particle.life, 0);
    fireworksContext.fillStyle = particle.color;
    fireworksContext.shadowBlur = 18;
    fireworksContext.shadowColor = particle.color;
    fireworksContext.beginPath();
    fireworksContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    fireworksContext.fill();
  });

  fireworksContext.globalAlpha = 1;
  fireworksContext.shadowBlur = 0;

  if (fireworksParticles.length > 0) {
    fireworksAnimationId = requestAnimationFrame(animateFireworks);
  } else {
    fireworksCanvas.classList.remove("is-active");
    fireworksAnimationId = 0;
  }
}

function launchFireworks() {
  resizeFireworksCanvas();
  fireworksCanvas.classList.add("is-active");

  if (fireworksAnimationId) {
    cancelAnimationFrame(fireworksAnimationId);
  }

  fireworksTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });

  fireworksParticles = [];
  fireworksTimeouts = [];

  const bursts = [
    [0, 0.5, 0.34],
    [300, 0.24, 0.44],
    [620, 0.76, 0.42],
    [980, 0.42, 0.58],
    [1350, 0.62, 0.24],
    [1720, 0.18, 0.28],
    [2100, 0.82, 0.58],
    [2520, 0.5, 0.5]
  ];

  bursts.forEach(([delay, xRatio, yRatio]) => {
    const timeoutId = window.setTimeout(() => {
      createFireworkBurst(window.innerWidth * xRatio, window.innerHeight * yRatio);
    }, delay);

    fireworksTimeouts.push(timeoutId);
  });

  fireworksAnimationId = requestAnimationFrame(animateFireworks);
}

function updateDateSelection(dateValue) {
  selectedDate = dateValue;
  updateConfirmButton();
}

function updateTimeSelection(timeValue) {
  selectedTime = timeValue;
  updateConfirmButton();
}

function updateConfirmButton() {
  selectedTime = customTime.value;
  confirmButton.disabled = !selectedDate || !selectedTime;
}

function formatDateForSummary(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function moveNoButtonAway(pointerX, pointerY) {
  if (noButtonIsMoving) {
    return;
  }

  noButtonIsMoving = true;
  window.setTimeout(() => {
    noButtonIsMoving = false;
  }, 90);

  const margin = 18;
  const rect = noButton.getBoundingClientRect();
  const cardRect = document.querySelector(".question-card").getBoundingClientRect();
  const maxLeft = Math.max(margin, cardRect.width - rect.width - margin);
  const maxTop = Math.max(margin, cardRect.height - rect.height - margin);
  const currentLeft = Math.max(margin, Math.min(rect.left - cardRect.left, maxLeft));
  const currentTop = Math.max(margin, Math.min(rect.top - cardRect.top, maxTop));

  noButton.style.setProperty("--no-left", `${currentLeft}px`);
  noButton.style.setProperty("--no-top", `${currentTop}px`);
  noButton.classList.add("is-running");

  let nextLeft = margin;
  let nextTop = margin;

  // Pick a visible spot inside the card and away from the attempted click/tap.
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidateLeft = margin + Math.random() * Math.max(maxLeft - margin, 1);
    const candidateTop = margin + Math.random() * Math.max(maxTop - margin, 1);
    const centerX = cardRect.left + candidateLeft + rect.width / 2;
    const centerY = cardRect.top + candidateTop + rect.height / 2;
    const distance = Math.hypot(centerX - pointerX, centerY - pointerY);

    nextLeft = candidateLeft;
    nextTop = candidateTop;

    if (distance > dodgeDistance) {
      break;
    }
  }

  noButtonEscapes += 1;
  noButton.style.setProperty("--no-left", `${Math.max(margin, Math.min(nextLeft, maxLeft))}px`);
  noButton.style.setProperty("--no-top", `${Math.max(margin, Math.min(nextTop, maxTop))}px`);
  noButton.style.transform = `rotate(${noButtonEscapes % 2 === 0 ? -5 : 5}deg)`;
}

function dodgeIfClose(pointerX, pointerY) {
  const rect = noButton.getBoundingClientRect();
  const buttonCenterX = rect.left + rect.width / 2;
  const buttonCenterY = rect.top + rect.height / 2;
  const distance = Math.hypot(buttonCenterX - pointerX, buttonCenterY - pointerY);

  if (distance < dodgeDistance) {
    moveNoButtonAway(pointerX, pointerY);
  }
}

function blockNoButtonAttempt(event) {
  event.preventDefault();
  event.stopPropagation();

  const pointerX = event.clientX || window.innerWidth / 2;
  const pointerY = event.clientY || window.innerHeight / 2;
  moveNoButtonAway(pointerX, pointerY);
}

function blockNoButtonTouchAttempt(event) {
  event.preventDefault();
  event.stopPropagation();

  const touch = event.touches[0] || event.changedTouches[0];
  const pointerX = touch ? touch.clientX : window.innerWidth / 2;
  const pointerY = touch ? touch.clientY : window.innerHeight / 2;
  moveNoButtonAway(pointerX, pointerY);
}

function fillFormFields() {
  const dateWithTime = `${selectedDate} um ${selectedTime}`;

  document.getElementById("formActivity").value = selectedActivity;
  document.getElementById("formDate").value = dateWithTime;
  document.getElementById("formTimestamp").value = new Date().toLocaleString();
  document.getElementById("formMessage").value =
    `She said yes. Activity: ${selectedActivity}. Date: ${dateWithTime}.`;
}

function showFinalScreen() {
  const displayDate = formatDateForSummary(selectedDate);

  summaryActivity.textContent = selectedActivity;
  summaryDate.textContent = displayDate;
  summaryTime.textContent = selectedTime;
  localStorage.setItem("dateActivity", selectedActivity);
  localStorage.setItem("dateDate", selectedDate);
  localStorage.setItem("dateTime", selectedTime);

  fillFormFields();
  showScreen("final");
}

yesButton.addEventListener("click", () => {
  showScreen("activity");
});

// Mouse, pointer, and touch checks make the No button evasive on desktop and mobile.
document.addEventListener("pointermove", (event) => {
  if (screens.question.classList.contains("active")) {
    dodgeIfClose(event.clientX, event.clientY);
  }
});

document.addEventListener("touchmove", (event) => {
  if (!screens.question.classList.contains("active")) {
    return;
  }

  const touch = event.touches[0];
  dodgeIfClose(touch.clientX, touch.clientY);
}, { passive: true });

document.addEventListener("touchstart", (event) => {
  if (!screens.question.classList.contains("active")) {
    return;
  }

  const touch = event.touches[0];
  dodgeIfClose(touch.clientX, touch.clientY);
}, { passive: true });

noButton.addEventListener("pointerenter", (event) => {
  moveNoButtonAway(event.clientX, event.clientY);
});

noButton.addEventListener("pointerdown", blockNoButtonAttempt);
noButton.addEventListener("mousedown", blockNoButtonAttempt);
noButton.addEventListener("touchstart", blockNoButtonTouchAttempt, { passive: false });
noButton.addEventListener("click", blockNoButtonAttempt);
noButton.addEventListener("focus", () => {
  moveNoButtonAway(window.innerWidth / 2, window.innerHeight / 2);
});

window.addEventListener("resize", () => {
  resizeFireworksCanvas();

  if (!noButton.classList.contains("is-running")) {
    return;
  }

  const rect = noButton.getBoundingClientRect();
  const cardRect = document.querySelector(".question-card").getBoundingClientRect();
  const margin = 16;
  const maxLeft = Math.max(margin, cardRect.width - rect.width - margin);
  const maxTop = Math.max(margin, cardRect.height - rect.height - margin);
  const nextLeft = Math.min(rect.left - cardRect.left, maxLeft);
  const nextTop = Math.min(rect.top - cardRect.top, maxTop);

  noButton.style.setProperty("--no-left", `${Math.max(margin, nextLeft)}px`);
  noButton.style.setProperty("--no-top", `${Math.max(margin, nextTop)}px`);
});

activityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activityButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedActivity = button.dataset.activity;
    activityNextButton.disabled = false;
  });
});

activityNextButton.addEventListener("click", () => {
  if (selectedActivity) {
    updateConfirmButton();
    showScreen("date");
  }
});

dateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    dateButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    updateDateSelection(button.dataset.date);
  });
});

customTime.addEventListener("input", () => {
  updateTimeSelection(customTime.value);
});

customTime.addEventListener("change", () => {
  updateTimeSelection(customTime.value);
});

confirmButton.addEventListener("click", () => {
  updateConfirmButton();

  if (selectedActivity && selectedDate && selectedTime) {
    showFinalScreen();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updateConfirmButton();

  if (!selectedActivity || !selectedDate || !selectedTime) {
    formStatus.textContent = "Please select an activity, a date and a time first.";
    formStatus.className = "error";
    return;
  }

  fillFormFields();

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  formStatus.textContent = "";
  formStatus.className = "";

  const formData = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json"
      }
    });

    if (response.ok) {
      formStatus.textContent = "WUHUUUUUUUUUU";
      formStatus.className = "success";
      submitButton.textContent = "Sent";
      localStorage.setItem("dateActivity", selectedActivity);
      localStorage.setItem("dateDate", selectedDate);
      localStorage.setItem("dateTime", selectedTime);
      launchFireworks();
    } else {
      formStatus.textContent = "Something went wrong. Please try again.";
      formStatus.className = "error";
      submitButton.disabled = false;
      submitButton.textContent = "Send me your choice";
    }
  } catch (error) {
    formStatus.textContent = "Could not send the choice. Please try again.";
    formStatus.className = "error";
    submitButton.disabled = false;
    submitButton.textContent = "Send me your choice";
  }
});
