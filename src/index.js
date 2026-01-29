/**************************************************
 * NAV MENU (Hamburger)
 **************************************************/
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

if (hamburger && navMenu) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  document.querySelectorAll(".nav-link").forEach((link) =>
    link.addEventListener("click", (e) => {
      if (e.currentTarget.id === "mixBut") return;
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    }),
  );
}

/**************************************************
 * WHACK-A-MOLE GAME LOGIC
 **************************************************/

/* ==========================
   ASSET HELPER (Works locally + GitHub Pages)
========================== */
const asset = (file) => new URL(`./assets/${file}`, document.baseURI).href;

/* ==========================
   DOM SELECTION
========================== */
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

/* ==========================
   RESULT MODAL DOM
========================== */
const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalScore = document.getElementById("modalScore");
const modalTarget = document.getElementById("modalTarget");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

/* ==========================
   COUNT-UP ANIMATION (Modal)
========================== */
function animateCountUp(el, toValue, duration = 900) {
  if (!el) return;

  const end = Number(toValue) || 0;
  const start = 0;

  if (el._countRaf) cancelAnimationFrame(el._countRaf);

  const startTime = performance.now();

  function tick(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

    const current = Math.round(start + (end - start) * eased);
    el.textContent = current.toLocaleString();

    if (t < 1) el._countRaf = requestAnimationFrame(tick);
  }

  el._countRaf = requestAnimationFrame(tick);
}

/* ==========================
   MODAL OPEN/CLOSE
========================== */
function openResultModal({title, message, score, target}) {
  if (!resultModal) return;

  modalTitle.textContent = title;
  modalMessage.textContent = message;

  // Animate score + target
  modalTarget.textContent = "0";
  modalScore.textContent = "0";
  animateCountUp(modalTarget, target, 500);
  animateCountUp(modalScore, score, 900);

  // Diamond callout
  const diamondCallout = document.getElementById("diamondCallout");
  if (diamondCallout) {
    if (diamondHits > 0) {
      diamondCallout.hidden = false;
      diamondCallout.textContent = `💎 Diamond Hit! (${diamondHits})`;
    } else {
      diamondCallout.hidden = true;
    }
  }

  resultModal.classList.add("show");
  resultModal.setAttribute("aria-hidden", "false");

  // Prevent last-second clicks from interacting with the grid
  grid?.style.setProperty("pointer-events", "none");
}

function closeResultModal() {
  if (!resultModal) return;

  resultModal.classList.remove("show");
  resultModal.setAttribute("aria-hidden", "true");

  // Re-enable game interaction
  grid?.style.removeProperty("pointer-events");
}

// Modal buttons ONLY (no click-outside-to-close)
playAgainBtn?.addEventListener("click", () => resetGameState());
closeModalBtn?.addEventListener("click", () => resetGameState());

/* ==========================
   HAMMER OVERLAY (visual only)
========================== */
if (grid && hammerEl) {
  grid.addEventListener("mouseenter", () => (hammerEl.style.display = "block"));
  grid.addEventListener("mouseleave", () => (hammerEl.style.display = "none"));
  grid.addEventListener("mousemove", (e) => {
    hammerEl.style.left = `${e.clientX}px`;
    hammerEl.style.top = `${e.clientY}px`;
  });
}

/* ==========================
   AUDIO (Using asset helper)
========================== */
const SONG_SRC = asset("song.mp3");
const HIT_SRC = asset("hit.mp3");
const VICTORY_SRC = asset("victory.mp3");
const APPLAUSE_SRC = asset("applause.mp3");
const DEFEAT_SRC = asset("defeat.mp3");

const audioSong = new Audio(SONG_SRC);
audioSong.loop = true;

/* ==========================
   MASTER SOUND CONTROL
========================== */
const mixBut = document.getElementById("mixBut");
let soundOn = true;

function playMusic(volume = 0.3) {
  if (!soundOn) return;
  audioSong.volume = volume;
  audioSong.play().catch(() => {});
}

function stopMusic() {
  audioSong.pause();
  audioSong.currentTime = 0;
}

function playSfx(src, volume = 1) {
  if (!soundOn) return;
  const sfx = new Audio(src);
  sfx.volume = volume;
  sfx.play().catch(() => {});
}

function stopAllSounds() {
  stopMusic();
}

if (mixBut) {
  mixBut.textContent = "Sound ⏸️";
  mixBut.addEventListener("click", (e) => {
    e.preventDefault();
    soundOn = !soundOn;

    if (!soundOn) {
      stopAllSounds();
      mixBut.textContent = "Sound ▶️";
    } else {
      mixBut.textContent = "Sound ⏸️";
      playMusic(0.3);
    }
  });
}

/* ==========================
   CONFETTI (WIN ONLY)
========================== */
let confettiIntervalId = null;
let confettiStopTimeoutId = null;

