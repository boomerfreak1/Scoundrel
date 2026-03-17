// Card renderer — draws card images from Jorel's Card Pack.
// Falls back to programmatic rendering if images aren't loaded.
// Supports animation overrides: scaleX, scaleY, opacity, glow, shake.

import { getTheme } from "./themes.js";
import { getCardImage, getCardBackImage, areImagesLoaded } from "./card-images.js";

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r < 0) r = 0;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawCard(ctx, card, x, y, width, height, options = {}) {
  const {
    faceDown = false,
    highlighted = false,
    dimmed = false,
    selected = false,
    scaleX = 1,
    scaleY = 1,
    opacity = 1,
    glowColor = null,
    glowAlpha = 0,
    shakeAmount = 0,
  } = options;

  if (faceDown) {
    drawCardBack(ctx, x, y, width, height, { scaleX, scaleY, opacity, shakeAmount });
    return;
  }

  if (Math.abs(scaleX) < 0.02) return;

  ctx.save();

  // Opacity / dimmed
  if (opacity < 1 || dimmed) {
    ctx.globalAlpha = dimmed ? 0.5 * opacity : opacity;
  }

  // Shake offset
  let shakeX = 0;
  if (shakeAmount > 0) {
    shakeX = (Math.random() - 0.5) * shakeAmount * 2;
  }

  // Scale around center
  const cx = x + width / 2 + shakeX;
  const cy = y + height / 2;
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);
  }
  x += shakeX;

  // Selected: slight lift
  if (selected) y -= height * 0.05;

  const radius = Math.min(width * 0.06, 6);
  const img = getCardImage(card.id);

  // Shadow
  if (glowAlpha > 0 && glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * glowAlpha;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = selected ? 12 : 6;
    ctx.shadowOffsetY = selected ? 4 : 2;
  }

  if (img) {
    // Draw image with rounded corners via clipping
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill(); // invisible fill to cast shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    roundRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  } else {
    // Fallback: solid card body
    roundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = getTheme().cardBackground;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawFallbackCardContent(ctx, card, x, y, width, height);
  }

  // Highlight border
  if (highlighted) {
    roundRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = getTheme().highlightBorder;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawFallbackCardContent(ctx, card, x, y, width, height) {
  const SUIT_SYMBOLS = { clubs: "\u2663", spades: "\u2660", diamonds: "\u2666", hearts: "\u2665" };
  const RANK_DISPLAY = { 11: "J", 12: "Q", 13: "K", 14: "A" };
  const theme = getTheme();
  const colors = { monster: theme.monsterColors, weapon: theme.weaponColors, potion: theme.potionColors }[card.type];
  const rankLabel = RANK_DISPLAY[card.rank] || String(card.rank);
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  const cornerSize = Math.max(10, width * 0.22);
  ctx.font = `bold ${cornerSize}px "Georgia", serif`;
  ctx.fillStyle = colors.primary;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(rankLabel, x + width * 0.1, y + height * 0.06);

  const centerSize = Math.max(18, width * 0.45);
  ctx.font = `${centerSize}px serif`;
  ctx.fillStyle = colors.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(suitSymbol, x + width / 2, y + height * 0.48);
}

export function drawCardBack(ctx, x, y, width, height, options = {}) {
  const { scaleX = 1, scaleY = 1, opacity = 1, shakeAmount = 0 } = options;
  if (Math.abs(scaleX) < 0.02) return;

  const radius = Math.min(width * 0.06, 6);

  ctx.save();
  if (opacity < 1) ctx.globalAlpha = opacity;

  let shakeX = 0;
  if (shakeAmount > 0) shakeX = (Math.random() - 0.5) * shakeAmount * 2;

  const cx = x + width / 2 + shakeX;
  const cy = y + height / 2;
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);
  }
  x += shakeX;

  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  const backImg = getCardBackImage();

  if (backImg) {
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill(); // cast shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    roundRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(backImg, x, y, width, height);
    ctx.restore();
  } else {
    // Fallback: programmatic card back
    const theme = getTheme();
    roundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = theme.cardBackFill;
    ctx.fill();
    ctx.shadowColor = "transparent";

    roundRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = theme.cardBackBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    const inset = width * 0.08;
    roundRect(ctx, x + inset, y + inset, width - inset * 2, height - inset * 2, radius * 0.6);
    ctx.strokeStyle = theme.cardBackAccent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const ccx = x + width / 2;
    const ccy = y + height / 2;
    const dw = width * 0.15;
    const dh = height * 0.1;
    ctx.fillStyle = theme.cardBackAccent;
    ctx.beginPath();
    ctx.moveTo(ccx, ccy - dh);
    ctx.lineTo(ccx + dw, ccy);
    ctx.lineTo(ccx, ccy + dh);
    ctx.lineTo(ccx - dw, ccy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawPileIndicator(ctx, x, y, width, height, count) {
  if (count === 0) {
    const radius = Math.min(width * 0.06, 6);
    ctx.save();
    roundRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = "rgba(90,58,40,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  const layers = Math.min(count, 3);
  const offset = 2;
  for (let i = layers - 1; i >= 0; i--) {
    drawCardBack(ctx, x + i * offset, y - i * offset, width, height);
  }

  const badgeSize = Math.max(18, width * 0.28);
  const bx = x + width - badgeSize * 0.3;
  const by = y + height - badgeSize * 0.3;

  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, badgeSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = `bold ${badgeSize * 0.55}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), bx, by);
  ctx.restore();
}
