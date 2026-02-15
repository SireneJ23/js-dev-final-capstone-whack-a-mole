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
  difficultySelect.disabled = true;
  startButton.disabled = true;
  pauseButton.innerHTML = `<img src="./assets/pause.png" alt="Pause">`;

  if (soundOn) audioSong.play().catch(() => {});

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
  pauseButton.innerHTML = `<img src="./assets/${gamePaused ? "resume.png" : "pause.png"}" alt="Control">`;
  if (gamePaused) {
    audioSong.pause();
    resetMoleVisuals();
  } else {
    if (soundOn) audioSong.play().catch(() => {});
    showUp();
  }
}

function endGame() {
  gameRunning = false;
  clearInterval(timerId);
  clearTimeout(moleTimeoutId);
  audioSong.pause();
  difficultySelect.disabled = false;
  startButton.disabled = false;
  pauseButton.innerHTML = `<img src="./assets/pause.png" alt="Pause">`;

  const win = points >= (difficultySelect.value === "easy" ? 350 : 450);
  playSfx(win ? VICTORY_SRC : DEFEAT_SRC);

  openResultModal({
    title: win ? "🎉 You Win!" : "😞 You Lose",
    message: win ? "You're a Pro!" : "Keep Practicing!",
    score: points,
    target: difficultySelect.value === "easy" ? 350 : 450,
  });
}

function resetGameState() {
  gameRunning = false;
  gamePaused = false;
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
}

playAgainBtn.onclick = () => {
  resultModal.classList.remove("show");
  startGame();
};
closeModalBtn.onclick = () => {
  resultModal.classList.remove("show");
  resetGameState();
};

startButton.onclick = startGame;
pauseButton.onclick = pauseGame;
stopButton.onclick = resetGameState;
