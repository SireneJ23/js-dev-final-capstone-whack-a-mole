/**************************************************
 * LOAD FIX
 **************************************************/
window.addEventListener("load", () => {
  window.dispatchEvent(new Event("resize"));
});

/**************************************************
 * DOM SELECTION
 **************************************************/
const holes = Array.from(document.querySelectorAll(".hole"));
const moles = Array.from(document.querySelectorAll(".mole"));
const difficultySelect = document.querySelector("#difficulty");
const startButton = document.querySelector("#start");
const pauseButton = document.querySelector("#pause");
const stopButton = document.querySelector("#stop");
const scoreEl = document.querySelector("#score");
const timerDisplay = document.querySelector("#timer");
const grid = document.querySelector(".grid");
const hammerEl = document.getElementById("hammer");

/* MODAL */
const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalScore = document.getElementById("modalScore");
const modalTarget = document.getElementById("modalTarget");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const diamondCallout = document.getElementById("diamondCallout");

/**************************************************
 * ASSET HELPER
 **************************************************/
const asset = (file) => new URL(`./assets/${file}`, document.baseURI).href;

/**************************************************
 * AUDIO SYSTEM
 **************************************************/
const audioSong = new Audio(asset("song.mp3"));
audioSong.loop = true;

const HIT_SRC = asset("hit.mp3");
const VICTORY_SRC = asset("victory.mp3");
const DEFEAT_SRC = asset("defeat.mp3");

const mixBut = document.getElementById("mixBut");
let soundOn = true;

if (mixBut) {
  mixBut.addEventListener("click", (e) => {
    e.preventDefault();
    soundOn = !soundOn;

    if (!soundOn) {
      audioSong.pause();
      mixBut.innerHTML = `<img src="./assets/sound-on.png" alt="Sound Off">`;
    } else {
      mixBut.innerHTML = `<img src="./assets/sound.png" alt="Sound On">`;
      if (gameRunning && !gamePaused) audioSong.play().catch(() => {});
    }
  });
}

function playSfx(src) {
  if (!soundOn) return;
  new Audio(src).play().catch(() => {});
}

/**************************************************
 * GAME STATE
 **************************************************/
let time = 30;
let points = 0;
let gameRunning = false;
let gamePaused = false;
let timerId = null;
let moleTimeoutId = null;
let confettiIntervalId = null;

let lastHoleIndex = -1;
let currentHoleIndex = -1;
let prevHoleIndex = -1;

let currentDownAt = 0;
let prevDownAt = 0;

let moleAlreadyWhacked = false;
let whackedUntil = 0;
let diamondHits = 0;

const HIT_GRACE_MS = 350;

/**************************************************
 * SCORE & TIMER
 **************************************************/
function updateScore(val) {
  points = val;
  scoreEl.textContent = points;
}

function updateTimer(val) {
  time = val;
  timerDisplay.textContent = time;
}

/**************************************************
 * MOLE LOGIC
 **************************************************/
function chooseHoleIndex() {
  let index;
  do {
    index = Math.floor(Math.random() * holes.length);
  } while (holes.length > 1 && index === lastHoleIndex);
  lastHoleIndex = index;
  return index;
}

function resetMoleVisuals() {
  holes.forEach((h) => h.classList.remove("show"));
  moles.forEach((m) => {
    m.classList.remove("golden", "diamond");
    m.style.backgroundImage = `url("${asset("mole.png")}")`;
  });
  moleAlreadyWhacked = false;
}

function showUp() {
  if (!gameRunning || gamePaused) return;

  if (Date.now() < whackedUntil) {
    moleTimeoutId = setTimeout(showUp, whackedUntil - Date.now());
    return;
  }

  prevHoleIndex = currentHoleIndex;
  prevDownAt = currentDownAt;

  resetMoleVisuals();

  const index = chooseHoleIndex();
  currentHoleIndex = index;

  holes[index].classList.add("show");

  const roll = Math.random();
  if (roll < 0.04) moles[index].classList.add("diamond");
  else if (roll < 0.14) moles[index].classList.add("golden");

  const delay =
    difficultySelect.value === "easy"
      ? 1100
      : difficultySelect.value === "normal"
        ? 900
        : 700;

  currentDownAt = Date.now() + delay;
  moleTimeoutId = setTimeout(showUp, delay);
}

/**************************************************
 * WHACK LOGIC
 **************************************************/
