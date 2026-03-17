// Main menu screen — title, play, daily, variants, scores, stats, achievements.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawMainMenu(ctx, w, h, data, hits) {
  // Clear instead of solid fill so the background GIF shows through
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const btnW = Math.min(220, w * 0.6);
  const btnH = 40;
  const gap = 10;

  const titleSize = Math.max(32, Math.min(w * 0.08, 56));
  drawTitle(ctx, "SCOUNDREL", cx, h * 0.14, "#f0c040", titleSize);
  drawText(ctx, "A solo roguelike card game", cx, h * 0.14 + titleSize * 0.8, { color: "rgba(255,255,255,0.5)", size: 13 });

  let y = h * 0.28;

  hits.newGame = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.newGame, "New Game", "#4caf50", "#388e3c");
  y += btnH + gap;

  hits.variants = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.variants, "Variants", "#2a6496", "#1a3a5c");
  y += btnH + gap;

  // Daily challenge
  const dailyLabel = data.dailyPlayed ? "Daily (Played)" : "Daily Challenge";
  const dailyColor = data.dailyPlayed ? "#555" : "#8b5e3c";
  hits.daily = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.daily, dailyLabel, dailyColor, "#6b4e2c");
  y += btnH + gap;

  hits.enterSeed = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.enterSeed, "Enter Seed", "#555", "#777");
  y += btnH + gap;

  hits.highScores = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.highScores, "High Scores", "#444", "#666");
  y += btnH + gap;

  hits.stats = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.stats, "Statistics", "#444", "#666");
  y += btnH + gap;

  hits.achievements = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.achievements, "Achievements", "#444", "#666");
  y += btnH + gap;

  hits.settings = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.settings, "Settings", "#333", "#555");

  if (data.stats) {
    const s = data.stats;
    drawText(ctx, `${s.gamesPlayed} games | ${s.gamesWon} wins | Best: ${s.bestScore === -Infinity ? "—" : s.bestScore}`, cx, h * 0.95, { color: "rgba(255,255,255,0.3)", size: 11 });
  }
}
