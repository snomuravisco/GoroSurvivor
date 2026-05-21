const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  time: document.querySelector("#time"),
  level: document.querySelector("#level"),
  kills: document.querySelector("#kills"),
  coins: document.querySelector("#coins"),
  xpText: document.querySelector("#xpText"),
  hpBar: document.querySelector("#hpBar"),
  hpText: document.querySelector("#hpText"),
  shieldBar: document.querySelector("#shieldBar"),
  shieldText: document.querySelector("#shieldText"),
  shieldRow: document.querySelector(".shield-row"),
  pickupBar: document.querySelector("#pickupBar"),
  pickupText: document.querySelector("#pickupText"),
  startPanel: document.querySelector("#startPanel"),
  startButton: document.querySelector("#startButton"),
  manualButton: document.querySelector("#manualButton"),
  openingPanel: document.querySelector("#openingPanel"),
  openingStage: document.querySelector("#openingStage"),
  openingImage: document.querySelector("#openingImage"),
  openingText: document.querySelector("#openingText"),
  openingCaption: document.querySelector("#openingCaption"),
  manualGuide: document.querySelector("#manualGuide"),
  openingReturnButton: document.querySelector("#openingReturnButton"),
  upgradePanel: document.querySelector("#upgradePanel"),
  upgradeChoices: document.querySelector("#upgradeChoices"),
  vendingPanel: document.querySelector("#vendingPanel"),
  vendingBuyButton: document.querySelector("#vendingBuyButton"),
  vendingCancelButton: document.querySelector("#vendingCancelButton"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultImage: document.querySelector("#resultImage"),
  resultText: document.querySelector("#resultText"),
  restartButton: document.querySelector("#restartButton"),
  startTransition: document.querySelector("#startTransition"),
};

const sprite = new Image();
sprite.src = "assets/goro-spritesheet.webp";
const zombieSprite = new Image();
const runnerZombieSprite = new Image();
const bruteZombieSprite = new Image();
const zombieDogSprite = new Image();
const backgroundImage = new Image();
backgroundImage.src = "assets/background-park.png";
const stage2BackgroundImage = new Image();
stage2BackgroundImage.src = "assets/stage2-subway.png";
const bisukoCageImage = new Image();
bisukoCageImage.src = "assets/bisuko-cage.png";
const bisukoRunImage = new Image();
bisukoRunImage.src = "assets/bisuko-run.png";
const vendingMachineImage = new Image();
vendingMachineImage.src = "assets/vending-sake.png";
const phonePickupImage = new Image();
phonePickupImage.src = "assets/phone-pickup.png";
const nomurarchImage = new Image();
nomurarchImage.src = "assets/nomurarch.png";
zombieDogSprite.src = "assets/zombie-dog.png";
let zombieTrim = null;
let zombieTrimTried = false;
let runnerZombieTrim = null;
let runnerZombieTrimTried = false;
let bruteZombieTrim = null;
let bruteZombieTrimTried = false;
let zombieDogTrim = null;
let zombieDogTrimTried = false;
let bisukoCageTrim = null;
let bisukoCageTrimTried = false;
let bisukoRunTrim = null;
let bisukoRunTrimTried = false;
let nomurarchTrim = null;
let nomurarchTrimTried = false;

const GORO_COLS = 8;
const GORO_ROWS = 9;
const SPRITE_ROWS = {
  idle: { row: 0, frames: 6 },
  right: { row: 1, frames: 8 },
  left: { row: 2, frames: 8 },
  jump: { row: 4, frames: 5 },
  failed: { row: 5, frames: 8 },
  run: { row: 7, frames: 6 },
};
let goroFrames = null;

const keys = new Set();
const world = { w: 3200, h: 1800 };
const camera = { x: 0, y: 0 };
const STAGE2_IMAGE_SIZE = { w: 1680, h: 940 };
const ZOMBIE_DOG_MAX = 15;

function stage2Point(x, y) {
  return { x: (x / STAGE2_IMAGE_SIZE.w) * world.w, y: (y / STAGE2_IMAGE_SIZE.h) * world.h };
}

const stage2NoGoPolygons = [
  [stage2Point(0, 0), stage2Point(195, 18), stage2Point(156, 165), stage2Point(56, 594), stage2Point(0, 600)],
  [stage2Point(0, 600), stage2Point(58, 500), stage2Point(178, 365), stage2Point(92, 750), stage2Point(0, 750)],
  [
    stage2Point(326, 18),
    stage2Point(1680, 0),
    stage2Point(1680, 98),
    stage2Point(1440, 300),
    stage2Point(1045, 280),
    stage2Point(515, 160),
    stage2Point(326, 160),
  ],
  [
    stage2Point(1450, 300),
    stage2Point(1680, 96),
    stage2Point(1680, 940),
    stage2Point(1386, 905),
    stage2Point(1430, 655),
    stage2Point(1486, 520),
  ],
];

const upgrades = [
  {
    name: "巡回ドローン",
    desc: "周囲を回る防衛ドローンを1機増やす",
    icon: "assets/upgrade-icon-drone.png",
    apply: (p) => {
      p.orbs += 1;
    },
  },
  {
    name: "数弾増加",
    desc: "自動射撃の弾数が1発増える",
    icon: "assets/upgrade-icon-bullets.png",
    apply: (p) => {
      p.shotCount += 1;
    },
  },
  {
    name: "健脚",
    desc: "移動速度が12%上がる",
    icon: "assets/upgrade-icon-speed.png",
    apply: (p) => {
      p.speed *= 1.12;
    },
  },
  {
    name: "深呼吸",
    desc: "最大体力が18増え、少し回復する",
    icon: "assets/upgrade-icon-health.png",
    apply: (p) => {
      p.maxHp += 18;
      p.hp = Math.min(p.maxHp, p.hp + 26);
    },
  },
  {
    name: "眼鏡ロックオン",
    desc: "射撃間隔が短くなる",
    icon: "assets/upgrade-icon-target.png",
    apply: (p) => {
      p.fireRate = Math.max(0.18, p.fireRate * 0.84);
    },
  },
  {
    name: "小銭センサー",
    desc: "経験値とコインを拾う範囲が広がる",
    icon: "assets/upgrade-icon-coin.png",
    apply: (p) => {
      p.pickup *= 1.25;
    },
  },
];

let state;
let last = performance.now();
let openingTimers = [];
let openingPage = 0;
let stage2Page = 0;
let endingPage = 0;
let pendingVendingMachine = null;

const openingScenes = [
  {
    image: "assets/opening-1.png",
    caption: "今日も疲れたな～",
  },
  {
    image: "assets/opening-2.png",
    caption: "ん？野良犬か？",
  },
  {
    image: "assets/opening-3.png",
    caption: "しみる！しみるわ～！！",
    shake: true,
  },
];

const stage2Scenes = [
  { image: "assets/stage2-0.png", caption: "電話だ！" },
  { image: "assets/stage2-1.png", caption: "助けに来たぜ" },
  { image: "assets/stage2-2.png", caption: "キリがないな…場所を変えるぞ！" },
  { image: "assets/stage2-3.png", caption: "あっちだ！" },
];

const endingScenes = [
  { image: "assets/stage2-ending-0.png", caption: "乗り込め！！" },
  { image: "assets/stage2-ending-1.png", caption: "助かったな…" },
  { image: "assets/stage2-ending-2.png", caption: "生き延びた夜に、乾杯。" },
];

function resetGame() {
  state = {
    mode: "ready",
    time: 0,
    spawnTimer: 0,
    eliteTimer: 18,
    ambientTimer: 10,
    ambient: null,
    callout: null,
    shake: 0,
    messageTimer: 0,
    stage: 1,
    stage2Started: false,
    stage2StartedAt: null,
    stage2SpawnIndex: 0,
    dogSpawnTimer: 9,
    dogPackAtCapacity: false,
    trainReady: false,
    endingStarted: false,
    phone: {
      active: false,
      collected: false,
      x: world.w / 2,
      y: world.h / 2,
      r: 62,
      fall: 0,
    },
    player: {
      x: world.w / 2,
      y: world.h / 2,
      r: 30,
      hp: 100,
      maxHp: 100,
      shield: 0,
      maxShield: 0,
      xp: 0,
      nextXp: 14,
      level: 1,
      coins: 0,
      kills: 0,
      speed: 270,
      fireRate: 0.72,
      fireTimer: 0,
      shotCount: 1,
      damage: 22,
      pickup: 105,
      basePickup: 105,
      maxPickupView: 260,
      orbs: 1,
      dash: 1,
      invuln: 0,
      hitReact: 0,
      face: "right",
      moving: false,
    },
    bullets: [],
    enemies: [],
    drops: [],
    particles: [],
    popups: [],
    vendingMachines: [
      { x: 190, y: world.h / 2, r: 118, cooldown: 0, notice: 0 },
      { x: world.w - 190, y: world.h / 2, r: 118, cooldown: 0, notice: 0 },
    ],
    rescue: {
      x: 0,
      y: 0,
      r: 116,
      progress: 0,
      needed: 3,
      active: false,
      rescued: false,
      spawnedCount: 0,
      rescuedCount: 0,
      firstSpawnAt: 90 + rand(-8, 8),
      lowHealthSpawned: false,
      pulse: 0,
      escape: null,
    },
  };
  updateUi();
}

function startGame() {
  resetGame();
  state.mode = "playing";
  document.querySelector(".game-frame").classList.remove("is-title");
  ui.startPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
}

function startStage2TestMode() {
  resetGame();
  state.time = 180;
  state.phone.collected = true;
  enterStage2Area();
  state.mode = "playing";
  document.querySelector(".game-frame").classList.remove("is-title");
  ui.startPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  ui.openingPanel.classList.add("hidden");
}

function playStartTransition(event) {
  if (event?.shiftKey) {
    startStage2TestMode();
    return;
  }
  ui.startButton.disabled = true;
  ui.manualButton.disabled = true;
  ui.startTransition.className = "start-transition flash-start";
  window.setTimeout(() => {
    startGame();
    ui.startTransition.className = "start-transition fade-out";
  }, 1050);
  window.setTimeout(() => {
    ui.startTransition.classList.add("hidden");
    ui.startTransition.className = "start-transition hidden";
    ui.startButton.disabled = false;
    ui.manualButton.disabled = false;
  }, 1550);
}

