/**************************************************
 * NAVIGATION & ASSET HELPERS
 **************************************************/
const asset = (file) => new URL(`./assets/${file}`, document.baseURI).href;

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

/* RESULT MODAL DOM */
const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalScore = document.getElementById("modalScore");
const modalTarget = document.getElementById("modalTarget");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// Prevent iOS scrolling
if (grid) {
  grid.addEventListener("touchmove", (e) => e.preventDefault(), {
    passive: false,
  });
}

/**************************************************
 * HAMMER LOGIC (VISIBILITY & MOVEMENT)
 **************************************************/
if (hammerEl && grid) {
  // Ensure the hammer is correctly styled for movement
  hammerEl.style.position = "fixed";
  hammerEl.style.pointerEvents = "none";
  hammerEl.style.zIndex = "10000"; // Keep it above everything

  grid.addEventListener("mouseenter", () => {
    hammerEl.style.display = "block";
  });
  grid.addEventListener("mouseleave", () => {
    hammerEl.style.display = "none";
  });

  window.addEventListener("mousemove", (e) => {
    hammerEl.style.left = `${e.clientX}px`;
    hammerEl.style.top = `${e.clientY}px`;
  });
}

/**************************************************
 * AUDIO SYSTEM
 **************************************************/
const audioSong = new Audio(asset("song.mp3"));
audioSong.loop = true;
const HIT_SRC = asset("hit.mp3");
const VICTORY_SRC = asset("victory.mp3");
const APPLAUSE_SRC = asset("applause.mp3");
const DEFEAT_SRC = asset("defeat.mp3");

const mixBut = document.getElementById("mixBut");
let soundOn = true;

if (mixBut) {
  mixBut.innerHTML = `<img src="./assets/sound.png" alt="Sound On" class="nav-icon">`;
  mixBut.addEventListener("click", (e) => {
    e.preventDefault();
    soundOn = !soundOn;
    if (!soundOn) {
      audioSong.pause();
      mixBut.innerHTML = `<img src="./assets/sound-on.png" alt="Sound Off" class="nav-icon">`;
    } else {
      mixBut.innerHTML = `<img src="./assets/sound.png" alt="Sound On" class="nav-icon">`;
      if (gameRunning && !gamePaused) audioSong.play().catch(() => {});
    }
  });
}

function playSfx(src) {
  if (!soundOn) return;
  const sfx = new Audio(src);
  sfx.play().catch(() => {});
}

/**************************************************
 * GAME STATE & SETTINGS
 **************************************************/
let time = 30;
let points = 0;
let gameRunning = false;
let gamePaused = false;
let timerId = null;
let moleTimeoutId = null;
let lastHoleIndex = -1;
let currentHoleIndex = -1;
let diamondHits = 0;
let whackedUntil = 0;
let moleAlreadyWhacked = false;

let currentDownAt = 0;
let prevHoleIndex = -1;
let prevDownAt = 0;
const HIT_GRACE_MS = 350;

function updateScore(val) {
  points = val;
  if (scoreEl) scoreEl.textContent = points;
}
function updateTimer(val) {
  time = val;
  if (timerDisplay) timerDisplay.textContent = time;
}

/**************************************************
 * MOLE LOOP & VISUALS
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
    m.style.backgroundImage = `url("${asset("mole.png")}")`;
    m.classList.remove("golden", "diamond");
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
 * WHACKING LOGIC
 **************************************************/