function startConfetti(durationMs = 4000) {
  const confettiFn = window.confetti;
  if (typeof confettiFn !== "function") return;

  stopConfetti();

  const endTime = Date.now() + durationMs;

  // Big initial burst
  confettiFn({
    particleCount: 120,
    spread: 90,
    startVelocity: 55,
    origin: {x: 0.5, y: 0.25},
  });

  confettiIntervalId = setInterval(() => {
    if (Date.now() >= endTime) {
      stopConfetti();
      return;
    }

    confettiFn({
      particleCount: 25,
      spread: 80,
      startVelocity: 45,
      origin: {x: 0.1, y: 0.2},
    });

    confettiFn({
      particleCount: 25,
      spread: 80,
      startVelocity: 45,
      origin: {x: 0.9, y: 0.2},
    });
  }, 250);

  confettiStopTimeoutId = setTimeout(stopConfetti, durationMs + 500);
}

function stopConfetti() {
  if (confettiIntervalId) {
    clearInterval(confettiIntervalId);
    confettiIntervalId = null;
  }
  if (confettiStopTimeoutId) {
    clearTimeout(confettiStopTimeoutId);
    confettiStopTimeoutId = null;
  }
}

/* ==========================
   GAME SETTINGS
========================== */
const GAME_SECONDS = 30;
const HIT_GRACE_MS = 350;

let difficulty = "normal";
let winScore = 450; // default for normal (updated below)

function getPopDelayMs() {
  if (difficulty === "easy") return 1100;
  if (difficulty === "normal") return 900;
  return Math.floor(Math.random() * (850 - 650 + 1)) + 650; // hard
}

function applyDifficultySettings(level) {
  difficulty = level;

  // Dropdown theme class (optional styling)
  if (difficultySelect) {
    difficultySelect.classList.remove("easy", "normal", "hard");
    difficultySelect.classList.add(difficulty);
  }

  // Win targets (balanced for golden/diamond)
  if (difficulty === "easy") winScore = 350;
  else if (difficulty === "normal") winScore = 450;
  else winScore = 500; // hard
}

/* ==========================
   GAME STATE
========================== */
let time = GAME_SECONDS;
let points = 0;

let gameRunning = false;
let gamePaused = false;

let timerId = null;
let moleTimeoutId = null;

let lastHoleIndex = -1;
let currentHoleIndex = -1;
let moleAlreadyWhacked = false;

let whackedUntil = 0;
let diamondHits = 0;

// timing windows for fair hit detection
let currentDownAt = 0;
let prevHoleIndex = -1;
let prevDownAt = 0;

/* ==========================
   UI HELPERS
========================== */
function updateScore(value) {
  points = value;
  if (scoreEl) scoreEl.textContent = points;
}

function updateTimer(value) {
  time = value;
  if (timerDisplay) timerDisplay.textContent = time;
}

/* ==========================
   HELPERS
========================== */
function chooseHoleIndex() {
  if (holes.length === 0) return -1;

  let index;
  do {
    index = Math.floor(Math.random() * holes.length);
  } while (holes.length > 1 && index === lastHoleIndex);

  lastHoleIndex = index;
  return index;
}

function clearTimers() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (moleTimeoutId) {
    clearTimeout(moleTimeoutId);
    moleTimeoutId = null;
  }
}

function resetMoleVisuals() {
  holes.forEach((hole) => hole.classList.remove("show"));

  moles.forEach((mole) => {
    mole.style.backgroundImage = `url("${asset("mole.png")}")`;
    mole.style.pointerEvents = "auto";
    mole.classList.remove("golden", "diamond");
  });

  moleAlreadyWhacked = false;
}

/* ==========================
   RESET GAME
========================== */
function resetGameState() {
  stopConfetti();
  closeResultModal();

  clearTimers();
  resetMoleVisuals();

  gameRunning = false;
  gamePaused = false;

  diamondHits = 0;
  updateScore(0);
  updateTimer(GAME_SECONDS);

  stopAllSounds();

  if (startButton) startButton.disabled = false;
  if (pauseButton) pauseButton.textContent = "Pause";
  if (difficultySelect) difficultySelect.disabled = false;
}

/* ==========================
   MOLE LOOP
========================== */
function showUp() {
  if (!gameRunning || gamePaused) return;

  if (Date.now() < whackedUntil) {
    moleTimeoutId = setTimeout(showUp, whackedUntil - Date.now());
    return;
  }

  // Save previous timing window BEFORE switching
  prevHoleIndex = currentHoleIndex;
  prevDownAt = currentDownAt;

  resetMoleVisuals();

  const index = chooseHoleIndex();
  if (index === -1) return;

  currentHoleIndex = index;
  holes[index].classList.add("show");

  // Assign special mole (diamond rarer than golden)
  moles[index].classList.remove("golden", "diamond");
  const roll = Math.random();
  if (roll < 0.04)
    moles[index].classList.add("diamond"); // 4%
  else if (roll < 0.14) moles[index].classList.add("golden"); // next 10%

  const delay = getPopDelayMs();
  currentDownAt = Date.now() + delay;

  moleTimeoutId = setTimeout(showUp, delay);
}