function clearOpeningTimers() {
  for (const timer of openingTimers) {
    window.clearTimeout(timer);
  }
  openingTimers = [];
}

function queueOpeningStep(delay, action) {
  openingTimers.push(window.setTimeout(action, delay));
}

function resetOpeningCaption() {
  ui.openingCaption.textContent = "";
  ui.openingCaption.className = "opening-caption";
}

function fitOpeningText() {
  if (ui.openingText.classList.contains("hidden")) return;
  const maxSize = 34;
  const minSize = 13;
  ui.openingText.style.fontSize = `${maxSize}px`;
  for (let size = maxSize; size >= minSize; size -= 1) {
    ui.openingText.style.fontSize = `${size}px`;
    if (ui.openingText.scrollWidth <= ui.openingStage.clientWidth - 48) break;
  }
}

function showOpeningPrologue() {
  ui.openingPanel.className = "opening-panel";
  ui.openingStage.className = "opening-stage";
  ui.openingImage.className = "opening-image";
  ui.openingImage.removeAttribute("src");
  ui.openingText.innerHTML = "ある日の仕事終わり。<br />吾郎はコンビニでお酒を買い、公園で飲んで帰ることにした…。";
  ui.openingText.classList.remove("hidden");
  ui.manualGuide.classList.add("hidden");
  window.requestAnimationFrame(fitOpeningText);
  resetOpeningCaption();
  ui.openingReturnButton.classList.add("hidden");
}

function showOpeningScene(scene) {
  ui.openingPanel.className = "opening-panel";
  ui.openingStage.className = scene.shake ? "opening-stage is-shaking" : "opening-stage";
  if (scene.shake) {
    queueOpeningStep(500, () => {
      ui.openingStage.classList.remove("is-shaking");
    });
  }
  ui.openingText.classList.add("hidden");
  ui.manualGuide.classList.add("hidden");
  resetOpeningCaption();
  ui.openingImage.className = "opening-image";
  ui.openingImage.src = scene.image;
  ui.openingImage.alt = scene.caption;
  window.requestAnimationFrame(() => {
    ui.openingImage.classList.add("is-visible");
  });
  queueOpeningStep(1100, () => {
    ui.openingCaption.textContent = scene.caption;
    showOpeningCaption();
  });
}

function showOpeningCaption() {
  ui.openingCaption.classList.add("is-visible");
}

function showOpeningReturn() {
  ui.openingReturnButton.classList.remove("hidden");
}

function setupManualGuideScene() {
  resetGame();
  state.mode = "opening";
  state.time = 9;
  state.player.x = world.w / 2;
  state.player.y = world.h / 2;
  state.player.kills = 4;
  state.player.coins = 4;
  state.player.xp = 0;
  state.player.nextXp = 14;
  state.player.dash = 1;
  state.enemies = [
    {
      x: state.player.x + 430,
      y: state.player.y + 130,
      maxHp: 35,
      hp: 22,
      speed: 74,
      damage: 10,
      r: 24,
      xp: 3,
      type: "walker",
      hit: 0,
    },
  ];
  state.bullets = [
    { x: state.player.x + 250, y: state.player.y + 70, vx: 0, vy: 0, r: 6, life: 1, maxLife: 1, damage: 22 },
    { x: state.player.x + 360, y: state.player.y - 40, vx: 0, vy: 0, r: 6, life: 1, maxLife: 1, damage: 22 },
  ];
  state.drops = [
    { x: state.player.x - 520, y: state.player.y + 300, baseX: state.player.x - 520, baseY: state.player.y + 300, r: 11, xp: 3, coin: 0, bob: 0, alpha: 0.64, hue: "#8ee8ff" },
    { x: state.player.x - 490, y: state.player.y + 292, baseX: state.player.x - 490, baseY: state.player.y + 292, r: 11, xp: 3, coin: 0, bob: 1.5, alpha: 0.58, hue: "#b8fff0" },
    { x: state.player.x - 455, y: state.player.y + 305, baseX: state.player.x - 455, baseY: state.player.y + 305, r: 12, xp: 0, coin: 1, bob: 2.4, alpha: 0.9, hue: "#f7c84d" },
  ];
  updateUi();
}

function showManualGuide() {
  clearOpeningTimers();
  setupManualGuideScene();
  document.querySelector(".game-frame").classList.remove("is-title");
  ui.openingPanel.className = "opening-panel is-guide";
  ui.openingStage.className = "opening-stage guide-stage";
  ui.openingImage.className = "opening-image";
  ui.openingImage.removeAttribute("src");
  ui.openingText.classList.add("hidden");
  resetOpeningCaption();
  ui.manualGuide.classList.remove("hidden");
  showOpeningReturn();
  openingPage = openingScenes.length + 1;
}

function advanceOpeningPage() {
  if (state.mode !== "opening") return;
  clearOpeningTimers();
  if (openingPage < openingScenes.length) {
    showOpeningScene(openingScenes[openingPage]);
    openingPage += 1;
    return;
  }
  if (openingPage === openingScenes.length) {
    showManualGuide();
  }
}

function clearStageBeforeStage2() {
  state.enemies = [];
  state.drops = [];
  state.bullets = [];
  state.particles = [];
  state.popups = [];
  state.vendingMachines = [];
  state.ambient = null;
  state.rescue.active = false;
  state.rescue.escape = null;
  state.rescue.progress = 0;
}

function enterStage2Area() {
  const p = state.player;
  p.x = world.w / 2;
  p.y = world.h - 210;
  p.moving = false;
  p.face = "right";
  clearStageBeforeStage2();
  state.stage = 2;
  state.stage2Started = true;
  state.stage2StartedAt = state.time;
  state.stage2SpawnIndex = 0;
  state.spawnTimer = 0.16;
  state.eliteTimer = 6;
  state.dogSpawnTimer = 8;
  state.callout = { text: "～大門駅構内～", life: 3.2, maxLife: 3.2 };
  for (let i = 0; i < 10; i += 1) spawnZombieDog();
}

function startStage2Cutscene() {
  clearOpeningTimers();
  state.mode = "stage2Cutscene";
  state.shake = 0;
  state.callout = null;
  clearStageBeforeStage2();
  stage2Page = 0;
  pendingVendingMachine = null;
  document.querySelector(".game-frame").classList.remove("is-title");
  ui.startPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  ui.openingReturnButton.classList.add("hidden");
  ui.openingPanel.classList.remove("hidden");
  showOpeningScene(stage2Scenes[stage2Page]);
  stage2Page += 1;
}

function advanceStage2Cutscene() {
  if (state.mode !== "stage2Cutscene") return;
  clearOpeningTimers();
  if (stage2Page < stage2Scenes.length) {
    showOpeningScene(stage2Scenes[stage2Page]);
    stage2Page += 1;
    return;
  }
  finishStage2Cutscene();
}

function finishStage2Cutscene() {
  clearOpeningTimers();
  enterStage2Area();
  state.mode = "playing";
  ui.openingPanel.classList.add("hidden");
  ui.openingImage.className = "opening-image";
  resetOpeningCaption();
}

function startEndingCutscene() {
  clearOpeningTimers();
  clearStageBeforeStage2();
  state.mode = "endingCutscene";
  state.shake = 0;
  state.endingStarted = true;
  state.callout = null;
  endingPage = 0;
  ui.startPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  ui.openingReturnButton.classList.add("hidden");
  ui.openingPanel.classList.remove("hidden");
  showOpeningScene(endingScenes[endingPage]);
  endingPage += 1;
}

function advanceEndingCutscene() {
  if (state.mode !== "endingCutscene") return;
  clearOpeningTimers();
  if (endingPage < endingScenes.length) {
    showOpeningScene(endingScenes[endingPage]);
    endingPage += 1;
    return;
  }
  showEndingFinal();
}

function showEndingFinal() {
  clearOpeningTimers();
  state.mode = "endingFinal";
  ui.openingPanel.className = "opening-panel is-ending-final";
  ui.openingStage.className = "opening-stage ending-final-stage";
  ui.openingText.textContent = "おわり";
  ui.openingText.classList.remove("hidden");
  ui.manualGuide.classList.add("hidden");
  resetOpeningCaption();
  ui.openingReturnButton.classList.add("hidden");
}

function handleOpeningPanelClick() {
  if (state.mode === "endingFinal") {
    showTitle();
    return;
  }
  if (state.mode === "endingCutscene") {
    advanceEndingCutscene();
    return;
  }
  if (state.mode === "stage2Cutscene") {
    advanceStage2Cutscene();
    return;
  }
  advanceOpeningPage();
}

function startOpening() {
  clearOpeningTimers();
  resetGame();
  state.mode = "opening";
  openingPage = 0;
  document.querySelector(".game-frame").classList.add("is-title");
  ui.startPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  ui.openingPanel.classList.remove("hidden");
  showOpeningPrologue();
}

function showTitle() {
  clearOpeningTimers();
  resetGame();
  state.mode = "ready";
  document.querySelector(".game-frame").classList.add("is-title");
  ui.startPanel.classList.remove("hidden");
  ui.openingPanel.classList.add("hidden");
  ui.manualGuide.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.resultPanel.classList.remove("is-gameover", "is-clear");
  ui.resultImage.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  pendingVendingMachine = null;
  ui.startButton.disabled = false;
  ui.manualButton.disabled = false;
}

function pauseGame() {
  if (state.mode === "playing") {
    state.mode = "paused";
    ui.resultTitle.textContent = "一時停止";
    ui.resultText.textContent = "Pキーで再開できます。";
    ui.resultPanel.classList.remove("hidden");
  } else if (state.mode === "paused") {
    state.mode = "playing";
    ui.resultPanel.classList.add("hidden");
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    if ((pi.y > point.y) !== (pj.y > point.y) && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x) {
      inside = !inside;
    }
  }
  return inside;
}

function isStage2Blocked(x, y, radius = 0) {
  if (state.stage < 2) return false;
  const samples = [
    { x, y },
    { x: x - radius, y },
    { x: x + radius, y },
    { x, y: y - radius },
    { x, y: y + radius },
    { x: x - radius * 0.7, y: y - radius * 0.7 },
    { x: x + radius * 0.7, y: y - radius * 0.7 },
    { x: x - radius * 0.7, y: y + radius * 0.7 },
    { x: x + radius * 0.7, y: y + radius * 0.7 },
  ];
  return samples.some((sample) => stage2NoGoPolygons.some((polygon) => pointInPolygon(sample, polygon)));
}