function whack(index) {
  if (!gameRunning || gamePaused || moleAlreadyWhacked) return;

  const now = Date.now();

  const isHittable =
    holes[index].classList.contains("show") ||
    (index === currentHoleIndex && now <= currentDownAt + HIT_GRACE_MS) ||
    (index === prevHoleIndex && now <= prevDownAt + HIT_GRACE_MS);

  if (!isHittable) return;

  moleAlreadyWhacked = true;

  const moleEl = moles[index];
  const isDiamond = moleEl.classList.contains("diamond");
  const isGolden = moleEl.classList.contains("golden");

  const earned = isDiamond ? 100 : isGolden ? 50 : 10;

  if (isDiamond) diamondHits++;

  updateScore(points + earned);
  addWhackEffects(index);
  moleEl.classList.add("whacked");
  setTimeout(() => {
    moleEl.classList.remove("whacked");
  }, 250);

  playSfx(HIT_SRC);

  if (hammerEl) {
    hammerEl.classList.remove("smack");
    void hammerEl.offsetWidth;
    hammerEl.classList.add("smack");
  }

  moleEl.style.backgroundImage = `url("${asset("wmole.png")}")`;

  whackedUntil = Date.now() + 300;

  setTimeout(() => {
    holes[index].classList.remove("show");
    setTimeout(() => {
      moleEl.classList.remove("golden", "diamond");
      moleEl.style.backgroundImage = `url("${asset("mole.png")}")`;
      moleAlreadyWhacked = false;
    }, 100);
  }, 200);
}

holes.forEach((hole, i) =>
  hole.addEventListener("pointerdown", () => whack(i)),
);

function addWhackEffects(index) {
  const hole = holes[index];
  const mole = moles[index];

  // 🟤 Dirt burst
  const dirt = document.createElement("div");
  dirt.className = "dirt-burst";
  hole.appendChild(dirt);
  setTimeout(() => dirt.remove(), 400);

  // ⭐ Floating score pop
  const pop = document.createElement("div");
  pop.className = "score-pop";
  pop.textContent = "+";
  hole.appendChild(pop);
  setTimeout(() => pop.remove(), 600);

  // 🫨 Screen shake (VERY subtle)
  document.querySelector(".wrapper")?.classList.add("shake");
  setTimeout(() => {
    document.querySelector(".wrapper")?.classList.remove("shake");
  }, 200);
}

/**************************************************
 * GAME CONTROLS
 **************************************************/
function startGame() {
  grid.classList.add("playing");

  if (gameRunning && !gamePaused) return;

  if (!gamePaused) {
    updateScore(0);
    updateTimer(30);
    diamondHits = 0;
  }

  gameRunning = true;
  gamePaused = false;
  document.body.classList.add("game-active");
  difficultySelect.disabled = true;
  startButton.disabled = true;

  if (soundOn) audioSong.play().catch(() => {});

  clearInterval(timerId);
  clearTimeout(moleTimeoutId);

  timerId = setInterval(() => {
    if (!gamePaused) {
      time--;
      updateTimer(time);
      if (time <= 0) endGame();
    }
  }, 1000);

  showUp();
}

function pauseGame() {
  if (!gameRunning) return;

  gamePaused = !gamePaused;

  pauseButton.innerHTML = `<img src="./assets/${
    gamePaused ? "resume.png" : "pause.png"
  }">`;

  if (gamePaused) {
    audioSong.pause();
    clearTimeout(moleTimeoutId);
  } else {
    if (soundOn) audioSong.play().catch(() => {});
    showUp();
  }
}

function endGame() {
  grid.classList.remove("playing");

  gameRunning = false;
  gamePaused = false;
  document.body.classList.remove("game-active");

  clearInterval(timerId);
  clearTimeout(moleTimeoutId);

  audioSong.pause();

  difficultySelect.disabled = false;
  startButton.disabled = false;

  const targetScore =
    difficultySelect.value === "easy"
      ? 350
      : difficultySelect.value === "normal"
        ? 450
        : 550;

  const win = points >= targetScore;

  playSfx(win ? VICTORY_SRC : DEFEAT_SRC);

  if (win) {
    startConfetti(3000);
  }

  openResultModal({
    title: win ? "🎉 You Win!" : "😞 You Lose",
    message: win ? "You're a Pro!" : "Keep Practicing!",
    score: points,
    target: targetScore,
  });
}

function resetGameState() {
  grid.classList.remove("playing");

  clearInterval(timerId);
  clearTimeout(moleTimeoutId);
  clearInterval(confettiIntervalId);

  updateScore(0);
  updateTimer(30);
  resetMoleVisuals();

  audioSong.pause();
  audioSong.currentTime = 0;

  gameRunning = false;
  gamePaused = false;
  document.body.classList.remove("game-active");

  difficultySelect.disabled = false;
  startButton.disabled = false;
}

