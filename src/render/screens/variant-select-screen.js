// Variant selection screen.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawVariantSelect(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  drawTitle(ctx, "Game Variants", cx, h * 0.08, "#f0c040", Math.max(24, w * 0.045));

  const variants = data.variants || [];
  const selected = data.selectedVariant || "classic";
  const cardW = Math.min(w * 0.85, 400);
  const cardH = 60;
  const gap = 8;
  const startX = cx - cardW / 2;
  let y = h * 0.15;

  hits.variantCards = [];

  for (const v of variants) {
    const isSelected = v.id === selected;
    const rect = { x: startX, y, width: cardW, height: cardH };
    hits.variantCards.push({ rect, variantId: v.id });

    ctx.fillStyle = isSelected ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = isSelected ? "#4caf50" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Radio circle
    const radioX = startX + 24;
    const radioY = y + cardH / 2;
    ctx.beginPath();
    ctx.arc(radioX, radioY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? "#4caf50" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(radioX, radioY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#4caf50";
      ctx.fill();
    }

    ctx.textAlign = "left";
    ctx.font = `bold 14px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = isSelected ? "#fff" : "rgba(255,255,255,0.7)";
    ctx.textBaseline = "middle";
    ctx.fillText(v.name, startX + 44, y + 20);

    ctx.font = `12px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(v.description, startX + 44, y + 42);

    y += cardH + gap;
  }

  // Buttons
  const btnW = Math.min(180, w * 0.45);
  const btnH = 42;
  const btnY = Math.max(y + 16, h * 0.82);

  hits.startVariant = centeredBtn(cx, btnY, btnW, btnH);
  drawButton(ctx, hits.startVariant, "Start Game", "#4caf50", "#388e3c");

  hits.back = centeredBtn(cx, btnY + btnH + 12, btnW, btnH);
  drawButton(ctx, hits.back, "Back", "#555", "#777");
}
