// Main game loop — screen management, persistence, undo, replay, animation, audio.

import { getCardRegistry } from "./logic/state.js";
import { processCommand } from "./logic/commands.js";
import { getScoreBreakdown } from "./logic/scoring.js";
import { getDailySeed, getTodayDateStr } from "./logic/daily.js";
import { VARIANTS } from "./logic/variants.js";
import { calculateLayout } from "./render/layout.js";
import { render as renderBoard } from "./render/board-renderer.js";
import { drawSettingsPanel } from "./render/hud-renderer.js";
import { setupInputHandler } from "./input/input-handler.js";
import { createAnimator, queueTransitions } from "./render/animation.js";
import { loadCardImages } from "./render/card-images.js";
import { createParticleSystem } from "./render/particles.js";
import { createAudioManager } from "./audio/audio-manager.js";
import { setTheme, getThemeId, getThemeList } from "./render/themes.js";
import { LocalStorageAdapter } from "./persist/storage-adapter.js";
import { createHighScoreManager } from "./persist/high-scores.js";
import { createStatsManager } from "./persist/stats.js";
import { createAchievementManager } from "./persist/achievements.js";
import { createDailyManager } from "./persist/daily.js";
import { createReplayManager } from "./persist/replay.js";
import { drawMainMenu } from "./render/screens/main-menu-screen.js";
import { drawGameOver } from "./render/screens/game-over-screen.js";
import { drawHighScores } from "./render/screens/high-score-screen.js";
import { drawStats } from "./render/screens/stats-screen.js";
import { drawAchievements } from "./render/screens/achievements-screen.js";
import { drawDaily } from "./render/screens/daily-screen.js";
import { drawVariantSelect } from "./render/screens/variant-select-screen.js";
import { drawReplayControls } from "./render/screens/replay-screen.js";
import { drawTutorial } from "./render/screens/tutorial-screen.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// --- Persistence ---
const storage = new LocalStorageAdapter();
const highScores = createHighScoreManager(storage);
const statsManager = createStatsManager(storage);
const achievementManager = createAchievementManager(storage);
const dailyManager = createDailyManager(storage);
const replayManager = createReplayManager(storage);

// --- Core state ---
let currentState = null;
let cardRegistry = null;
let layout = null;
let lastTime = 0;
let gameLog = [];
let commandLog = [];
let tutorialPage = 0;
let currentScreen = "menu";
let gameOverData = null;
let isDailyGame = false;
let selectedVariant = "classic";

// Undo
const stateHistory = [];
const MAX_UNDO = 10;

// Replay
let replayData = null;  // { commands, currentIdx, paused, speed, timer }

const animator = createAnimator();
const particles = createParticleSystem();
const audio = createAudioManager();

// Load persisted settings
const savedTheme = storage.load("settings_theme");
if (savedTheme) setTheme(savedTheme);

const visualState = {
  showBarehandedChoice: null,
  weaponButtonRect: null,
  barehandedButtonRect: null,
  displayHealth: 20,
  hoverCardIndex: null,
  settings: {
    muted: storage.load("settings_muted") ?? false,
    animationSpeed: storage.load("settings_animSpeed") || "normal",
    showPanel: false,
  },
  screenHits: {},
  _settingsSpeedBtns: null,
  _settingsMuteToggle: null,
  _settingsCloseBtn: null,
  _settingsExportBtn: null,
  _settingsImportBtn: null,
};

if (visualState.settings.muted) audio.setMuted(true);

// --- Canvas ---
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout = calculateLayout(window.innerWidth, window.innerHeight);
}

function getSpeedMultiplier() {
  switch (visualState.settings.animationSpeed) {
    case "fast": return 2;
    case "off": return Infinity;
    default: return 1;
  }
}

// --- Game lifecycle ---
function startGame(seed, variantId = "classic", daily = false) {
  const payload = { variantId };
  if (seed != null) payload.seed = Number(seed);
  const { state } = processCommand(null, { type: "NEW_GAME", payload });
  currentState = state;
  cardRegistry = getCardRegistry(currentState);
  gameLog = [];
  commandLog = [];
  stateHistory.length = 0;
  isDailyGame = daily;
  visualState.displayHealth = state.variantConfig?.startingHealth || 20;
  visualState.showBarehandedChoice = null;
  animator.clear();
  currentScreen = "playing";

  const speed = getSpeedMultiplier();
  if (speed !== Infinity) {
    queueTransitions(animator, { room: [], dungeon: [], discard: [], slainByWeapon: [], equippedWeapon: null }, currentState, [{ type: "NEW_GAME", seed: currentState.seed }], layout, cardRegistry, audio, speed);
  }
}

