// HUD renderer — health bar, turn info, buttons, mute, settings, game over overlay.
// Reads state only, never mutates game state.

import { canAvoidRoom } from "../logic/turn.js";
import { getScoreBreakdown } from "../logic/scoring.js";
import { getThemeId } from "./themes.js";
import { getBarBaseImage, getBarFillImage, getGearIcon, getSoundIcon, getXmarkIcon, getDotFilledImage, getDotEmptyImage } from "./card-images.js";

export function drawHUD(ctx, state, layout, visualState) {
  const { hud } = layout;

  ctx.save();
  ctx.restore();
  // Game over overlay removed — handled by screen system
}

export function drawHealthBar(ctx, state, layout, visualState) {
  const ws = layout.weaponSlot;
  const barW = Math.min(200, ws.width * 2.5);
  const barH = 24;
  const barX = ws.x + ws.width / 2 - barW / 2; // centered on weapon slot
  const barY = ws.y - barH - 10; // above weapon card, below the dots/avoid

  const maxHP = state.variantConfig?.maxHealth || 20;
  const displayHP = visualState.displayHealth ?? state.health;
  const healthPct = Math.max(0, displayHP) / maxHP;

  const baseImg = getBarBaseImage();
  const fillImg = getBarFillImage();

  ctx.save();

  if (baseImg && fillImg) {
    // Both images are 320x64, designed to overlay exactly.
    // 1) Draw base (wooden frame)
    ctx.drawImage(baseImg, barX, barY, barW, barH);

    // 2) Draw red fill on top, clipped to health %
    const fillW = barW * healthPct;
    if (fillW > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(barX, barY, fillW, barH);
      ctx.clip();
      ctx.drawImage(fillImg, barX, barY, barW, barH);
      ctx.restore();
    }
  } else {
    // Fallback: simple colored bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    let barColor = displayHP > 10 ? "#4caf50" : displayHP > 5 ? "#ff9800" : "#f44336";
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barW * healthPct, barH);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // HP text on top
  const fontSize = Math.max(11, barH * 0.5);
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(`${Math.max(0, Math.round(displayHP))} / ${maxHP}`, barX + barW / 2, barY + barH / 2);
  ctx.fillText(`${Math.max(0, Math.round(displayHP))} / ${maxHP}`, barX + barW / 2, barY + barH / 2);

  ctx.restore();
}

function drawTurnInfo(ctx, state, hud) {
  const fontSize = Math.max(11, hud.height * 0.35);
  const x = hud.x + hud.height * 0.5;
  const y = hud.y + hud.height / 2;
  ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`Turn ${state.turnCount + 1}`, x, y);
}