/* ==========================
   TIMER LOOP
========================== */
function startTimer() {
  timerId = setInterval(() => {
    if (!gameRunning || gamePaused) return;

    if (time > 0) updateTimer(time - 1);

    if (time === 0) {
      clearTimeout(moleTimeoutId);
      endGame();
    }
  }, 1000);
}

/* ==========================
   HIT DETECTION (FAIR)
========================== */
function isHoleHittable(index) {
  if (holes[index].classList.contains("show")) return true;

  if (index === currentHoleIndex && Date.now() <= currentDownAt + HIT_GRACE_MS)
    return true;

  if (index === prevHoleIndex && Date.now() <= prevDownAt + HIT_GRACE_MS)
    return true;

  return false;
}

/* ==========================
   BONUS FLOATING TEXT
========================== */
function showBonusText(holeEl, text, type) {
  if (!holeEl) return;

  const bonus = document.createElement("div");
  bonus.classList.add("bonus-text");

  if (type === "gold") bonus.classList.add("bonus-gold");
  if (type === "diamond") bonus.classList.add("bonus-diamond");

  bonus.textContent = text;
  holeEl.appendChild(bonus);

  setTimeout(() => bonus.remove(), 900);
}

/* ==========================
   WHACK
========================== */
function whack(index) {
  if (!gameRunning || gamePaused) return;
  if (!isHoleHittable(index)) return;
  if (moleAlreadyWhacked) return;

  moleAlreadyWhacked = true;

  const moleEl = moles[index];
  const holeEl = holes[index];

  const isGolden = moleEl.classList.contains("golden");
  const isDiamond = moleEl.classList.contains("diamond");

  let earnedPoints = 10;
  if (isDiamond) {
    earnedPoints = 100;
    diamondHits += 1;
  } else if (isGolden) {
    earnedPoints = 50;
  }

  updateScore(points + earnedPoints);

  // Sound
  playSfx(HIT_SRC, 1);

  // Hammer animation
  if (hammerEl) {
    hammerEl.classList.remove("smack");
    void hammerEl.offsetWidth;
    hammerEl.classList.add("smack");
  }

  // Floating bonus
  if (isDiamond) showBonusText(holeEl, "+100", "diamond");
  else if (isGolden) showBonusText(holeEl, "+50", "gold");

  // Whacked mole image (use asset helper!)
  moleEl.style.backgroundImage = `url("${asset("wmole.png")}")`;

  whackedUntil = Date.now() + 250;

  setTimeout(() => {
    holeEl.classList.remove("show");
    moleEl.classList.remove("golden", "diamond");
  }, 250);
}

/* ==========================
   HITBOX LISTENERS
========================== */
holes.forEach((hole, index) => {
  hole.addEventListener("pointerdown", () => whack(index));
});

/* ==========================
   START / PAUSE / STOP / END
========================== */
function startGame() {
  clearTimers();
  resetMoleVisuals();

  gameRunning = true;
  gamePaused = false;

  diamondHits = 0;
  updateScore(0);
  updateTimer(GAME_SECONDS);

  currentHoleIndex = -1;
  whackedUntil = 0;

  stopConfetti();

  if (difficultySelect) difficultySelect.disabled = true;
  if (startButton) startButton.disabled = true;
  if (pauseButton) pauseButton.textContent = "Pause";

  playMusic(0.3);

  showUp();
  startTimer();
}

function pauseGame() {
  if (!gameRunning) return;

  if (!gamePaused) {
    gamePaused = true;
    if (pauseButton) pauseButton.textContent = "Resume";
    audioSong.pause();
    resetMoleVisuals();
  } else {
    gamePaused = false;
    if (pauseButton) pauseButton.textContent = "Pause";
    playMusic(0.3);
    showUp();
  }
}

function stopGame() {
  resetGameState();
}

function endGame() {
  if (!gameRunning) return;

  clearTimers();
  resetMoleVisuals();

  gameRunning = false;
  gamePaused = false;

  audioSong.pause();

  if (startButton) startButton.disabled = false;
  if (pauseButton) pauseButton.textContent = "Pause";
  if (difficultySelect) difficultySelect.disabled = false;

  if (points >= winScore) {
    startConfetti(4000);
    playSfx(VICTORY_SRC, 1);
    setTimeout(() => playSfx(APPLAUSE_SRC, 1), 300);

    openResultModal({
      title: "🎉 You Win!",
      message: "Congratulations! You crushed it.",
      score: points,
      target: winScore,
    });
  } else {
    playSfx(DEFEAT_SRC, 1);

    openResultModal({
      title: "😞 You Lose",
      message: "So close — try again!",
      score: points,
      target: winScore,
    });
  }
}

/* ==========================
   INITIAL UI + LISTENERS
========================== */
closeResultModal();

applyDifficultySettings(difficultySelect?.value || "normal");

updateTimer(GAME_SECONDS);
updateScore(0);

difficultySelect?.addEventListener("change", (e) => {
  applyDifficultySettings(e.target.value);
});

startButton?.addEventListener("click", startGame);
pauseButton?.addEventListener("click", pauseGame);
stopButton?.addEventListener("click", stopGame);