function onGameEnd() {
  const breakdown = getScoreBreakdown(currentState);
  const entry = computeScoreEntry(currentState, gameLog, breakdown);

  const isHighScore = highScores.isHighScore(entry.score);
  const rank = highScores.getRank(entry.score);

  highScores.recordScore(entry);
  const stats = statsManager.recordGame(entry, gameLog);
  const newAchievements = achievementManager.checkGame(entry, gameLog, stats);

  // Save replay
  replayManager.saveReplay(currentState.seed, commandLog, currentState.variantId || "classic");

  // Daily
  if (isDailyGame) {
    dailyManager.recordDaily(getTodayDateStr(), currentState.seed, entry);
  }

  gameOverData = { entry, breakdown, isHighScore, rank, newAchievements, stats };
  currentScreen = "game_over";
}

function computeScoreEntry(state, log, breakdown) {
  return {
    score: state.score,
    outcome: state.gameStatus,
    health: state.health,
    turns: state.turnCount + 1,
    seed: state.seed,
    variantId: state.variantId || "classic",
    date: new Date().toISOString(),
    potionBonus: breakdown.potionBonus,
    monstersSlain: log.filter((e) => e.type === "MONSTER_SLAIN").length,
    monstersSlainBarehanded: log.filter((e) => e.type === "MONSTER_SLAIN" && !e.withWeapon).length,
    monstersSlainWithWeapon: log.filter((e) => e.type === "MONSTER_SLAIN" && e.withWeapon).length,
    weaponsUsed: log.filter((e) => e.type === "WEAPON_EQUIPPED").length,
    roomsAvoided: log.filter((e) => e.type === "ROOM_AVOIDED").length,
    totalDamageTaken: log.filter((e) => e.type === "DAMAGE_TAKEN").reduce((s, e) => s + (e.amount || 0), 0),
    totalHealingDone: log.filter((e) => e.type === "HEALED").reduce((s, e) => s + (e.amount || 0), 0),
    potionsWasted: log.filter((e) => e.type === "POTION_WASTED").length,
  };
}

// --- Undo ---
function pushUndo() {
  if (isDailyGame) return; // No undo in daily
  stateHistory.push(JSON.stringify(currentState));
  if (stateHistory.length > MAX_UNDO) stateHistory.shift();
}

function performUndo() {
  if (stateHistory.length === 0 || isDailyGame) return;
  const prev = JSON.parse(stateHistory.pop());
  currentState = prev;
  animator.clear();
  visualState.displayHealth = currentState.health;
  visualState.showBarehandedChoice = null;
  // Remove last command from log
  commandLog.pop();
  audio.play("buttonClick");
}

// --- Command handling ---
function handleCommand(command) {
  if (animator.isPlaying() && command.type !== "NEW_GAME") return;
  if (currentScreen === "replay") return;

  const prevState = currentState;

  // Save undo state before command (not for NEW_GAME)
  if (command.type !== "NEW_GAME" && currentState) {
    pushUndo();
  }

  const result = processCommand(currentState, command);

  if (result.result.success) {
    currentState = result.state;
    gameLog.push(...result.result.events);
    commandLog.push({ type: command.type, payload: command.payload });

    visualState.showBarehandedChoice = null;
    visualState.weaponButtonRect = null;
    visualState.barehandedButtonRect = null;
    visualState.hoverCardIndex = null;

    if (command.type === "NEW_GAME") {
      cardRegistry = getCardRegistry(currentState);
      animator.clear();
      gameLog = [...result.result.events];
      commandLog = [];
      stateHistory.length = 0;
      visualState.displayHealth = currentState.variantConfig?.startingHealth || 20;
    }

    const speed = getSpeedMultiplier();
    if (speed !== Infinity && prevState) {
      queueTransitions(animator, prevState, currentState, result.result.events, layout, cardRegistry, audio, speed);
      emitParticles(result.result.events, prevState);
    } else if (speed === Infinity) {
      playSoundsImmediate(result.result.events);
    }

    if (command.type === "NEW_GAME" && speed !== Infinity) {
      queueTransitions(animator, { room: [], dungeon: [], discard: [], slainByWeapon: [], equippedWeapon: null }, currentState, [{ type: "NEW_GAME", seed: currentState.seed }], layout, cardRegistry, audio, speed);
    }

    if (currentState.gameStatus !== "playing" && prevState && prevState.gameStatus === "playing") {
      const checkEnd = () => {
        if (animator.isPlaying()) { setTimeout(checkEnd, 50); }
        else { onGameEnd(); }
      };
      if (speed === Infinity) onGameEnd();
      else setTimeout(checkEnd, 100);
    }
  } else {
    // Command failed — remove the undo entry we just pushed
    if (command.type !== "NEW_GAME") stateHistory.pop();
  }
}

