// Achievements screen — grid of unlocked/locked achievements.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawAchievements(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  drawTitle(ctx, "Achievements", cx, h * 0.06, "#f0c040", Math.max(24, w * 0.045));

  const achievements = data.achievements || [];
  const progress = data.progress || {};

  const cols = w < 500 ? 1 : 2;
  const cardW = cols === 1 ? Math.min(w * 0.88, 360) : Math.min(w * 0.42, 260);
  const cardH = 56;
  const gap = 10;
  const startX = cols === 1 ? cx - cardW / 2 : cx - cardW - gap / 2;
  let startY = h * 0.12;

  for (let i = 0; i < achievements.length; i++) {
    const ach = achievements[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    // Card background
    ctx.fillStyle = ach.unlocked ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = ach.unlocked ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cardW, cardH);

    // Icon circle
    const iconR = 16;
    const iconX = x + 24;
    const iconY = y + cardH / 2;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
    ctx.fillStyle = ach.unlocked ? "#4caf50" : "#444";
    ctx.fill();

    // Checkmark or lock
    ctx.font = `bold 16px serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ach.unlocked ? "\u2713" : "?", iconX, iconY);

    // Name and description
    const textX = x + 50;
    ctx.textAlign = "left";
    ctx.font = `bold 13px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = ach.unlocked ? "#fff" : "rgba(255,255,255,0.5)";
    ctx.fillText(ach.name, textX, y + 18);

    ctx.font = `11px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = ach.unlocked ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)";
    ctx.fillText(ach.desc, textX, y + 35);

    // Progress for cumulative achievements
    const prog = progress[ach.id];
    if (prog && !ach.unlocked) {
      ctx.font = `10px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "right";
      ctx.fillText(`${prog.current}/${prog.target}`, x + cardW - 10, y + cardH / 2);
    }

    // Date unlocked
    if (ach.unlocked && ach.date) {
      ctx.font = `9px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "right";
      ctx.fillText(ach.date.slice(0, 10), x + cardW - 10, y + cardH - 10);
    }
  }

  // Back button
  const btnY = Math.max(startY + Math.ceil(achievements.length / cols) * (cardH + gap) + 20, h * 0.88);
  hits.back = centeredBtn(cx, btnY, 160, 38);
  drawButton(ctx, hits.back, "Back", "#555", "#777");
}
