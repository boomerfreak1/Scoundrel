// Shared UI drawing helpers for screen renderers.

import { getTheme } from "../themes.js";

export function drawBackground(ctx, w, h) {
  ctx.fillStyle = getTheme().feltColor;
  ctx.fillRect(0, 0, w, h);
}

export function drawButton(ctx, rect, label, bg = "#4caf50", border = "#388e3c", textColor = "#fff") {
  const r = 6;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.width - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r);
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - r, rect.y + rect.height);
  ctx.lineTo(rect.x + r, rect.y + rect.height);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const fontSize = Math.max(13, rect.height * 0.4);
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.restore();
}

export function centeredBtn(cx, y, w, h) {
  return { x: cx - w / 2, y, width: w, height: h };
}

export function drawTitle(ctx, text, x, y, color = "#f0c040", size = 36) {
  ctx.font = `bold ${size}px "Georgia", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

export function drawText(ctx, text, x, y, opts = {}) {
  const { color = "rgba(255,255,255,0.85)", size = 14, align = "center", bold = false } = opts;
  ctx.font = `${bold ? "bold " : ""}${size}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}