function emitParticles(events, prevState) {
  for (const event of events) {
    if (event.type === "HEALED" && event.amount > 0) {
      const slot = findPrevRoomSlot(event.cardId, prevState);
      if (slot) particles.emit(slot.x + slot.width / 2, slot.y + slot.height / 2, { count: 10, color: "#4caf50", speed: 100, lifetime: 600, gravity: 40, spread: Math.PI });
    }
    if (event.type === "MONSTER_SLAIN" && !event.withWeapon) {
      const slot = findPrevRoomSlot(event.cardId, prevState);
      if (slot) particles.emit(slot.x + slot.width / 2, slot.y + slot.height / 2, { count: 8, color: "#f44336", speed: 120, lifetime: 400, gravity: 50, spread: Math.PI * 2 });
    }
  }
}

function playSoundsImmediate(events) {
  for (const ev of events) {
    if (ev.type === "WEAPON_EQUIPPED") audio.play("weaponEquip");
    if (ev.type === "MONSTER_SLAIN") audio.play("combatHit");
    if (ev.type === "HEALED") audio.play("potionDrink");
    if (ev.type === "POTION_WASTED") audio.play("potionWaste");
    if (ev.type === "ROOM_AVOIDED") audio.play("roomAvoid");
    if (ev.type === "GAME_WON") audio.play("gameWin");
    if (ev.type === "GAME_LOST") audio.play("gameLoss");
  }
}

function findPrevRoomSlot(cardId, prevState) {
  const idx = prevState.room.indexOf(cardId);
  return idx >= 0 ? layout.room[idx] : null;
}

// --- Replay ---
function startReplay(seed) {
  const data = replayManager.getReplay(seed);
  if (!data) return;

  const variantId = data.variantId || "classic";
  const payload = { seed: data.seed, variantId };
  const { state } = processCommand(null, { type: "NEW_GAME", payload });
  currentState = state;
  cardRegistry = getCardRegistry(currentState);
  animator.clear();
  visualState.displayHealth = currentState.variantConfig?.startingHealth || 20;

  replayData = { commands: data.commands, currentIdx: 0, paused: true, speed: 1, timer: 0 };
  currentScreen = "replay";

  const speed = getSpeedMultiplier();
  if (speed !== Infinity) {
    queueTransitions(animator, { room: [], dungeon: [], discard: [], slainByWeapon: [], equippedWeapon: null }, currentState, [{ type: "NEW_GAME", seed }], layout, cardRegistry, audio, speed);
  }
}

function advanceReplay() {
  if (!replayData || replayData.currentIdx >= replayData.commands.length) return;
  if (animator.isPlaying()) return;

  const cmd = replayData.commands[replayData.currentIdx];
  const prevState = currentState;
  const result = processCommand(currentState, cmd);
  if (result.result.success) {
    currentState = result.state;
    const speed = getSpeedMultiplier();
    if (speed !== Infinity) {
      queueTransitions(animator, prevState, currentState, result.result.events, layout, cardRegistry, audio, speed);
      emitParticles(result.result.events, prevState);
    }
  }
  replayData.currentIdx++;
  if (replayData.currentIdx >= replayData.commands.length) {
    replayData.paused = true;
  }
}

// --- Screen navigation ---
function navigateTo(screen) {
  currentScreen = screen;
  visualState.screenHits = {};
  if (screen !== "replay") replayData = null;
}