function whack(index) {
  // ADD THIS LINE AT THE VERY TOP OF THE WHACK FUNCTION
  if (dList && dList.classList.contains("show")) return;

  if (!gameRunning) return;
  // ... the rest of your whack logic (score++, playSfx, etc.)
  if (!gameRunning || gamePaused || moleAlreadyWhacked) return;

  // Hit detection logic
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

  let earned = isDiamond ? 100 : isGolden ? 50 : 10;
  if (isDiamond) diamondHits++;

  updateScore(points + earned);
  playSfx(HIT_SRC);

  // Trigger Hammer Animation
  if (hammerEl) {
    hammerEl.classList.remove("smack");
    void hammerEl.offsetWidth; // Force reflow
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

/**************************************************
 * GAME CONTROLS
 **************************************************/
function startGame() {
  if (gameRunning && !gamePaused) return;

  if (!gamePaused) {
    updateScore(0);
    updateTimer(30);
    diamondHits = 0;
  }

  gameRunning = true;
  gamePaused = false;
  document.documentElement.classList.add("hide-cursor");
  difficultySelect.disabled = true;
  startButton.disabled = true;
  pauseButton.innerHTML = `<img src="./assets/pause.png" alt="Pause">`;

  if (soundOn) audioSong.play().catch(() => {});

  // Clear any existing timers before starting
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

  // Toggle button image
  pauseButton.innerHTML = `<img src="./assets/${gamePaused ? "resume.png" : "pause.png"}" alt="${gamePaused ? "Resume" : "Pause"}">`;

  if (gamePaused) {
    audioSong.pause();

    // STOP mole loop while paused
    clearTimeout(moleTimeoutId);
  } else {
    if (soundOn) audioSong.play().catch(() => {});
    showUp(); // restart mole loop
  }
}

function endGame() {
  document.documentElement.classList.remove("hide-cursor");

  gameRunning = false;
  gamePaused = false;

  clearInterval(timerId);
  clearTimeout(moleTimeoutId);

  audioSong.pause();
  difficultySelect.disabled = false;
  startButton.disabled = false;

  pauseButton.innerHTML = `<img src="./assets/pause.png" alt="Pause">`;

  const targetScore = difficultySelect.value === "easy" ? 350 : 450;

  const win = points >= targetScore;

  playSfx(win ? VICTORY_SRC : DEFEAT_SRC);

  // 🔥 LIGHTEN SCREEN IF WIN
  const overlay = document.querySelector(".modal-overlay");

  if (win) {
    overlay?.classList.add("win");

    // Slight screen brightness boost
    document.body.style.filter = "brightness(1.08)";

    // 🔥 BIG DRAMATIC CONFETTI
    startConfetti(3000);
  } else {
    overlay?.classList.remove("win");
    document.body.style.filter = "brightness(1)";
  }

  openResultModal({
    title: win ? "🎉 You Win!" : "😞 You Lose",
    message: win ? "You're a Pro!" : "Keep Practicing!",
    score: points,
    target: targetScore,
  });
}

function resetGameState() {
  document.body.classList.remove("hide-cursor");
  gameRunning = false;
  gamePaused = false;
  document.body.style.filter = "brightness(1)";
  document.querySelector(".modal-overlay")?.classList.remove("win");

  clearInterval(timerId);
  clearTimeout(moleTimeoutId);

  updateScore(0);
  updateTimer(30);
  resetMoleVisuals();

  difficultySelect.disabled = false;
  startButton.disabled = false;

  pauseButton.innerHTML = `<img src="./assets/pause.png" alt="Pause">`;

  audioSong.pause();
  audioSong.currentTime = 0;
}

/**************************************************
 * MODAL LOGIC
 **************************************************/
function openResultModal({title, message, score, target}) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalScore.textContent = score;
  modalTarget.textContent = target;

  const diamondCallout = document.getElementById("diamondCallout");
  if (diamondCallout) {
    diamondCallout.hidden = diamondHits === 0;
    diamondCallout.textContent = `💎 Diamond Hit! (${diamondHits})`;
  }

  resultModal.classList.add("show");
  grid.style.setProperty("pointer-events", "none");
}

playAgainBtn.onclick = () => {
  resultModal.classList.remove("show");
  startGame();
};
closeModalBtn.onclick = () => {
  resultModal.classList.remove("show");
  resetGameState();
};

/* EVENT LISTENERS */
startButton?.addEventListener("click", startGame);
pauseButton?.addEventListener("click", pauseGame);
stopButton?.addEventListener("click", resetGameState);
playAgainBtn?.addEventListener("click", resetGameState);
closeModalBtn?.addEventListener("click", resetGameState);
difficultySelect?.addEventListener("change", (e) =>
  applyDifficultySettings(e.target.value),
);

if (grid && hammerEl) {
  grid.addEventListener("mouseenter", () => (hammerEl.style.display = "block"));
  grid.addEventListener("mouseleave", () => (hammerEl.style.display = "none"));
  grid.addEventListener("mousemove", (e) => {
    hammerEl.style.left = `${e.clientX}px`;
    hammerEl.style.top = `${e.clientY}px`;
  });
}

/* CONFETTI (Unchanged from original) */
function startConfetti(durationMs) {
  const confettiFn = window.confetti;
  if (typeof confettiFn !== "function") return;

  const endTime = Date.now() + durationMs;

  // 💥 MASSIVE CENTER EXPLOSION
  confettiFn({
    particleCount: 500,
    spread: 180,
    startVelocity: 70,
    decay: 0.9,
    gravity: 0.7,
    drift: 0,
    scalar: 2.2,
    ticks: 500,
    origin: {x: 0.5, y: 0.45},
    colors: ["#FFD700", "#FF3366", "#00CCFF", "#FFFFFF", "#FF8800"],
    zIndex: 20000,
  });

  // 🔥 SIDE CANNONS
  confettiIntervalId = setInterval(() => {
    if (Date.now() >= endTime) return stopConfetti();

    confettiFn({
      particleCount: 60,
      angle: 60,
      spread: 80,
      startVelocity: 65,
      scalar: 1.8,
      gravity: 0.8,
      origin: {x: 0, y: 0.7},
      zIndex: 20000,
    });

    confettiFn({
      particleCount: 60,
      angle: 120,
      spread: 80,
      startVelocity: 65,
      scalar: 1.8,
      gravity: 0.8,
      origin: {x: 1, y: 0.7},
      zIndex: 20000,
    });
  }, 180);
}

function stopConfetti() {
  clearInterval(confettiIntervalId);
}

/**************************************************
 * CUSTOM WOODEN DROPDOWN LOGIC (FINAL VERSION)
 **************************************************/
const dTrigger = document.getElementById("difficulty-trigger");
const dList = document.getElementById("difficulty-list");

// 1. MAP the levels to their images
const difficultyImages = {
  easy: "./assets/easy.png",
  normal: "./assets/selector.png",
  hard: "./assets/hard.png",
};

// 2. SAFETY: Update your existing whack function to ignore clicks when menu is open
const originalWhack = window.whack; // Save original if needed
window.whack = function (i) {
  // If the wooden menu is open, STOP the whack (no sound, no score)
  if (dList && dList.classList.contains("show")) return;

  // Otherwise, proceed with the normal game whack logic
  if (typeof originalWhack === "function") originalWhack(i);
};

function applyDifficultySettings(level) {
  console.log("Game settings updated to:", level);

  // SWAP THE IMAGE: Change the main plate to show the selection
  const triggerImg = document.querySelector("#difficulty-trigger img");
  if (triggerImg && difficultyImages[level]) {
    triggerImg.src = difficultyImages[level];
  }

  // Update target score for game logic
  const targetScore = level === "easy" ? 350 : 450;
}

window.setDifficulty = function (level, event) {
  // 3. STOP PROPAGATION: This prevents the 'whack' sound from bleeding through
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (difficultySelect) {
    difficultySelect.value = level;
    difficultySelect.dispatchEvent(new Event("change"));

    applyDifficultySettings(level);

    // Close the wooden menu
    if (dList) dList.classList.remove("show");

    // We do NOT call playSfx(HIT_SRC) here to keep it silent
    console.log("Confirmed: Difficulty is now " + level);
  }
};

// Toggle menu logic
if (dTrigger && dList) {
  dTrigger.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!gameRunning) {
      dList.classList.toggle("show");
    }
  });
}

// Close if clicking outside
window.addEventListener("click", function () {
  if (dList) dList.classList.remove("show");
});

// Initial Setup
applyDifficultySettings(difficultySelect?.value || "normal");

// 1. Target the exit button specifically
// (Make sure your HTML has id="exitBut" on that button)
const exitButton = document.getElementById("exitBut");

if (exitButton) {
  exitButton.addEventListener("click", function (event) {
    // Prevent any weird browser behavior
    event.preventDefault();

    console.log("Exit button clicked. Redirecting...");

    // 2. Safety: Stop the game loop if it's running
    if (typeof gameRunning !== "undefined") gameRunning = false;
    if (typeof timerId !== "undefined") clearInterval(timerId);

    // 3. THE REDIRECT: Change this filename to your landing page
    // (e.g., "index.html", "home.html", or "https://google.com")
    window.location.href = "index.html";
  });
}
