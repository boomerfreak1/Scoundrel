// Stats screen — aggregate statistics display.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawStats(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  drawTitle(ctx, "Statistics", cx, h * 0.06, "#f0c040", Math.max(24, w * 0.045));

  const s = data.stats || {};
  if (!s.gamesPlayed) {
    drawText(ctx, "No games played yet.", cx, h * 0.35, { color: "rgba(255,255,255,0.4)", size: 16 });
    hits.back = centeredBtn(cx, h * 0.85, 160, 38);
    drawButton(ctx, hits.back, "Back", "#555", "#777");
    return;
  }

  const lineH = 22;
  const leftCol = cx - w * 0.2;
  const rightCol = cx + w * 0.2;
  let y = h * 0.13;
  const labelOpts = { color: "rgba(255,255,255,0.6)", size: 13, align: "left" };
  const valueOpts = { color: "#fff", size: 13, align: "right", bold: true };

  function row(label, value) {
    drawText(ctx, label, leftCol, y, labelOpts);
    drawText(ctx, String(value), rightCol, y, valueOpts);
    y += lineH;
  }

  // Win/Loss
  const winPct = s.gamesPlayed ? Math.round(s.winRate * 100) : 0;
  row("Games Played", s.gamesPlayed);
  row("Wins / Losses", `${s.gamesWon} / ${s.gamesLost} (${winPct}%)`);

  // Win rate bar
  const barX = leftCol;
  const barW = rightCol - leftCol;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(barX, y - 4, barW, 8);
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(barX, y - 4, barW * s.winRate, 8);
  y += lineH;

  // Streaks
  row("Current Win Streak", s.currentWinStreak);
  row("Longest Win Streak", s.longestWinStreak);
  row("Longest Loss Streak", s.longestLossStreak);
  y += 6;

  // Scores
  row("Best Score", s.bestScore === -Infinity ? "—" : s.bestScore);
  row("Worst Score", s.worstScore === Infinity ? "—" : s.worstScore);
  row("Average Score", s.averageScore.toFixed(1));
  y += 6;

  // Combat
  row("Monsters Slain", s.totalMonstersSlain);
  row("  Barehanded", s.monstersSlainBarehanded);
  row("  With Weapon", s.monstersSlainWithWeapon);
  row("Damage Taken", s.totalDamageTaken);
  row("Healing Done", s.totalHealingDone);
  row("Potions Wasted", s.totalPotionsWasted);
  row("Weapons Equipped", s.totalWeaponsEquipped);
  row("Rooms Avoided", s.totalRoomsAvoided);
  row("Avg Turns/Game", s.averageTurnsPerGame.toFixed(1));

  // Favorites
  if (s.mostDeadlyMonster) {
    y += 6;
    row("Most Deadly Monster", `${s.mostDeadlyMonster.cardId} (${s.mostDeadlyMonster.count} kills)`);
  }
  if (s.favoriteWeapon) {
    row("Favorite Weapon", `${s.favoriteWeapon.cardId} (${s.favoriteWeapon.count}x)`);
  }

  // Buttons
  const btnW = Math.min(160, w * 0.4);
  const btnH = 38;
  const btnY = Math.max(y + 20, h * 0.88);

  hits.back = centeredBtn(cx - btnW * 0.6, btnY, btnW, btnH);
  drawButton(ctx, hits.back, "Back", "#555", "#777");

  hits.clearStats = centeredBtn(cx + btnW * 0.6, btnY, btnW, btnH);
  drawButton(ctx, hits.clearStats, "Clear Stats", "#8b3030", "#a04040");
}