function movePlayerWithStageCollision(p, dx, dy) {
  const fromX = p.x;
  const fromY = p.y;
  const nextX = clamp(fromX + dx, 32, world.w - 32);
  const nextY = clamp(fromY + dy, 32, world.h - 32);
  if (!isStage2Blocked(nextX, nextY, p.r)) {
    p.x = nextX;
    p.y = nextY;
    return;
  }
  if (!isStage2Blocked(nextX, fromY, p.r)) p.x = nextX;
  if (!isStage2Blocked(p.x, nextY, p.r)) p.y = nextY;
}

function moveActorWithStageCollision(actor, dx, dy) {
  const fromX = actor.x;
  const fromY = actor.y;
  const nextX = clamp(fromX + dx, 32, world.w - 32);
  const nextY = clamp(fromY + dy, 32, world.h - 32);
  if (!isStage2Blocked(nextX, nextY, actor.r)) {
    actor.x = nextX;
    actor.y = nextY;
    return;
  }
  if (!isStage2Blocked(nextX, fromY, actor.r)) actor.x = nextX;
  if (!isStage2Blocked(actor.x, nextY, actor.r)) actor.y = nextY;
}

function resolveActorOutOfStageBlock(actor) {
  if (!isStage2Blocked(actor.x, actor.y, actor.r)) return;
  const originX = actor.x;
  const originY = actor.y;
  for (let radius = 12; radius <= 260; radius += 12) {
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      const x = clamp(originX + Math.cos(angle) * radius, 32, world.w - 32);
      const y = clamp(originY + Math.sin(angle) * radius, 32, world.h - 32);
      if (!isStage2Blocked(x, y, actor.r)) {
        actor.x = x;
        actor.y = y;
        return;
      }
    }
  }
  actor.x = world.w / 2;
  actor.y = world.h - 210;
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateTrim(image) {
  const trimCanvas = document.createElement("canvas");
  trimCanvas.width = image.naturalWidth || image.width;
  trimCanvas.height = image.naturalHeight || image.height;
  const trimCtx = trimCanvas.getContext("2d", { willReadFrequently: true });
  trimCtx.drawImage(image, 0, 0);
  const pixels = trimCtx.getImageData(0, 0, trimCanvas.width, trimCanvas.height).data;
  let minX = trimCanvas.width;
  let minY = trimCanvas.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < trimCanvas.height; y += 1) {
    for (let x = 0; x < trimCanvas.width; x += 1) {
      const alpha = pixels[(y * trimCanvas.width + x) * 4 + 3];
      if (alpha > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    return { x: 0, y: 0, w: trimCanvas.width, h: trimCanvas.height };
  }
  const pad = 14;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(trimCanvas.width, maxX + pad);
  maxY = Math.min(trimCanvas.height, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function buildGoroFrames() {
  if (!sprite.complete || !sprite.naturalWidth) return null;
  if (goroFrames) return goroFrames;

  const cellW = sprite.naturalWidth / GORO_COLS;
  const cellH = sprite.naturalHeight / GORO_ROWS;
  const buildCellFrames = () =>
    Array.from({ length: GORO_ROWS }, (_, row) =>
      Array.from({ length: GORO_COLS }, (_, col) => ({
        x: Math.round(col * cellW),
        y: Math.round(row * cellH),
        w: Math.round((col + 1) * cellW) - Math.round(col * cellW),
        h: Math.round((row + 1) * cellH) - Math.round(row * cellH),
      })),
    );

  const trimCanvas = document.createElement("canvas");
  trimCanvas.width = sprite.naturalWidth;
  trimCanvas.height = sprite.naturalHeight;
  const trimCtx = trimCanvas.getContext("2d", { willReadFrequently: true });
  let pixels;
  try {
    trimCtx.drawImage(sprite, 0, 0);
    pixels = trimCtx.getImageData(0, 0, trimCanvas.width, trimCanvas.height).data;
  } catch {
    goroFrames = buildCellFrames();
    return goroFrames;
  }
  const rows = [];

  for (let row = 0; row < GORO_ROWS; row += 1) {
    const frameRow = [];
    for (let col = 0; col < GORO_COLS; col += 1) {
      const sx = Math.round(col * cellW);
      const sy = Math.round(row * cellH);
      const ex = Math.round((col + 1) * cellW);
      const ey = Math.round((row + 1) * cellH);
      let minX = ex;
      let minY = ey;
      let maxX = sx;
      let maxY = sy;

      for (let y = sy; y < ey; y += 1) {
        for (let x = sx; x < ex; x += 1) {
          const index = (y * trimCanvas.width + x) * 4;
          const alpha = pixels[index + 3];
          if (alpha > 12) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX <= minX || maxY <= minY) {
        frameRow.push({ x: sx, y: sy, w: ex - sx, h: ey - sy });
      } else {
        const pad = 8;
        minX = Math.max(sx, minX - pad);
        minY = Math.max(sy, minY - pad);
        maxX = Math.min(ex, maxX + pad);
        maxY = Math.min(ey, maxY + pad);
        frameRow.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
      }
    }
    rows.push(frameRow);
  }

  goroFrames = rows;
  return goroFrames;
}

function ensureImageTrim(image, key) {
  if (!image.complete || !image.naturalWidth) return null;
  if (key === "brute") {
    if (bruteZombieTrimTried) return bruteZombieTrim;
    bruteZombieTrimTried = true;
  } else if (key === "bisuko") {
    if (bisukoCageTrimTried) return bisukoCageTrim;
    bisukoCageTrimTried = true;
  } else if (key === "bisukoRun") {
    if (bisukoRunTrimTried) return bisukoRunTrim;
    bisukoRunTrimTried = true;
  } else if (key === "runner") {
    if (runnerZombieTrimTried) return runnerZombieTrim;
    runnerZombieTrimTried = true;
  } else if (key === "dog") {
    if (zombieDogTrimTried) return zombieDogTrim;
    zombieDogTrimTried = true;
  } else if (key === "nomurarch") {
    if (nomurarchTrimTried) return nomurarchTrim;
    nomurarchTrimTried = true;
  } else {
    if (zombieTrimTried) return zombieTrim;
    zombieTrimTried = true;
  }
  let trim;
  try {
    trim = calculateTrim(image);
  } catch {
    trim = { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
  }
  if (key === "brute") {
    bruteZombieTrim = trim;
  } else if (key === "bisuko") {
    bisukoCageTrim = trim;
  } else if (key === "bisukoRun") {
    bisukoRunTrim = trim;
  } else if (key === "runner") {
    runnerZombieTrim = trim;
  } else if (key === "dog") {
    zombieDogTrim = trim;
  } else if (key === "nomurarch") {
    nomurarchTrim = trim;
  } else {
    zombieTrim = trim;
  }
  return trim;
}

function ensureZombieTrim() {
  ensureImageTrim(zombieSprite, "normal");
  ensureImageTrim(runnerZombieSprite, "runner");
  ensureImageTrim(bruteZombieSprite, "brute");
  ensureImageTrim(zombieDogSprite, "dog");
  ensureImageTrim(bisukoCageImage, "bisuko");
  ensureImageTrim(bisukoRunImage, "bisukoRun");
  ensureImageTrim(nomurarchImage, "nomurarch");
}

zombieSprite.addEventListener("load", ensureZombieTrim);
zombieSprite.src = "assets/zombie.png";
runnerZombieSprite.addEventListener("load", ensureZombieTrim);
runnerZombieSprite.src = "assets/zombie-runner.png";
bruteZombieSprite.addEventListener("load", ensureZombieTrim);
bruteZombieSprite.src = "assets/zombie-brute.png";
zombieDogSprite.addEventListener("load", ensureZombieTrim);
bisukoCageImage.addEventListener("load", ensureZombieTrim);
bisukoRunImage.addEventListener("load", ensureZombieTrim);
nomurarchImage.addEventListener("load", ensureZombieTrim);

function nextStage2EnemyType() {
  const cycle = ["brute", "walker", "walker", "runner"];
  const type = cycle[state.stage2SpawnIndex % cycle.length];
  state.stage2SpawnIndex += 1;
  return type;
}

function spawnEnemy(elite = false, forcedType = null) {
  const stage2Elapsed = state.stage >= 2 ? Math.max(0, state.time - state.stage2StartedAt) : 0;
  const stage2PaceElapsed = Math.max(stage2Elapsed, 90);
  const scale = state.stage >= 2 ? 1 + stage2PaceElapsed / 260 : 1 + state.time / 180;
  const speedScale = state.stage >= 2 ? 1.08 + stage2PaceElapsed / 430 : scale;
  const runnerChance = Math.min(0.22, 0.09 + state.time / 1500);
  const type = forcedType || (state.stage >= 2 ? nextStage2EnemyType() : elite ? "brute" : Math.random() < runnerChance ? "runner" : "walker");
  const stats = {
    walker: { hp: 35 * scale, speed: rand(64, 88) * speedScale, damage: 10, size: 24, xp: 3 },
    runner: { hp: 24 * scale, speed: rand(116, 148) * speedScale * (state.stage >= 2 ? 0.9 : 1), damage: 8, size: 19, xp: 4 },
    brute: { hp: 155 * scale, speed: 58 * speedScale, damage: 18, size: 38, xp: 18 },
  }[type];
  let x = state.player.x;
  let y = state.player.y;
  const margin = 560;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const edge = Math.floor(Math.random() * 4);
    x = state.player.x;
    y = state.player.y;
    if (edge === 0) {
      x += rand(-720, 720);
      y -= margin;
    } else if (edge === 1) {
      x += rand(-720, 720);
      y += margin;
    } else if (edge === 2) {
      x -= margin;
      y += rand(-430, 430);
    } else {
      x += margin;
      y += rand(-430, 430);
    }
    x = clamp(x, 60, world.w - 60);
    y = clamp(y, 60, world.h - 60);
    if (!isStage2Blocked(x, y, stats.size + 12)) break;
  }
  if (isStage2Blocked(x, y, stats.size + 12)) {
    x = rand(520, world.w - 520);
    y = rand(world.h * 0.48, world.h - 140);
  }
  state.enemies.push({
    x,
    y,
    maxHp: stats.hp,
    hp: stats.hp,
    speed: stats.speed,
    damage: stats.damage,
    r: stats.size,
    xp: stats.xp,
    type,
    hit: 0,
    allyHit: 0,
    spawnIn: type === "brute" ? 1.0 : 0.72,
    spawnFx: 0,
  });
}

function countZombieDogs() {
  return state.enemies.filter((enemy) => enemy.type === "dog" && enemy.hp > 0).length;
}

function refillZombieDogs() {
  while (state.stage >= 2 && countZombieDogs() < ZOMBIE_DOG_MAX) {
    spawnZombieDog();
  }
}

function spawnZombieDog() {
  if (state.stage < 2) return;
  if (countZombieDogs() >= ZOMBIE_DOG_MAX) {
    state.dogPackAtCapacity = true;
    return;
  }
  const stage2Elapsed = Math.max(0, state.time - state.stage2StartedAt);
  const speed = rand(98, 128) * (1 + Math.min(0.42, stage2Elapsed / 420));
  let x = rand(480, world.w - 420);
  let y = rand(700, world.h - 180);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    x = rand(380, world.w - 360);
    y = rand(620, world.h - 160);
    if (!isStage2Blocked(x, y, 34)) break;
  }
  let targetX = x;
  let targetY = y;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    targetX = rand(360, world.w - 360);
    targetY = rand(620, world.h - 160);
    if (!isStage2Blocked(targetX, targetY, 34)) break;
  }
  state.enemies.push({
    x,
    y,
    maxHp: 46,
    hp: 46,
    speed,
    damage: 12,
    r: 30,
    xp: 6,
    type: "dog",
    hit: 0,
    allyHit: 0,
    spawnIn: 0.55,
    spawnFx: 0,
    roamTarget: { x: targetX, y: targetY },
    roamTimer: rand(2.4, 4.8),
  });
  if (countZombieDogs() >= ZOMBIE_DOG_MAX) {
    state.dogPackAtCapacity = true;
  }
}

function nearestEnemy() {
  let best = null;
  let bestD = Infinity;
  for (const e of state.enemies) {
    if (e.spawnIn > 0) continue;
    const d = dist(state.player, e);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function fireAt(target) {
  if (!target) return;
  const p = state.player;
  const base = Math.atan2(target.y - p.y, target.x - p.x);
  const spread = 0.18;
  for (let i = 0; i < p.shotCount; i += 1) {
    const offset = (i - (p.shotCount - 1) / 2) * spread;
    const angle = base + offset;
    state.bullets.push({
      x: p.x,
      y: p.y - 12,
      vx: Math.cos(angle) * 620,
      vy: Math.sin(angle) * 620,
      r: 6,
      life: 0.9,
      maxLife: 0.9,
      damage: p.damage,
    });
  }
}

function getNomurarchAlly() {
  if (state.stage < 2) return null;
  const p = state.player;
  const angle = -state.time * 2.9;
  return {
    x: p.x + Math.cos(angle) * 152,
    y: p.y + Math.sin(angle) * 152,
    r: 54,
    angle,
  };
}

function isNearStage2Train() {
  return state.stage >= 2 && state.trainReady && !state.endingStarted && state.player.y < 640 && state.player.x > 430 && state.player.x < world.w - 300;
}

function addPopup(text, x, y, color = "#f7f2e7") {
  state.popups.push({ text, x, y, color, life: 0.75 });
}

function addParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(40, 180);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.25, 0.7),
      color,
      size: rand(2, 5),
    });
  }
}

