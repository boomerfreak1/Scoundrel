// High score screen — top 10 display.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawHighScores(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  drawTitle(ctx, "High Scores", cx, h * 0.06, "#f0c040", Math.max(24, w * 0.045));

  const scores = data.scores || [];
  const startY = h * 0.13;
  const rowH = Math.min(32, (h * 0.65) / 10);
  const tableW = Math.min(w * 0.9, 400);
  const left = cx - tableW / 2;
  const fontSize = Math.max(11, rowH * 0.42);

  // Header
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textBaseline = "middle";
  const cols = [left + 30, left + tableW * 0.25, left + tableW * 0.5, left + tableW * 0.7, left + tableW * 0.9];
  ctx.textAlign = "center";
  const headY = startY;
  ctx.fillText("#", cols[0], headY);
  ctx.fillText("Score", cols[1], headY);
  ctx.fillText("Result", cols[2], headY);
  ctx.fillText("HP", cols[3], headY);
  ctx.fillText("Turns", cols[4], headY);

  // Rows
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const y = startY + (i + 1) * rowH;
    const isHighlighted = data.highlightSeed && s.seed === data.highlightSeed;

    ctx.font = `${isHighlighted ? "bold " : ""}${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = isHighlighted ? "#f0c040" : "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";

    ctx.fillText(`${i + 1}`, cols[0], y);
    ctx.fillText(`${s.score}`, cols[1], y);
    ctx.fillText(s.outcome === "won" ? "\u{1F451}" : "\u{1F480}", cols[2], y);
    ctx.fillText(`${Math.max(0, s.health)}`, cols[3], y);
    ctx.fillText(`${s.turns}`, cols[4], y);
  }

  if (scores.length === 0) {
    drawText(ctx, "No scores yet. Play a game!", cx, startY + rowH * 2, { color: "rgba(255,255,255,0.4)", size: 15 });
  }

  // Buttons
  const btnW = Math.min(160, w * 0.4);
  const btnH = 38;
  const btnY = h * 0.88;

  hits.back = centeredBtn(cx - btnW * 0.6, btnY, btnW, btnH);
  drawButton(ctx, hits.back, "Back", "#555", "#777");

  hits.clearScores = centeredBtn(cx + btnW * 0.6, btnY, btnW, btnH);
  drawButton(ctx, hits.clearScores, "Clear Scores", "#8b3030", "#a04040");
}