/**************************************************
 * MODAL
 **************************************************/
function openResultModal({title, message, score, target}) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalScore.textContent = score;
  modalTarget.textContent = target;

  if (diamondCallout) {
    diamondCallout.hidden = diamondHits === 0;
    diamondCallout.textContent = `💎 Diamond Hit! (${diamondHits})`;
  }

  resultModal.classList.add("show");
}

playAgainBtn.onclick = () => {
  resultModal.classList.remove("show");
  resetGameState();
  startGame();
};

closeModalBtn.onclick = () => {
  resultModal.classList.remove("show");
  resetGameState();
};

/**************************************************
 * EVENT LISTENERS
 **************************************************/
startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
stopButton.addEventListener("click", resetGameState);

/**************************************************
 * INITIAL SETUP
 **************************************************/
updateScore(0);
updateTimer(30);

/**************************************************
 * CUSTOM WOODEN DROPDOWN LOGIC
 **************************************************/
const dTrigger = document.getElementById("difficulty-trigger");
const dList = document.getElementById("difficulty-list");

const difficultyImages = {
  easy: "./assets/easy.png",
  normal: "./assets/selector.png",
  hard: "./assets/hard.png",
};

function applyDifficultySettings(level) {
  const triggerImg = document.querySelector("#difficulty-trigger img");

  if (triggerImg && difficultyImages[level]) {
    triggerImg.src = difficultyImages[level];
  }
}

window.setDifficulty = function (level, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (difficultySelect) {
    difficultySelect.value = level;
    applyDifficultySettings(level);

    if (dList) dList.classList.remove("show");
  }
};

if (dTrigger && dList) {
  dTrigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!gameRunning) {
      dList.classList.toggle("show");
    }
  });
}

window.addEventListener("click", () => {
  if (dList) dList.classList.remove("show");
});

// Initialize correct image on load
applyDifficultySettings(difficultySelect?.value || "normal");

/**************************************************
 * HAMMER SYSTEM
 **************************************************/
if (hammerEl && grid) {
  hammerEl.style.position = "fixed";
  hammerEl.style.pointerEvents = "none";
  hammerEl.style.zIndex = "99999";

  grid.addEventListener("mouseenter", () => {
    hammerEl.style.display = "block";
  });

  grid.addEventListener("mouseleave", () => {
    hammerEl.style.display = "none";
  });

  grid.addEventListener("mousemove", (e) => {
    hammerEl.style.left = `${e.clientX}px`;
    hammerEl.style.top = `${e.clientY}px`;
  });
}

/**************************************************
 * CONFETTI SYSTEM
 **************************************************/
function startConfetti(durationMs) {
  const confettiFn = window.confetti;
  if (typeof confettiFn !== "function") return;

  const endTime = Date.now() + durationMs;

  // 🎉 Big center explosion
  confettiFn({
    particleCount: 400,
    spread: 180,
    startVelocity: 60,
    decay: 0.9,
    gravity: 0.7,
    scalar: 1.8,
    ticks: 300,
    origin: {x: 0.5, y: 0.45},
    colors: ["#FFD700", "#FF3366", "#00CCFF", "#FFFFFF", "#FF8800"],
    zIndex: 20000,
  });

  // 🔥 Side cannons
  confettiIntervalId = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(confettiIntervalId);
      return;
    }

    confettiFn({
      particleCount: 40,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      scalar: 1.5,
      gravity: 0.8,
      origin: {x: 0, y: 0.7},
      zIndex: 20000,
    });

    confettiFn({
      particleCount: 40,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      scalar: 1.5,
      gravity: 0.8,
      origin: {x: 1, y: 0.7},
      zIndex: 20000,
    });
  }, 180);
}

/**************************************************
 * SPLASH SCREEN LOGIC
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const enterBtn = document.getElementById("enterGame");
  const introSound = document.getElementById("introSound");

  if (!splash || !enterBtn) return;

  enterBtn.addEventListener("click", () => {
    // Play intro sound
    if (introSound) {
      introSound.currentTime = 0;
      introSound.play().catch(() => {});
    }

    // Small screen shake
    document.body.style.transition = "transform 0.1s";
    document.body.style.transform = "translateX(-5px)";
    setTimeout(() => {
      document.body.style.transform = "translateX(5px)";
    }, 50);
    setTimeout(() => {
      document.body.style.transform = "translateX(0)";
    }, 100);

    // Fade out splash
    splash.style.animation = "splashFadeOut 0.8s ease forwards";

    setTimeout(() => {
      splash.style.display = "none";
    }, 800);
  });
});