function handleScreenAction(action) {
  audio.play("buttonClick");
  switch (action) {
    case "newGame":
      startGame(null, selectedVariant);
      break;
    case "enterSeed": {
      const seed = window.prompt("Enter seed number:");
      if (seed && !isNaN(seed)) startGame(seed, selectedVariant);
      break;
    }
    case "menu":
      navigateTo("menu");
      break;
    case "menuReturn":
      if (currentState && currentState.gameStatus === "playing") {
        if (confirm("Return to menu? Current game will be lost.")) navigateTo("menu");
      } else {
        navigateTo("menu");
      }
      break;
    case "highScores":
      navigateTo("high_scores");
      break;
    case "stats":
      navigateTo("stats");
      break;
    case "achievements":
      navigateTo("achievements");
      break;
    case "daily":
      navigateTo("daily");
      break;
    case "variants":
      navigateTo("variant_select");
      break;
    case "dailyPlay": {
      const dateStr = getTodayDateStr();
      if (!dailyManager.hasPlayedToday(dateStr)) {
        startGame(getDailySeed(dateStr), "classic", true);
      }
      break;
    }
    case "dailyShare": {
      const d = dailyManager.getDailyResult(getTodayDateStr());
      if (d) {
        const text = `Scoundrel Daily - ${d.date}\nScore: ${d.score} | ${d.outcome === "won" ? "Won" : "Lost"}`;
        navigator.clipboard?.writeText(text);
        alert("Copied to clipboard!");
      }
      break;
    }
    case "selectVariant": {
      const vs = visualState.screenHits;
      // selectedVariant is updated by input handler
      break;
    }
    case "startVariant":
      startGame(null, selectedVariant);
      break;
    case "settings":
      visualState.settings.showPanel = true;
      break;
    case "tutorial":
      tutorialPage = 0;
      navigateTo("tutorial");
      break;
    case "tutorialNext":
      tutorialPage++;
      break;
    case "tutorialPrev":
      if (tutorialPage > 0) tutorialPage--;
      break;
    case "clearScores":
      if (confirm("Clear all high scores?")) highScores.clear();
      break;
    case "clearStats":
      if (confirm("Clear all statistics?")) statsManager.clear();
      break;
    case "exportData": {
      const blob = JSON.stringify(storage.exportAll(), null, 2);
      navigator.clipboard?.writeText(blob).then(() => alert("Data copied to clipboard!"));
      break;
    }
    case "importData": {
      const json = window.prompt("Paste exported JSON data:");
      if (json) {
        try { storage.importAll(JSON.parse(json)); alert("Data imported!"); }
        catch (e) { alert("Invalid JSON data."); }
      }
      break;
    }
    case "undo":
      performUndo();
      break;
    case "replay": {
      const seed = gameOverData?.entry?.seed;
      if (seed && replayManager.hasReplay(seed)) startReplay(seed);
      break;
    }
    case "replayToggle":
      if (replayData) replayData.paused = !replayData.paused;
      break;
    case "replayStep":
      if (replayData) { replayData.paused = true; advanceReplay(); }
      break;
    case "replaySpeed":
      if (replayData) replayData.speed = replayData.speed >= 4 ? 1 : replayData.speed * 2;
      break;
    case "replayExit":
      navigateTo("menu");
      break;
    case "themeChange": {
      const themes = getThemeList();
      const idx = themes.findIndex((t) => t.id === getThemeId());
      const next = themes[(idx + 1) % themes.length];
      setTheme(next.id);
      storage.save("settings_theme", next.id);
      break;
    }
  }
}

function persistSettings() {
  storage.save("settings_muted", visualState.settings.muted);
  storage.save("settings_animSpeed", visualState.settings.animationSpeed);
  audio.setMuted(visualState.settings.muted);
}

