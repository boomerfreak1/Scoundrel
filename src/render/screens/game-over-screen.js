// Enhanced game over screen — score breakdown, high score, achievements, run stats.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawGameOver(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  const isWin = data.breakdown.outcome === "won";
  const lineH = 22;
  let y = h * 0.08;

  // Title
  const titleSize = Math.max(32, Math.min(w * 0.08, 56));
  drawTitle(ctx, isWin ? "Victory!" : "Defeated", cx, y, isWin ? "#f0c040" : "#f44336", titleSize);
  y += 44;

  // Score breakdown
  drawText(ctx, `Health: ${data.breakdown.health}`, cx, y, { size: 15 });
  y += lineH;

  if (isWin && data.breakdown.potionBonus > 0) {
    drawText(ctx, `Potion Bonus: +${data.breakdown.potionBonus}`, cx, y, { color: "#4caf50", size: 15 });
    y += lineH;
  }
  if (!isWin && data.breakdown.monsterValueSum > 0) {
    drawText(ctx, `Remaining Monsters: -${data.breakdown.monsterValueSum}`, cx, y, { color: "#f44336", size: 15 });
    y += lineH;
  }

  // Final score
  y += 6;
  drawText(ctx, `Score: ${data.breakdown.finalScore}`, cx, y, { size: 24, bold: true, color: "#fff" });
  y += 32;

  // High score callout
  if (data.isHighScore) {
    drawText(ctx, `NEW HIGH SCORE! Rank #${data.rank}`, cx, y, { color: "#f0c040", size: 16, bold: true });
    y += lineH + 4;
  }

  // Run stats
  y += 8;
  const statColor = "rgba(255,255,255,0.6)";
  const statSize = 13;
  drawText(ctx, `Turns: ${data.entry.turns} | Monsters Slain: ${data.entry.monstersSlain}`, cx, y, { color: statColor, size: statSize });
  y += lineH;
  drawText(ctx, `Weapons Used: ${data.entry.weaponsUsed} | Rooms Avoided: ${data.entry.roomsAvoided}`, cx, y, { color: statColor, size: statSize });
  y += lineH;
  drawText(ctx, `Seed: ${data.entry.seed}`, cx, y, { color: "rgba(255,255,255,0.4)", size: 12 });
  y += lineH + 4;

  // Newly unlocked achievements
  if (data.newAchievements && data.newAchievements.length > 0) {
    y += 4;
    drawText(ctx, "Achievements Unlocked!", cx, y, { color: "#f0c040", size: 14, bold: true });
    y += lineH;
    for (const ach of data.newAchievements) {
      drawText(ctx, `${ach.name} — ${ach.desc}`, cx, y, { color: "#4caf50", size: 13 });
      y += lineH;
    }
  }

  // Buttons
  const btnW = Math.min(180, w * 0.45);
  const btnH = 40;
  const gap = 12;
  y = Math.max(y + 16, h * 0.72);

  hits.newGame = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.newGame, "New Game", "#4caf50", "#388e3c");
  y += btnH + gap;

  hits.highScores = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.highScores, "High Scores", "#8b5e3c", "#6b4e2c");
  y += btnH + gap;

  hits.menu = centeredBtn(cx, y, btnW, btnH);
  drawButton(ctx, hits.menu, "Main Menu", "#555", "#777");
}