function addBloodSplatter(x, y, angle = rand(0, Math.PI * 2), count = 12) {
  for (let i = 0; i < count; i += 1) {
    const spread = rand(-0.9, 0.9);
    const a = angle + Math.PI + spread;
    const speed = rand(80, 270);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: rand(0.22, 0.58),
      color: choose(["#6f1518", "#9f2424", "#c63a32", "#3b0d10"]),
      size: rand(2, 6),
      stretch: rand(1.5, 3.8),
      spin: rand(-1.4, 1.4),
      type: "blood",
    });
  }
}

function triggerAmbientEvent() {
  const variants = [
    { text: "街灯が瞬いた", color: "#f0cf6a" },
    { text: "草むらがざわめいた", color: "#8fd27f" },
    { text: "遠くで影が横切った", color: "#d4f6ff" },
  ];
  state.ambient = { ...choose(variants), life: 2.2, maxLife: 2.2 };
  state.shake = Math.max(state.shake, 2.2);
}

function rescueBisuko() {
  const p = state.player;
  const rescue = state.rescue;
  if (rescue.rescued) return;
  rescue.rescued = true;
  rescue.active = false;
  rescue.rescuedCount += 1;
  p.maxShield = Math.max(p.maxShield, 45);
  p.shield = Math.min(p.maxShield, p.shield + 45);
  p.hp = Math.min(p.maxHp, p.hp + 38);
  p.fireRate = Math.max(0.16, p.fireRate * 0.78);
  addPopup("THANK YOU❤", rescue.x, rescue.y - 110, "#ffd4ea");
  addPopup("回復 + シールド + 連射UP", p.x, p.y - 92, "#e6b34a");
  addParticles(rescue.x, rescue.y, "#d4f6ff", 36);
  startBisukoEscape();
  updateUi();
}

function randomRescuePosition() {
  for (let i = 0; i < 24; i += 1) {
    const pos = { x: rand(360, world.w - 360), y: rand(260, world.h - 260) };
    if (!state?.player || dist(pos, state.player) > 420) return pos;
  }
  return { x: world.w / 2 + rand(-520, 520), y: world.h / 2 + rand(-300, 300) };
}

function spawnBisuko(reason = "timer") {
  const rescue = state.rescue;
  if (!rescue || rescue.active || rescue.escape) return;
  const pos = randomRescuePosition();
  rescue.x = clamp(pos.x, 260, world.w - 260);
  rescue.y = clamp(pos.y, 220, world.h - 220);
  rescue.progress = 0;
  rescue.active = true;
  rescue.rescued = false;
  rescue.spawnedCount += 1;
  rescue.pulse = 0;
  addPopup(reason === "emergency" ? "ビス子が再出現!" : "HELP!", rescue.x, rescue.y - 120, "#ffd4ea");
}

function startBisukoEscape() {
  const rescue = state.rescue;
  const exits = [
    { x: -180, y: rescue.y },
    { x: world.w + 180, y: rescue.y },
    { x: rescue.x, y: -180 },
    { x: rescue.x, y: world.h + 180 },
  ];
  let target = exits[0];
  let best = Infinity;
  for (const exit of exits) {
    const d = dist(rescue, exit);
    if (d < best) {
      best = d;
      target = exit;
    }
  }
  const angle = Math.atan2(target.y - rescue.y, target.x - rescue.x);
  const escapeSpeed = 210;
  rescue.escape = {
    x: rescue.x,
    y: rescue.y,
    vx: Math.cos(angle) * escapeSpeed,
    vy: Math.sin(angle) * escapeSpeed,
    life: 3.8,
  };
}

function gainXp(amount) {
  const p = state.player;
  p.xp += amount;
  while (p.xp >= p.nextXp) {
    p.xp -= p.nextXp;
    p.level += 1;
    p.nextXp = Math.round(p.nextXp * 1.28 + 8);
    state.mode = "upgrade";
    showUpgrade();
  }
}