// --- Render loop ---
function gameLoop(timestamp) {
  const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
  lastTime = timestamp;
  const speed = getSpeedMultiplier();
  const w = window.innerWidth;
  const h = window.innerHeight;

  persistSettings();

  if ((currentScreen === "playing" || currentScreen === "replay") && currentState) {
    if (speed !== Infinity) {
      animator.update(dt * speed);
      particles.update(dt);
    }
    const maxHP = currentState.variantConfig?.startingHealth || 20;
    const targetHP = currentState.health;
    const diff = targetHP - visualState.displayHealth;
    if (Math.abs(diff) > 0.1) visualState.displayHealth += diff * 0.12;
    else visualState.displayHealth = targetHP;

    renderBoard(ctx, currentState, cardRegistry, layout, visualState, animator, particles);

    // Menu button overlay during gameplay
    if (currentScreen === "playing") {
      drawMenuButton(ctx, layout);
    }

    // Replay controls overlay
    if (currentScreen === "replay" && replayData) {
      const replayHits = {};
      drawReplayControls(ctx, w, h, {
        currentMove: replayData.currentIdx,
        totalMoves: replayData.commands.length,
        paused: replayData.paused,
        speed: replayData.speed,
      }, replayHits);
      visualState.screenHits = replayHits;

      // Auto-advance replay
      if (!replayData.paused) {
        replayData.timer += dt * replayData.speed;
        const interval = speed === Infinity ? 100 : 800 / replayData.speed;
        if (replayData.timer >= interval) {
          replayData.timer = 0;
          advanceReplay();
        }
      }
    }
  } else {
    const hits = {};
    switch (currentScreen) {
      case "menu": {
        const todayStr = getTodayDateStr();
        drawMainMenu(ctx, w, h, {
          stats: statsManager.getStats(),
          dailyPlayed: dailyManager.hasPlayedToday(todayStr),
        }, hits);
        break;
      }
      case "game_over":
        drawGameOver(ctx, w, h, gameOverData || {}, hits);
        if (gameOverData?.entry?.seed && replayManager.hasReplay(gameOverData.entry.seed)) {
          hits.replay = { x: w / 2 - 90, y: (hits.menu?.y || h * 0.85) + 52, width: 180, height: 40 };
          drawReplayBtn(ctx, hits.replay);
        }
        break;
      case "high_scores":
        drawHighScores(ctx, w, h, { scores: highScores.getTopScores(), highlightSeed: gameOverData?.entry?.seed }, hits);
        break;
      case "stats":
        drawStats(ctx, w, h, { stats: statsManager.getStats() }, hits);
        break;
      case "achievements": {
        const stats = statsManager.getStats();
        drawAchievements(ctx, w, h, { achievements: achievementManager.getAchievements(), progress: achievementManager.getProgress(stats) }, hits);
        break;
      }
      case "daily": {
        const ds = getTodayDateStr();
        drawDaily(ctx, w, h, {
          dateStr: ds,
          seed: getDailySeed(ds),
          played: dailyManager.hasPlayedToday(ds),
          result: dailyManager.getDailyResult(ds),
          streak: dailyManager.getStreak(),
          history: dailyManager.getHistory(),
        }, hits);
        break;
      }
      case "variant_select":
        drawVariantSelect(ctx, w, h, { variants: VARIANTS, selectedVariant }, hits);
        break;
      case "tutorial":
        drawTutorial(ctx, w, h, { page: tutorialPage }, hits);
        break;
    }
    visualState.screenHits = hits;
  }

  if (visualState.settings.showPanel) {
    drawSettingsPanel(ctx, layout, visualState);
  }

  requestAnimationFrame(gameLoop);
}

function drawMenuButton(ctx, layout) {
  const hud = layout.hud;
  const btnW = 50;
  const btnH = hud.height * 0.55;
  const x = hud.x + hud.width / 2 - btnW / 2;
  const y = hud.y + (hud.height - btnH) / 2;

  ctx.save();
  ctx.fillStyle = "rgba(100,100,100,0.5)";
  ctx.fillRect(x, y, btnW, btnH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, btnW, btnH);
  ctx.font = `bold ${Math.max(9, btnH * 0.4)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Menu", x + btnW / 2, y + btnH / 2);
  ctx.restore();

  visualState._menuButton = { x, y, width: btnW, height: btnH };
}

// Can't use dynamic import in render loop - inline simple replay button
function drawReplayBtn(ctx, rect) {
  ctx.save();
  ctx.fillStyle = "#2a6496";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeStyle = "#1a3a5c";
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.font = `bold 14px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Watch Replay", rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.restore();
}

// --- Initialize ---
resizeCanvas();
loadCardImages().then(() => console.log("Card images loaded"));

setupInputHandler(
  canvas,
  () => currentState,
  () => layout,
  () => cardRegistry,
  handleCommand,
  () => visualState,
  () => animator,
  () => audio,
  () => currentScreen,
  handleScreenAction,
  { getSelectedVariant: () => selectedVariant, setSelectedVariant: (v) => { selectedVariant = v; } }
);

window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(gameLoop);
