// Replay playback screen with controls.

import { drawBackground, drawButton, centeredBtn, drawText } from "./ui-helpers.js";

export function drawReplayControls(ctx, w, h, data, hits) {
  // Draw controls overlay at bottom of screen during replay
  const barH = 50;
  const barY = h - barH;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, barY, w, barH);

  const cx = w / 2;
  const btnW = 60;
  const btnH = 32;
  const gap = 10;

  // Playback info
  drawText(ctx, `Move ${data.currentMove}/${data.totalMoves}`, cx, barY + 12, { color: "rgba(255,255,255,0.6)", size: 11 });

  const baseX = cx - (btnW * 3 + gap * 2) / 2;

  // Play/Pause
  hits.replayToggle = { x: baseX, y: barY + 18, width: btnW, height: btnH };
  drawButton(ctx, hits.replayToggle, data.paused ? "Play" : "Pause", "#4caf50", "#388e3c");

  // Step
  hits.replayStep = { x: baseX + btnW + gap, y: barY + 18, width: btnW, height: btnH };
  drawButton(ctx, hits.replayStep, "Step", "#2a6496", "#1a3a5c");

  // Speed
  const speedLabel = `${data.speed}x`;
  hits.replaySpeed = { x: baseX + (btnW + gap) * 2, y: barY + 18, width: btnW, height: btnH };
  drawButton(ctx, hits.replaySpeed, speedLabel, "#8b5e3c", "#6b4e2c");

  // Exit
  hits.replayExit = { x: w - 70, y: barY + 18, width: 60, height: btnH };
  drawButton(ctx, hits.replayExit, "Exit", "#8b3030", "#a04040");

  ctx.restore();
}