function showUpgrade() {
  const options = [...upgrades].sort(() => Math.random() - 0.5).slice(0, 3);
  ui.upgradeChoices.replaceChildren();
  for (const option of options) {
    const button = document.createElement("button");
    button.innerHTML = `
      <span class="choice-icon"><img src="${option.icon}" alt="" /></span>
      <span class="choice-copy">
        <strong>${option.name}</strong>
        <span>${option.desc}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      option.apply(state.player);
      ui.upgradePanel.classList.add("hidden");
      state.mode = "playing";
      addPopup(option.name, state.player.x, state.player.y - 80, "#e6b34a");
      updateUi();
    });
    ui.upgradeChoices.append(button);
  }
  ui.upgradePanel.classList.remove("hidden");
}

function showVendingPrompt(machine) {
  if (state.mode !== "playing" || pendingVendingMachine) return;
  pendingVendingMachine = machine;
  state.mode = "vending";
  ui.vendingPanel.classList.remove("hidden");
}

function closeVendingPrompt() {
  if (pendingVendingMachine) {
    pendingVendingMachine.cooldown = 0.9;
    pendingVendingMachine.notice = 0.8;
  }
  pendingVendingMachine = null;
  ui.vendingPanel.classList.add("hidden");
  if (state?.mode === "vending") state.mode = "playing";
}

function buyVendingDrink() {
  if (!pendingVendingMachine || !state?.player) return;
  const p = state.player;
  if (p.coins >= 50 && p.hp < p.maxHp) {
    p.coins -= 50;
    p.hp = Math.min(p.maxHp, p.hp + 60);
    pendingVendingMachine.cooldown = 2.2;
    pendingVendingMachine.notice = 1.2;
    addPopup("酒 -50 / 体力回復", pendingVendingMachine.x, pendingVendingMachine.y - 150, "#f0cf6a");
    addParticles(pendingVendingMachine.x, pendingVendingMachine.y - 72, "#e6b34a", 18);
    updateUi();
  }
  closeVendingPrompt();
}

function activateStage2Phone() {
  const phone = state.phone;
  phone.active = true;
  phone.fall = 1;
  phone.x = world.w / 2;
  phone.y = world.h / 2;
  state.callout = { text: "電話だ！応答しよう！", life: 2.8, maxLife: 2.8 };
  addPopup("着信アリ", phone.x, phone.y - 92, "#f0cf6a");
}

function repelEnemiesFromPhone(dt) {
  const phone = state.phone;
  if (!phone?.active) return;
  const safeRadius = 250;
  for (const e of state.enemies) {
    if (e.spawnIn > 0) continue;
    const d = dist(e, phone) || 1;
    if (d < safeRadius + e.r) {
      const angle = Math.atan2(e.y - phone.y, e.x - phone.x);
      const targetDistance = safeRadius + e.r + 8;
      const targetX = phone.x + Math.cos(angle) * targetDistance;
      const targetY = phone.y + Math.sin(angle) * targetDistance;
      const push = d < phone.r + e.r ? 1 : clamp(1 - d / (safeRadius + e.r), 0.18, 0.72);
      moveActorWithStageCollision(e, (targetX - e.x) * push * Math.min(1, dt * 9), (targetY - e.y) * push * Math.min(1, dt * 9));
    }
  }
}

function updateStage2Phone(dt) {
  const phone = state.phone;
  if (!phone || phone.collected) return false;
  if (!phone.active && !state.stage2Started && state.time >= 180) {
    activateStage2Phone();
  }
  if (!phone.active) return false;
  phone.fall = Math.max(0, phone.fall - dt * 0.9);
  repelEnemiesFromPhone(dt);
  if (phone.fall <= 0 && dist(state.player, phone) < state.player.r + phone.r) {
    phone.active = false;
    phone.collected = true;
    startStage2Cutscene();
    return true;
  }
  return false;
}

function killEnemy(enemy) {
  state.player.kills += 1;
  const dropCount = enemy.type === "brute" ? 3 : Math.floor(rand(2, 4));
  for (let i = 0; i < dropCount; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(10, enemy.r + 18);
    state.drops.push({
      x: enemy.x + Math.cos(angle) * radius,
      y: enemy.y + Math.sin(angle) * radius,
      baseX: enemy.x + Math.cos(angle) * radius,
      baseY: enemy.y + Math.sin(angle) * radius,
      r: rand(8, 12),
      xp: enemy.xp / dropCount,
      coin: 0,
      bob: rand(0, Math.PI * 2),
      alpha: rand(0.42, 0.68),
      hue: choose(["#8ee8ff", "#b8fff0", "#fff0a8"]),
    });
  }
  const coinReward = enemy.type === "brute" ? 5 : 1;
  for (let i = 0; i < coinReward; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(18, enemy.r + 32);
    state.drops.push({
      x: enemy.x + Math.cos(angle) * radius,
      y: enemy.y + Math.sin(angle) * radius,
      baseX: enemy.x + Math.cos(angle) * radius,
      baseY: enemy.y + Math.sin(angle) * radius,
      r: enemy.type === "brute" ? rand(12, 15) : rand(11, 13),
      xp: 0,
      coin: 1,
      bob: rand(0, Math.PI * 2),
      alpha: 0.96,
      hue: "#f7c84d",
    });
  }
  addBloodSplatter(enemy.x, enemy.y, rand(0, Math.PI * 2), enemy.type === "brute" ? 24 : 12);
}

function update(dt) {
  if (state.mode === "vending") {
    const p = state.player;
    if (
      !pendingVendingMachine ||
      dist(p, pendingVendingMachine) >= pendingVendingMachine.r ||
      p.hp >= p.maxHp ||
      p.coins < 50
    ) {
      closeVendingPrompt();
    }
    return;
  }
  if (state.mode !== "playing") return;
  const p = state.player;
  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 18);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hitReact = Math.max(0, p.hitReact - dt);

  if (state.stage < 2) {
    state.ambientTimer -= dt;
    if (state.ambientTimer <= 0) {
      triggerAmbientEvent();
      state.ambientTimer = rand(9, 14);
    }
    if (state.ambient) {
      state.ambient.life -= dt;
      if (state.ambient.life <= 0) state.ambient = null;
    }
  } else {
    state.ambient = null;
  }
  if (state.callout) {
    state.callout.life -= dt;
    if (state.callout.life <= 0) state.callout = null;
  }

  let mx = 0;
  let my = 0;
  if (keys.has("arrowleft") || keys.has("a")) mx -= 1;
  if (keys.has("arrowright") || keys.has("d")) mx += 1;
  if (keys.has("arrowup") || keys.has("w")) my -= 1;
  if (keys.has("arrowdown") || keys.has("s")) my += 1;
  const len = Math.hypot(mx, my) || 1;
  mx /= len;
  my /= len;
  p.moving = Math.abs(mx) + Math.abs(my) > 0;
  if (mx > 0.05) p.face = "right";
  if (mx < -0.05) p.face = "left";
  const dash = keys.has(" ") && p.dash > 0.04 ? 1.7 : 1;
  p.dash = clamp(p.dash + (dash > 1 ? -0.58 : 0.38) * dt, 0, 1);
  movePlayerWithStageCollision(p, mx * p.speed * dash * dt, my * p.speed * dash * dt);
  resolveActorOutOfStageBlock(p);

  if (updateStage2Phone(dt)) return;

  const rescue = state.rescue;
  if (rescue && rescue.spawnedCount === 0 && state.time >= rescue.firstSpawnAt) {
    spawnBisuko("timer");
  }
  if (
    rescue &&
    !rescue.lowHealthSpawned &&
    rescue.rescuedCount > 0 &&
    p.hp <= p.maxHp / 3 &&
    !rescue.active &&
    !rescue.escape
  ) {
    rescue.lowHealthSpawned = true;
    spawnBisuko("emergency");
  }
  if (rescue?.escape) {
    rescue.escape.x += rescue.escape.vx * dt;
    rescue.escape.y += rescue.escape.vy * dt;
    rescue.escape.life -= dt;
    if (
      rescue.escape.life <= 0 ||
      rescue.escape.x < -220 ||
      rescue.escape.x > world.w + 220 ||
      rescue.escape.y < -220 ||
      rescue.escape.y > world.h + 220
    ) {
      rescue.escape = null;
    }
  }
  if (rescue && rescue.active && !rescue.rescued) {
    rescue.pulse += dt;
    const nearRescue = dist(p, rescue) < rescue.r;
    if (nearRescue) {
      rescue.progress = Math.min(rescue.needed, rescue.progress + dt);
      if (rescue.progress >= rescue.needed) rescueBisuko();
    }
  }

  for (const machine of state.vendingMachines) {
    machine.cooldown = Math.max(0, machine.cooldown - dt);
    machine.notice = Math.max(0, machine.notice - dt);
    const nearMachine = dist(p, machine) < machine.r;
    if (nearMachine && machine.cooldown <= 0 && p.hp < p.maxHp && !pendingVendingMachine) {
      if (p.coins >= 50) {
        showVendingPrompt(machine);
        return;
      } else if (machine.notice <= 0) {
        machine.notice = 1.2;
        addPopup("50コイン必要", machine.x, machine.y - 150, "#d64f42");
      }
    }
  }

  const stage2Elapsed = state.stage >= 2 ? state.time - state.stage2StartedAt : Infinity;
  if (state.stage >= 2 && !state.trainReady && stage2Elapsed >= 120) {
    state.trainReady = true;
    state.callout = { text: "電車が来た！乗り込め！！", life: 4.2, maxLife: 4.2 };
  }
  if (isNearStage2Train()) {
    startEndingCutscene();
    return;
  }
  if (stage2Elapsed < 1) {
    state.spawnTimer = Math.max(state.spawnTimer, 0.12);
    state.eliteTimer = Math.max(state.eliteTimer, 1.5);
  } else {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const baseAmount = Math.min(5, 1 + Math.floor(state.time / 48));
      const stage2PaceElapsed = Math.max(stage2Elapsed, 90);
      const amount = state.stage >= 2 ? Math.min(3, 1 + Math.floor(stage2PaceElapsed / 42)) : baseAmount;
      for (let i = 0; i < amount; i += 1) {
        spawnEnemy(false, state.stage >= 2 ? nextStage2EnemyType() : null);
      }
      state.spawnTimer = state.stage >= 2 ? Math.max(1.15, 2.25 - stage2PaceElapsed / 300) : Math.max(0.82, 2.05 - state.time / 420);
    }
    if (state.stage < 2) {
      state.eliteTimer -= dt;
      if (state.eliteTimer <= 0) {
        spawnEnemy(true);
        state.eliteTimer = Math.max(15, 30 - state.time / 34);
      }
    } else {
      state.dogSpawnTimer -= dt;
      if (state.dogSpawnTimer <= 0) {
        spawnZombieDog();
        state.dogSpawnTimer = rand(11, 17);
      }
    }
  }

  p.fireTimer -= dt;
  if (p.fireTimer <= 0) {
    fireAt(nearestEnemy());
    p.fireTimer = p.fireRate;
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }
  state.bullets = state.bullets.filter((b) => b.life > 0 && b.x > 0 && b.y > 0 && b.x < world.w && b.y < world.h);

  const orbAngle = state.time * 3.4;
  for (let i = 0; i < p.orbs; i += 1) {
    const a = orbAngle + (i / p.orbs) * Math.PI * 2;
    const orb = { x: p.x + Math.cos(a) * 84, y: p.y + Math.sin(a) * 84, r: 18 };
    for (const e of state.enemies) {
      if (e.spawnIn > 0) continue;
      if (dist(orb, e) < orb.r + e.r && e.hit <= 0.02) {
        e.hp -= 18 * dt * 7;
        e.hit = 0.08;
        addBloodSplatter(e.x, e.y, Math.atan2(e.y - p.y, e.x - p.x), 3);
      }
    }
  }

  const ally = getNomurarchAlly();
  if (ally) {
    for (const e of state.enemies) {
      if (e.spawnIn > 0) continue;
      e.allyHit = Math.max(0, e.allyHit - dt);
      if (e.allyHit <= 0 && dist(ally, e) < ally.r + e.r) {
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.hp -= 8;
        e.hit = 0.18;
        e.allyHit = 1;
        moveActorWithStageCollision(e, Math.cos(angle) * 60, Math.sin(angle) * 60);
        addBloodSplatter(e.x, e.y, angle, e.type === "brute" ? 10 : 6);
        addPopup("押し返し", e.x, e.y - e.r - 18, "#f0cf6a");
      }
    }
  }

  for (const e of state.enemies) {
    if (e.spawnIn > 0) {
      e.spawnIn = Math.max(0, e.spawnIn - dt);
      e.spawnFx += dt;
      continue;
    }
    let angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.type === "dog") {
      e.roamTimer -= dt;
      if (!e.roamTarget || e.roamTimer <= 0 || dist(e, e.roamTarget) < 42) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          e.roamTarget = { x: rand(360, world.w - 360), y: rand(620, world.h - 160) };
          if (!isStage2Blocked(e.roamTarget.x, e.roamTarget.y, e.r + 10)) break;
        }
        e.roamTimer = rand(2.8, 5.2);
      }
      angle = Math.atan2(e.roamTarget.y - e.y, e.roamTarget.x - e.x);
    }
    moveActorWithStageCollision(e, Math.cos(angle) * e.speed * dt, Math.sin(angle) * e.speed * dt);
    e.hit = Math.max(0, e.hit - dt);
    if (dist(p, e) < p.r + e.r && p.invuln <= 0) {
      let damage = e.damage;
      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, damage);
        p.shield -= absorbed;
        damage -= absorbed;
      }
      p.hp -= damage;
      p.invuln = 0.42;
      p.hitReact = 0.34;
      const knock = Math.atan2(p.y - e.y, p.x - e.x);
      movePlayerWithStageCollision(p, Math.cos(knock) * 18, Math.sin(knock) * 18);
      resolveActorOutOfStageBlock(p);
      state.shake = 8;
      addParticles(p.x, p.y, "#d64f42", 12);
      if (p.hp <= 0) endGame(false);
    }
  }

  for (const bullet of state.bullets) {
    for (const e of state.enemies) {
      if (e.spawnIn > 0) continue;
      if (bullet.life > 0 && dist(bullet, e) < bullet.r + e.r) {
        e.hp -= bullet.damage;
        e.hit = 0.16;
        bullet.life = 0;
        addBloodSplatter(bullet.x, bullet.y, Math.atan2(bullet.vy, bullet.vx), 11);
        break;
      }
    }
  }

  const dead = state.enemies.filter((e) => e.hp <= 0);
  const deadDogCount = dead.filter((e) => e.type === "dog").length;
  for (const e of dead) killEnemy(e);
  state.enemies = state.enemies.filter((e) => e.hp > 0);
  if (deadDogCount > 0 && state.dogPackAtCapacity) {
    refillZombieDogs();
  }

  for (const drop of state.drops) {
    drop.bob += dt * 3.8;
    const floatY = Math.sin(drop.bob) * 6;
    const d = dist(p, drop);
    if (d < p.pickup) {
      const pull = clamp(1 - d / p.pickup, 0, 1) * 520;
      const angle = Math.atan2(p.y - drop.y, p.x - drop.x);
      drop.x += Math.cos(angle) * pull * dt;
      drop.y += Math.sin(angle) * pull * dt;
      drop.baseX = drop.x;
      drop.baseY = drop.y;
    } else {
      drop.x = drop.baseX;
      drop.y = drop.baseY + floatY;
    }
    if (d < p.r + drop.r) {
      drop.collected = true;
      gainXp(drop.xp);
      p.coins += drop.coin;
    }
  }
  state.drops = state.drops.filter((d) => !d.collected);

  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.94;
    particle.vy *= 0.94;
    particle.life -= dt;
  }
  state.particles = state.particles.filter((pcl) => pcl.life > 0);

  for (const popup of state.popups) {
    popup.y -= 34 * dt;
    popup.life -= dt;
  }
  state.popups = state.popups.filter((popup) => popup.life > 0);

  if (state.time >= 600) endGame(true);
  updateUi();
}

function endGame(clear) {
  const result = `${formatTime(state.time)} 生存。${state.player.kills}体撃破、${state.player.coins}コイン獲得。`;
  state.mode = "ended";
  state.shake = 0;
  ui.startPanel.classList.add("hidden");
  ui.openingPanel.classList.add("hidden");
  ui.upgradePanel.classList.add("hidden");
  ui.vendingPanel.classList.add("hidden");
  ui.resultPanel.classList.toggle("is-gameover", !clear);
  ui.resultPanel.classList.toggle("is-clear", clear);
  ui.resultTitle.textContent = clear ? "生還" : "ゲームオーバー";
  ui.resultImage.classList.toggle("hidden", clear);
  ui.resultText.textContent = result;
  ui.restartButton.textContent = "タイトル画面に戻る";
  ui.resultPanel.classList.remove("hidden");
}

function updateUi() {
  if (!state) return;
  const p = state.player;
  ui.time.textContent = formatTime(state.time);
  ui.level.textContent = p.level;
  ui.kills.textContent = p.kills;
  ui.coins.textContent = p.coins;
  ui.xpText.textContent = `${Math.floor(p.xp)}/${p.nextXp}`;
  ui.hpBar.style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
  ui.hpText.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  const shieldMax = Math.max(1, p.maxShield);
  ui.shieldRow.classList.toggle("active", p.maxShield > 0 || p.shield > 0);
  ui.shieldBar.style.width = `${clamp((p.shield / shieldMax) * 100, 0, 100)}%`;
  ui.shieldText.textContent = `${Math.ceil(p.shield)} / ${p.maxShield}`;
  ui.pickupBar.style.width = `${clamp((p.pickup / p.maxPickupView) * 100, 0, 100)}%`;
  ui.pickupText.textContent = `${Math.round((p.pickup / p.basePickup) * 100)}%`;
}

function drawGround() {
  ctx.fillStyle = "#111712";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const stageBackground = state.stage >= 2 ? stage2BackgroundImage : backgroundImage;
  if (stageBackground.complete && stageBackground.naturalWidth) {
    ctx.drawImage(stageBackground, -camera.x, -camera.y, world.w, world.h);
    ctx.fillStyle = state.stage >= 2 ? "rgba(5, 7, 8, 0.08)" : "rgba(7, 9, 8, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const grid = 96;
    const ox = -camera.x % grid;
    const oy = -camera.y % grid;
    ctx.fillStyle = "#1d261f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let x = ox; x < canvas.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = oy; y < canvas.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}

function drawTrainArrivalCue() {
  if (state.stage < 2 || !state.trainReady || state.endingStarted) return;
  const pulse = 0.5 + Math.sin(state.time * 5) * 0.5;
  const trackTop = -camera.y + 40;
  const trackBottom = -camera.y + 520;
  ctx.save();
  const glow = ctx.createLinearGradient(0, trackTop, 0, trackBottom);
  glow.addColorStop(0, `rgba(255, 222, 132, ${0.38 + pulse * 0.18})`);
  glow.addColorStop(0.45, `rgba(255, 201, 72, ${0.24 + pulse * 0.14})`);
  glow.addColorStop(1, "rgba(255, 201, 72, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, Math.max(0, trackBottom));

  const zoneY = 610 - camera.y;
  ctx.strokeStyle = `rgba(255, 232, 146, ${0.62 + pulse * 0.28})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(Math.max(0, 420 - camera.x), zoneY);
  ctx.lineTo(Math.min(canvas.width, world.w - 300 - camera.x), zoneY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(18, 11, 7, 0.82)";
  ctx.strokeStyle = "rgba(240, 207, 106, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundedRect(ctx, canvas.width / 2 - 135, Math.max(72, zoneY + 18), 270, 36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f0cf6a";
  ctx.font = "900 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("線路側へ向かえ", canvas.width / 2, Math.max(96, zoneY + 42));
  ctx.restore();
}

function drawTrainDirectionArrow() {
  if (state.stage < 2 || !state.trainReady || state.endingStarted) return;
  const p = state.player;
  const s = worldToScreen(p);
  const bob = Math.sin(state.time * 6.5) * 10;
  const x = s.x;
  const y = s.y - 128 + bob;
  const labelY = y - 36;
  ctx.save();
  ctx.fillStyle = "rgba(8, 5, 4, 0.82)";
  ctx.strokeStyle = "rgba(255, 232, 146, 0.86)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundedRect(ctx, x - 72, labelY - 18, 144, 32, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe892";
  ctx.font = "900 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("上へ向かえ", x, labelY + 4);

  ctx.fillStyle = "#ffe892";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x - 34, y + 18);
  ctx.lineTo(x - 13, y + 18);
  ctx.lineTo(x - 13, y + 46);
  ctx.lineTo(x + 13, y + 46);
  ctx.lineTo(x + 13, y + 18);
  ctx.lineTo(x + 34, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function worldToScreen(o) {
  return { x: o.x - camera.x, y: o.y - camera.y };
}

function drawGoro() {
  const p = state.player;
  const screen = worldToScreen(p);
  const anim = p.hp <= 0 ? SPRITE_ROWS.failed : p.moving ? SPRITE_ROWS[p.face] : SPRITE_ROWS.idle;
  const frame = Math.floor(state.time * (p.moving ? 12 : 7)) % anim.frames;
  const targetH = 116;
  ctx.save();
  if (p.hitReact > 0) {
    const jolt = Math.sin(state.time * 90) * 3;
    ctx.translate(jolt, -Math.abs(jolt) * 0.45);
    ctx.filter = "sepia(0.7) saturate(2.5) hue-rotate(-28deg) brightness(1.18)";
  }
  ctx.globalAlpha = p.invuln > 0 && Math.floor(state.time * 24) % 2 === 0 ? 0.55 : 1;
  if (p.shield > 0) {
    ctx.strokeStyle = "rgba(128, 224, 255, 0.72)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - 16, 46 + Math.sin(state.time * 8) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (sprite.complete && sprite.naturalWidth) {
    let frames = null;
    try {
      frames = buildGoroFrames();
    } catch {
      frames = null;
    }
    const source = frames?.[anim.row]?.[frame];
    if (source) {
      const drawH = targetH;
      const drawW = drawH * (source.w / source.h);
      ctx.drawImage(sprite, source.x, source.y, source.w, source.h, screen.x - drawW / 2, screen.y + 32 - drawH, drawW, drawH);
    }
  }
  if (p.hitReact > 0) {
    ctx.filter = "none";
    ctx.fillStyle = "rgba(255, 244, 215, 0.94)";
    ctx.strokeStyle = "rgba(76, 18, 14, 0.92)";
    ctx.lineWidth = 3;
    ctx.font = "900 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("!", screen.x + 34, screen.y - 92);
    ctx.fillText("!", screen.x + 34, screen.y - 92);
    ctx.fillStyle = "rgba(114, 215, 255, 0.88)";
    ctx.beginPath();
    ctx.ellipse(screen.x - 28, screen.y - 72, 5, 9, -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const dashW = 54;
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(screen.x - dashW / 2, screen.y + 28, dashW, 5);
  ctx.fillStyle = "#49a6b8";
  ctx.fillRect(screen.x - dashW / 2, screen.y + 28, dashW * p.dash, 5);

  for (let i = 0; i < p.orbs; i += 1) {
    const a = state.time * 3.4 + (i / p.orbs) * Math.PI * 2;
    const o = worldToScreen({ x: p.x + Math.cos(a) * 84, y: p.y + Math.sin(a) * 84 });
    drawDrone(o.x, o.y, a + Math.PI / 2, i);
  }
}

function drawNomurarchAlly() {
  const ally = getNomurarchAlly();
  if (!ally) return;
  ensureImageTrim(nomurarchImage, "nomurarch");
  const s = worldToScreen(ally);
  const bob = Math.sin(state.time * 3.2) * 3;
  const faceLeft = Math.cos(ally.angle + Math.PI / 2) < 0;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 38, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(240, 207, 106, 0.28)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.arc(s.x, s.y + 2, ally.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (nomurarchImage.complete && nomurarchImage.naturalWidth) {
    const source = nomurarchTrim || { x: 0, y: 0, w: nomurarchImage.naturalWidth, h: nomurarchImage.naturalHeight };
    const drawH = 118;
    const drawW = drawH * (source.w / source.h);
    if (faceLeft) {
      ctx.translate(s.x, s.y + bob);
      ctx.scale(-1, 1);
      ctx.drawImage(nomurarchImage, source.x, source.y, source.w, source.h, -drawW / 2, 34 - drawH, drawW, drawH);
    } else {
      ctx.drawImage(nomurarchImage, source.x, source.y, source.w, source.h, s.x - drawW / 2, s.y + bob + 34 - drawH, drawW, drawH);
    }
  }
  ctx.restore();
}

function drawRescue() {
  const rescue = state.rescue;
  if (!rescue || (!rescue.active && !rescue.escape)) return;
  ensureImageTrim(bisukoCageImage, "bisuko");
  ensureImageTrim(bisukoRunImage, "bisukoRun");
  if (rescue.escape) {
    const s = worldToScreen(rescue.escape);
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 40, 52, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  if (bisukoRunImage.complete && bisukoRunImage.naturalWidth) {
      const source = bisukoRunTrim || { x: 0, y: 0, w: bisukoRunImage.naturalWidth, h: bisukoRunImage.naturalHeight };
      const drawW = 220;
      const drawH = drawW * (source.h / source.w);
      if (rescue.escape.vx < 0) {
        ctx.translate(s.x, s.y);
        ctx.scale(-1, 1);
        ctx.drawImage(bisukoRunImage, source.x, source.y, source.w, source.h, -drawW / 2, -drawH * 0.62, drawW, drawH);
      } else {
        ctx.drawImage(bisukoRunImage, source.x, source.y, source.w, source.h, s.x - drawW / 2, s.y - drawH * 0.62, drawW, drawH);
      }
    }
    ctx.restore();
    return;
  }
  const s = worldToScreen(rescue);
  const near = dist(state.player, rescue) < rescue.r;
  ctx.save();
  ctx.strokeStyle = near ? "rgba(212, 246, 255, 0.74)" : "rgba(230, 179, 74, 0.32)";
  ctx.lineWidth = near ? 3 : 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(s.x, s.y, rescue.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 54, 72, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  if (bisukoCageImage.complete && bisukoCageImage.naturalWidth) {
    const source = bisukoCageTrim || { x: 0, y: 0, w: bisukoCageImage.naturalWidth, h: bisukoCageImage.naturalHeight };
    const drawW = 295;
    const drawH = drawW * (source.h / source.w);
    ctx.drawImage(bisukoCageImage, source.x, source.y, source.w, source.h, s.x - drawW / 2, s.y - drawH * 0.62, drawW, drawH);
  }

  const progress = clamp(rescue.progress / rescue.needed, 0, 1);
  const barW = 126;
  const barY = s.y + 88;
  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(s.x - barW / 2, barY, barW, 10);
  ctx.fillStyle = near ? "#d4f6ff" : "#e6b34a";
  ctx.fillRect(s.x - barW / 2, barY, barW * progress, 10);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.strokeRect(s.x - barW / 2, barY, barW, 10);
  ctx.fillStyle = "#f7f2e7";
  ctx.font = "800 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${progress >= 1 ? "OPEN" : "RESCUE"} ${Math.floor(rescue.progress * 10) / 10}s / 3.0s`, s.x, barY + 28);
  ctx.restore();
}

function drawDrone(x, y, angle, index) {
  const rotorPulse = 0.32 + Math.sin(state.time * 16 + index) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(116, 92, 58, 0.96)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-17, -12);
  ctx.lineTo(17, 12);
  ctx.moveTo(17, -12);
  ctx.lineTo(-17, 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(31, 20, 14, 0.92)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const body = ctx.createLinearGradient(-12, -9, 12, 9);
  body.addColorStop(0, "#6c5a3b");
  body.addColorStop(0.5, "#222a27");
  body.addColorStop(1, "#9b6b32");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#20140d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundedRect(ctx, -13, -9, 26, 18, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(31, 17, 11, 0.82)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d59a37";
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 232, 168, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const rotors = [
    [-20, -15],
    [20, -15],
    [-20, 15],
    [20, 15],
  ];
  for (const [rx, ry] of rotors) {
    ctx.fillStyle = "rgba(20, 19, 16, 0.84)";
    ctx.strokeStyle = "rgba(143, 112, 66, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(94, 151, 151, ${rotorPulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 11, 3.2, state.time * 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#856034";
    ctx.beginPath();
    ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawVendingMachines() {
  if (!state.vendingMachines) return;
  for (const machine of state.vendingMachines) {
    const s = worldToScreen(machine);
    const near = dist(state.player, machine) < machine.r;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 16, 56, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    if (near) {
      ctx.strokeStyle = state.player.coins >= 50 && state.player.hp < state.player.maxHp ? "rgba(240, 207, 106, 0.82)" : "rgba(214, 79, 66, 0.56)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 44, machine.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (vendingMachineImage.complete && vendingMachineImage.naturalWidth) {
      const drawH = 210;
      const drawW = drawH * (vendingMachineImage.naturalWidth / vendingMachineImage.naturalHeight);
      ctx.drawImage(vendingMachineImage, s.x - drawW / 2, s.y + 18 - drawH, drawW, drawH);
    } else {
      ctx.fillStyle = "#4b2019";
      ctx.fillRect(s.x - 34, s.y - 182, 68, 194);
      ctx.fillStyle = "#f7f2e7";
      ctx.font = "900 30px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("酒", s.x, s.y - 138);
    }

    if (near) {
      const full = state.player.hp >= state.player.maxHp;
      const canBuy = state.player.coins >= 50 && !full;
      ctx.fillStyle = canBuy ? "rgba(20, 13, 8, 0.82)" : "rgba(9, 7, 6, 0.82)";
      ctx.strokeStyle = canBuy ? "rgba(240, 207, 106, 0.72)" : "rgba(214, 79, 66, 0.48)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundedRect(ctx, s.x - 76, s.y - 236, 152, 34, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = canBuy ? "#f0cf6a" : "rgba(247, 242, 231, 0.72)";
      ctx.font = "900 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(full ? "体力満タン" : canBuy ? "近づくと 酒 -50" : "50コイン必要", s.x, s.y - 214);
    }
    ctx.restore();
  }
}

function drawPhonePickup() {
  const phone = state.phone;
  if (!phone?.active) return;
  const s = worldToScreen(phone);
  const fall = phone.fall * phone.fall;
  const y = s.y - fall * 190;
  const t = state.time;
  const pulse = 0.5 + Math.sin(t * 6.5) * 0.5;
  const bob = Math.sin(t * 5.8) * 12;
  const labelY = y - 182 + bob;
  const arrowTipY = y - 82 + bob * 0.3;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 22, 68 * (1 - fall * 0.45), 19 * (1 - fall * 0.35), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 226, 106, ${0.74 + pulse * 0.22})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(s.x, s.y, phone.r + 17 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 226, 106, ${0.08 + pulse * 0.06})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 246, 185, ${0.42 + pulse * 0.24})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.arc(s.x, s.y, 250, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255, 246, 185, 0.46)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x, s.y, phone.r + 34 + pulse * 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(18, 11, 7, 0.94)";
  ctx.strokeStyle = "rgba(240, 207, 106, 0.88)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundedRect(ctx, s.x - 96, labelY - 24, 192, 40, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f0cf6a";
  ctx.font = "900 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("スマホを拾う", s.x, labelY + 3);

  ctx.fillStyle = "#f0cf6a";
  ctx.beginPath();
  ctx.moveTo(s.x, arrowTipY);
  ctx.lineTo(s.x - 30, arrowTipY - 44);
  ctx.lineTo(s.x + 30, arrowTipY - 44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.64)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.translate(s.x, y);
  ctx.rotate(-0.1 + Math.sin(t * 6) * 0.025);
  if (phonePickupImage.complete && phonePickupImage.naturalWidth) {
    ctx.shadowColor = "rgba(255, 211, 90, 0.88)";
    ctx.shadowBlur = 28;
    const drawH = 158;
    const drawW = drawH * (phonePickupImage.naturalWidth / phonePickupImage.naturalHeight);
    ctx.drawImage(phonePickupImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.shadowBlur = 0;
  } else {
    const body = ctx.createLinearGradient(-18, -34, 18, 34);
    body.addColorStop(0, "#2f2b25");
    body.addColorStop(0.5, "#080908");
    body.addColorStop(1, "#5b4a32");
    ctx.fillStyle = body;
    ctx.strokeStyle = "#b4873f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundedRect(ctx, -19, -38, 38, 76, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function roundedRect(context, x, y, w, h, r) {
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function drawCoinDrop(x, y, radius, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(state.time * 4.4 + x * 0.01) * 0.12);

  const coin = ctx.createLinearGradient(-radius, -radius, radius, radius);
  coin.addColorStop(0, "#fff1a8");
  coin.addColorStop(0.32, "#f7c84d");
  coin.addColorStop(0.72, "#c98620");
  coin.addColorStop(1, "#ffe07a");
  ctx.fillStyle = coin;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.05, radius * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(2, radius * 0.16);
  ctx.strokeStyle = "#7b4512";
  ctx.stroke();
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.strokeStyle = "rgba(255, 249, 205, 0.84)";
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.68, radius * 0.58, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#6b3c10";
  ctx.font = `900 ${Math.round(radius * 1.15)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("¥", 0, radius * 0.02);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.32, -radius * 0.32, radius * 0.28, radius * 0.14, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawXpDrop(x, y, radius, alpha, hue) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const flicker = Math.sin(state.time * 9 + x * 0.03) * 0.18;
  const glow = ctx.createRadialGradient(0, -radius * 0.3, 1, 0, 0, radius * 2.2);
  glow.addColorStop(0, "rgba(255, 255, 232, 0.95)");
  glow.addColorStop(0.32, hue || "rgba(142, 232, 255, 0.76)");
  glow.addColorStop(1, "rgba(73, 166, 184, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(212, 246, 255, 0.88)";
  ctx.beginPath();
  ctx.moveTo(0, -radius * (1.55 + flicker));
  ctx.bezierCurveTo(radius * 0.92, -radius * 0.72, radius * 0.72, radius * 0.76, 0, radius * 1.15);
  ctx.bezierCurveTo(-radius * 0.9, radius * 0.72, -radius * 0.74, -radius * 0.72, 0, -radius * (1.55 + flicker));
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 238, 0.92)";
  ctx.beginPath();
  ctx.ellipse(0, -radius * 0.1, radius * 0.34, radius * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpawnWarning(enemy, screen) {
  const t = clamp(1 - enemy.spawnIn / (enemy.type === "brute" ? 1.0 : enemy.type === "dog" ? 0.55 : 0.72), 0, 1);
  const pulse = 0.5 + Math.sin(state.time * 22 + enemy.x) * 0.5;
  const radius = enemy.r * (1.2 + t * 0.9);
  const color = enemy.type === "brute" ? "rgba(181, 58, 38," : enemy.type === "dog" ? "rgba(210, 88, 58," : enemy.type === "runner" ? "rgba(143, 210, 127," : "rgba(230, 179, 74,";

  ctx.save();
  ctx.globalAlpha = 0.42 + pulse * 0.18;
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + enemy.r * 0.62, radius * 1.25, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `${color} ${0.34 + t * 0.36})`;
  ctx.lineWidth = enemy.type === "brute" || enemy.type === "dog" ? 4 : 3;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + enemy.r * 0.4, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(143, 112, 66, 0.52)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const a = state.time * 8 + i * 1.24 + enemy.x * 0.01;
    const x = screen.x + Math.cos(a) * radius * 0.75;
    const y = screen.y + enemy.r * 0.45 + Math.sin(a) * radius * 0.24;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x, y - 7 - pulse * 4);
    ctx.lineTo(x + 5, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies() {
  ensureZombieTrim();
  for (const e of state.enemies) {
    const s = worldToScreen(e);
    if (e.spawnIn > 0) {
      drawSpawnWarning(e, s);
      continue;
    }
    const bob = Math.sin(state.time * (e.type === "runner" ? 13 : e.type === "dog" ? 11 : 8) + e.x * 0.01) * 3;
    const faceLeft = e.x > state.player.x;
    const image = e.type === "brute" ? bruteZombieSprite : e.type === "dog" ? zombieDogSprite : e.type === "runner" ? runnerZombieSprite : zombieSprite;
    const trim = e.type === "brute" ? bruteZombieTrim : e.type === "dog" ? zombieDogTrim : e.type === "runner" ? runnerZombieTrim : zombieTrim;
    const size = e.r * (e.type === "brute" ? 5.0 : e.type === "dog" ? 4.9 : e.type === "runner" ? 4.15 : 4.1);
    let healthY = s.y - e.r * 2.2 - 18;
    const ringColor = e.type === "brute" ? "rgba(181, 58, 38, 0.42)" : e.type === "dog" ? "rgba(210, 88, 58, 0.34)" : e.type === "runner" ? "rgba(143, 210, 127, 0.34)" : "rgba(230, 179, 74, 0.24)";
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = e.type === "brute" || e.type === "dog" ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + e.r * 0.66, e.r * 1.18, e.r * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + e.r * 0.62, e.r * 1.05, e.r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.sin(state.time * 8 + e.x) * 0.06);
    ctx.translate(0, bob);
    if (faceLeft) ctx.scale(-1, 1);
    if (image.complete && image.naturalWidth) {
      const source = trim || { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
      const aspect = source.h / source.w;
      const drawW = size;
      const drawH = size * aspect;
      healthY = s.y + bob - drawH * 0.72 - 18;
      ctx.drawImage(
        image,
        source.x,
        source.y,
        source.w,
        source.h,
        -drawW / 2,
        -drawH * 0.72,
        drawW,
        drawH,
      );
    } else {
      const body = e.type === "brute" ? "#5f7759" : e.type === "dog" ? "#6b5143" : e.type === "runner" ? "#7aa46f" : "#66865e";
      ctx.fillStyle = e.hit > 0 ? "#f1d98b" : body;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r * 0.86, e.r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(s.x - e.r, healthY, e.r * 2, 4);
    ctx.fillStyle = "#d64f42";
    ctx.fillRect(s.x - e.r, healthY, e.r * 2 * clamp(e.hp / e.maxHp, 0, 1), 4);
  }
}

function drawDropsAndShots() {
  for (const drop of state.drops) {
    const s = worldToScreen(drop);
    if (drop.coin > 0) {
      drawCoinDrop(s.x, s.y, drop.r * 1.05, drop.alpha);
      continue;
    }
    drawXpDrop(s.x, s.y, drop.r, drop.alpha, drop.hue);
  }
  for (const bullet of state.bullets) {
    const s = worldToScreen(bullet);
    const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
    const nx = bullet.vx / speed;
    const ny = bullet.vy / speed;
    const alpha = clamp(bullet.life / bullet.maxLife, 0, 1);
    const tail = 24;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255, 231, 142, 0.52)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.x - nx * tail, s.y - ny * tail);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(104, 220, 238, 0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x - nx * (tail * 0.72), s.y - ny * (tail * 0.72));
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    const glow = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, bullet.r * 2.8);
    glow.addColorStop(0, "rgba(255, 255, 255, 1)");
    glow.addColorStop(0.38, "rgba(255, 226, 112, 0.9)");
    glow.addColorStop(1, "rgba(104, 220, 238, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, bullet.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff7c7";
    ctx.beginPath();
    ctx.arc(s.x, s.y, bullet.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEffects() {
  for (const particle of state.particles) {
    const s = worldToScreen(particle);
    ctx.globalAlpha = clamp(particle.life * 2, 0, 1);
    ctx.fillStyle = particle.color;
    if (particle.type === "blood") {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.atan2(particle.vy, particle.vx) + particle.spin);
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.size * particle.stretch, particle.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(s.x, s.y, particle.size, particle.size);
    }
  }
  ctx.globalAlpha = 1;

  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const popup of state.popups) {
    const s = worldToScreen(popup);
    ctx.globalAlpha = clamp(popup.life * 1.4, 0, 1);
    ctx.fillStyle = popup.color;
    if (popup.text === "THANK YOU❤") {
      ctx.save();
      ctx.font = "900 42px system-ui, sans-serif";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(57, 18, 36, 0.88)";
      ctx.shadowColor = "rgba(255, 212, 234, 0.72)";
      ctx.shadowBlur = 14;
      ctx.strokeText(popup.text, s.x, s.y);
      ctx.fillText(popup.text, s.x, s.y);
      ctx.restore();
      continue;
    }
    ctx.fillText(popup.text, s.x, s.y);
  }
  ctx.globalAlpha = 1;
}

function drawAmbientEvent() {
  if (!state.ambient) return;
  const a = clamp(state.ambient.life / state.ambient.maxLife, 0, 1);
  const flash = Math.sin(state.time * 26) > 0.55 ? 1 : 0;
  ctx.save();
  ctx.globalAlpha = 0.1 * a + flash * 0.05 * a;
  ctx.fillStyle = state.ambient.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = clamp(a * 1.4, 0, 1);
  ctx.font = "900 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(247, 242, 231, 0.88)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.lineWidth = 4;
  ctx.strokeText(state.ambient.text, canvas.width / 2, 84);
  ctx.fillText(state.ambient.text, canvas.width / 2, 84);
  ctx.restore();
}

function drawCallout() {
  if (!state.callout) return;
  const fadeIn = clamp((state.callout.maxLife - state.callout.life) / 0.22, 0, 1);
  const fadeOut = clamp(state.callout.life / 0.45, 0, 1);
  const alpha = Math.min(fadeIn, fadeOut);
  const y = canvas.height * 0.34;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(8, 5, 4, 0.64)";
  ctx.fillRect(0, y - 66, canvas.width, 132);
  ctx.strokeStyle = "rgba(240, 207, 106, 0.54)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y - 66);
  ctx.lineTo(canvas.width, y - 66);
  ctx.moveTo(0, y + 66);
  ctx.lineTo(canvas.width, y + 66);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "900 54px system-ui, sans-serif";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.82)";
  ctx.fillStyle = "#f7f2e7";
  ctx.strokeText(state.callout.text, canvas.width / 2, y + 18);
  ctx.fillText(state.callout.text, canvas.width / 2, y + 18);
  ctx.restore();
}

function draw() {
  if (!state) return;
  const p = state.player;
  camera.x = clamp(p.x - canvas.width / 2, 0, world.w - canvas.width);
  camera.y = clamp(p.y - canvas.height / 2, 0, world.h - canvas.height);

  ctx.save();
  if (state.shake > 0) {
    ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
  }
  drawGround();
  drawTrainArrivalCue();
  drawVendingMachines();
  drawTrainDirectionArrow();
  drawPhonePickup();
  drawDropsAndShots();
  drawRescue();
  drawEnemies();
  drawGoro();
  drawNomurarchAlly();
  drawEffects();
  ctx.restore();
  drawAmbientEvent();
  drawCallout();

  if (state.mode === "paused") {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }
  if (key === "p") pauseGame();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("resize", fitOpeningText);

ui.startButton.addEventListener("click", playStartTransition);
ui.manualButton.addEventListener("click", startOpening);
ui.vendingBuyButton.addEventListener("click", buyVendingDrink);
ui.vendingCancelButton.addEventListener("click", closeVendingPrompt);
ui.openingPanel.addEventListener("click", handleOpeningPanelClick);
ui.openingReturnButton.addEventListener("click", (event) => {
  event.stopPropagation();
  showTitle();
});
ui.restartButton.addEventListener("click", showTitle);

showTitle();
requestAnimationFrame(loop);