export function drawResolvedIndicator(ctx, state, centerX, y) {
  if (state.gameStatus !== "playing") return;
  const original = state.room.length + state.cardsResolvedThisTurn;
  const target = original >= 2 ? original - 1 : original;
  if (target === 0) return;

  const filledImg = getDotFilledImage();
  const emptyImg = getDotEmptyImage();
  const dotSize = 16;
  const gap = dotSize + 6;
  const totalW = target * gap - 6;
  const startX = centerX - totalW / 2;

  for (let i = 0; i < target; i++) {
    const dx = startX + i * gap;
    const dy = y - dotSize / 2;
    const img = i < state.cardsResolvedThisTurn ? emptyImg : filledImg;
    if (img) {
      ctx.drawImage(img, dx, dy, dotSize, dotSize);
    } else {
      // Fallback circles
      ctx.save();
      ctx.beginPath();
      ctx.arc(dx + dotSize / 2, y, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = i < state.cardsResolvedThisTurn ? "#4488ff" : "#cc3333";
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawButton(ctx, btn, label, bgColor, borderColor) {
  ctx.save();
  const r = 4;
  ctx.beginPath();
  ctx.moveTo(btn.x + r, btn.y);
  ctx.lineTo(btn.x + btn.width - r, btn.y);
  ctx.quadraticCurveTo(btn.x + btn.width, btn.y, btn.x + btn.width, btn.y + r);
  ctx.lineTo(btn.x + btn.width, btn.y + btn.height - r);
  ctx.quadraticCurveTo(btn.x + btn.width, btn.y + btn.height, btn.x + btn.width - r, btn.y + btn.height);
  ctx.lineTo(btn.x + r, btn.y + btn.height);
  ctx.quadraticCurveTo(btn.x, btn.y + btn.height, btn.x, btn.y + btn.height - r);
  ctx.lineTo(btn.x, btn.y + r);
  ctx.quadraticCurveTo(btn.x, btn.y, btn.x + r, btn.y);
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  const fontSize = Math.max(11, btn.height * 0.4);
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  ctx.restore();
}

export { drawMuteButton as drawMuteIcon, drawSettingsIcon as drawGearIcon };

function drawMuteButton(ctx, btn, isMuted) {
  const img = getSoundIcon();
  if (img) {
    ctx.save();
    if (isMuted) ctx.globalAlpha = 0.4;
    ctx.drawImage(img, btn.x, btn.y, btn.width, btn.height);
    ctx.restore();

    // Draw small X overlay when muted
    if (isMuted) {
      const xImg = getXmarkIcon();
      if (xImg) {
        const xSize = btn.width * 0.45;
        ctx.drawImage(xImg, btn.x + btn.width - xSize * 0.6, btn.y + btn.height - xSize * 0.6, xSize, xSize);
      }
    }
  } else {
    // Fallback text
    ctx.save();
    ctx.font = `${btn.height * 0.5}px serif`;
    ctx.fillStyle = isMuted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isMuted ? "\u{1F507}" : "\u{1F50A}", btn.x + btn.width / 2, btn.y + btn.height / 2);
    ctx.restore();
  }
}

function drawSettingsIcon(ctx, btn) {
  const img = getGearIcon();
  if (img) {
    ctx.drawImage(img, btn.x, btn.y, btn.width, btn.height);
  } else {
    // Fallback: simple text
    ctx.save();
    ctx.font = `${btn.height * 0.6}px serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u2699", btn.x + btn.width / 2, btn.y + btn.height / 2);
    ctx.restore();
  }
}

function drawGameOverOverlay(ctx, state, layout, visualState) {
  const w = layout.hud.width;
  const h = Math.max(layout.slainStack.y + layout.slainStack.height + layout.cardSize.height, 600);

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, w, h);

  const breakdown = getScoreBreakdown(state);
  const isWin = state.gameStatus === "won";

  const titleSize = Math.max(28, w * 0.05);
  ctx.font = `bold ${titleSize}px "Georgia", serif`;
  ctx.fillStyle = isWin ? "#f0c040" : "#f44336";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isWin ? "Victory!" : "Defeated", w / 2, h * 0.3);

  const detailSize = Math.max(14, w * 0.025);
  ctx.font = `${detailSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";

  let infoY = h * 0.38;
  const lineH = detailSize * 1.8;
  ctx.fillText(`Health: ${breakdown.health}`, w / 2, infoY);
  infoY += lineH;

  if (isWin && breakdown.potionBonus > 0) {
    ctx.fillText(`Potion Bonus: +${breakdown.potionBonus}`, w / 2, infoY);
    infoY += lineH;
  }
  if (!isWin && breakdown.remainingMonsters > 0) {
    ctx.fillText(`Remaining Monsters: -${breakdown.monsterValueSum}`, w / 2, infoY);
    infoY += lineH;
  }

  const scoreSize = Math.max(22, w * 0.04);
  ctx.font = `bold ${scoreSize}px "Georgia", serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${breakdown.finalScore}`, w / 2, h * 0.52);

  // New Game button
  drawButton(ctx, layout.newGameButton, "New Game", "#4caf50", "#388e3c");

  ctx.restore();
}

export function drawFloatingTexts(ctx, floats) {
  for (const f of floats) {
    const progress = f.elapsed / f.duration;
    const offsetY = -40 * progress;
    const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold 20px "Georgia", serif`;
    ctx.fillStyle = f.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(f.text, f.x, f.startY + offsetY);
    ctx.restore();
  }
}

export function drawSettingsPanel(ctx, layout, visualState) {
  const p = layout.settingsPanel;
  const r = 8;

  ctx.save();
  // Backdrop
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, layout.hud.width, 2000);

  // Panel
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.moveTo(p.x + r, p.y);
  ctx.lineTo(p.x + p.width - r, p.y);
  ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width, p.y + r);
  ctx.lineTo(p.x + p.width, p.y + p.height - r);
  ctx.quadraticCurveTo(p.x + p.width, p.y + p.height, p.x + p.width - r, p.y + p.height);
  ctx.lineTo(p.x + r, p.y + p.height);
  ctx.quadraticCurveTo(p.x, p.y + p.height, p.x, p.y + p.height - r);
  ctx.lineTo(p.x, p.y + r);
  ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.font = `bold 18px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Settings", p.x + p.width / 2, p.y + 28);

  // Mute toggle
  const row1Y = p.y + 65;
  ctx.font = `14px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "left";
  ctx.fillText("Sound", p.x + 20, row1Y);
  drawToggle(ctx, p.x + p.width - 70, row1Y - 10, !visualState.settings.muted);

  // Animation speed
  const row2Y = p.y + 110;
  ctx.fillText("Animation", p.x + 20, row2Y);
  const speeds = ["normal", "fast", "off"];
  const labels = ["Normal", "Fast", "Off"];
  const btnW = 55;
  const btnGap = 8;
  const startX = p.x + p.width - (btnW * 3 + btnGap * 2) - 15;
  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (btnW + btnGap);
    const isActive = visualState.settings.animationSpeed === speeds[i];
    ctx.fillStyle = isActive ? "#4caf50" : "#555";
    ctx.fillRect(bx, row2Y - 12, btnW, 24);
    ctx.font = `bold 11px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], bx + btnW / 2, row2Y);
  }
  // Store hit areas for input
  visualState._settingsSpeedBtns = speeds.map((s, i) => ({
    speed: s,
    x: startX + i * (btnW + btnGap),
    y: row2Y - 12,
    width: btnW,
    height: 24,
  }));
  visualState._settingsMuteToggle = { x: p.x + p.width - 70, y: row1Y - 10, width: 50, height: 20 };

  // Export/Import row
  const row3Y = p.y + 150;
  ctx.font = `14px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "left";
  ctx.fillText("Data", p.x + 20, row3Y);
  const expBtnW = 60;
  const expX = p.x + p.width - expBtnW * 2 - 22;
  ctx.fillStyle = "#2a6496";
  ctx.fillRect(expX, row3Y - 12, expBtnW, 24);
  ctx.fillStyle = "#8b5e3c";
  ctx.fillRect(expX + expBtnW + 8, row3Y - 12, expBtnW, 24);
  ctx.font = `bold 11px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("Export", expX + expBtnW / 2, row3Y);
  ctx.fillText("Import", expX + expBtnW + 8 + expBtnW / 2, row3Y);
  visualState._settingsExportBtn = { x: expX, y: row3Y - 12, width: expBtnW, height: 24 };
  visualState._settingsImportBtn = { x: expX + expBtnW + 8, y: row3Y - 12, width: expBtnW, height: 24 };

  // Theme row
  const row4Y = p.y + 190;
  ctx.font = `14px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "left";
  ctx.fillText("Theme", p.x + 20, row4Y);
  const themeBtnW = 100;
  const themeBtnX = p.x + p.width - themeBtnW - 15;
  ctx.fillStyle = "#555";
  ctx.fillRect(themeBtnX, row4Y - 12, themeBtnW, 24);
  ctx.font = `bold 11px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(getThemeId().charAt(0).toUpperCase() + getThemeId().slice(1), themeBtnX + themeBtnW / 2, row4Y);
  visualState._settingsThemeBtn = { x: themeBtnX, y: row4Y - 12, width: themeBtnW, height: 24 };

  // Close button
  const closeY = p.y + p.height - 40;
  const closeBtnW = 80;
  drawButton(ctx, { x: p.x + p.width / 2 - closeBtnW / 2, y: closeY, width: closeBtnW, height: 30 }, "Close", "#666", "#888");
  visualState._settingsCloseBtn = { x: p.x + p.width / 2 - closeBtnW / 2, y: closeY, width: closeBtnW, height: 30 };

  ctx.restore();
}

function drawToggle(ctx, x, y, isOn) {
  const w = 44;
  const h = 20;
  const r = h / 2;

  ctx.fillStyle = isOn ? "#4caf50" : "#666";
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(isOn ? x + w - r : x + r, y + r, r - 3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDamagePreview(ctx, card, layout, slotRect, state) {
  // Import damage calculation results passed as precomputed values
  if (!card || card.type !== "monster") return;

  const { canWeapon, weaponDmg, barehandedDmg } = state._preview;

  const lines = [];
  if (canWeapon) {
    lines.push(weaponDmg === 0 ? "0 damage (blocked)" : `${weaponDmg} damage (weapon)`);
    lines.push(`${barehandedDmg} damage (barehanded)`);
  } else if (state.equippedWeapon) {
    lines.push(`${barehandedDmg} damage (too strong for weapon)`);
  } else {
    lines.push(`${barehandedDmg} damage (barehanded)`);
  }

  const px = slotRect.x + slotRect.width / 2;
  const py = slotRect.y - 8;
  const fontSize = 12;
  const lineH = fontSize * 1.4;
  const padX = 10;
  const padY = 6;
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width || 100));
  const boxW = maxW + padX * 2;
  const boxH = lines.length * lineH + padY * 2;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(px - boxW / 2, py - boxH, boxW, boxH);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px - boxW / 2, py - boxH, boxW, boxH);

  ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], px, py - boxH + padY + i * lineH);
  }
  ctx.restore();
}
