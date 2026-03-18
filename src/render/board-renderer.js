// Board renderer — orchestrates drawing the full game board from state.
// Read-only: never mutates game state. Integrates animation system.

import { drawCard, drawPileIndicator } from "./card-renderer.js";
import { drawHUD, drawHealthBar, drawResolvedIndicator, drawFloatingTexts, drawSettingsPanel, drawDamagePreview, drawMuteIcon, drawGearIcon } from "./hud-renderer.js";
import { typeFromId, rankFromId, getRankName } from "../logic/card.js";
import { canAvoidRoom } from "../logic/turn.js";
import { getTheme } from "./themes.js";
import { getBannerImage, getLabelBannerImage } from "./card-images.js";

// --- 9-slice banner ---
// Banner.png (448x448) — 3x3 grid. All pieces 128x128, placed at
// positions (0,160,320) with 32px gaps between them.
const P = 128, GAP = 32;
const NS = {
  tl: [0,       0,       P, P],  tc: [P+GAP,     0,       P, P],  tr: [2*(P+GAP), 0,       P, P],
  ml: [0,       P+GAP,   P, P],  mc: [P+GAP,     P+GAP,   P, P],  mr: [2*(P+GAP), P+GAP,   P, P],
  bl: [0,       2*(P+GAP), P, P], bc: [P+GAP,     2*(P+GAP), P, P], br: [2*(P+GAP), 2*(P+GAP), P, P],
};

export function drawNineSlice(ctx, img, x, y, w, h, borderSize) {
  const bs = borderSize;
  const innerW = w - bs * 2;
  const innerH = h - bs * 2;

  // Disable smoothing for crisp pixel art scaling
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  // 4 corners
  ctx.drawImage(img, ...NS.tl, x, y, bs, bs);
  ctx.drawImage(img, ...NS.tr, x + w - bs, y, bs, bs);
  ctx.drawImage(img, ...NS.bl, x, y + h - bs, bs, bs);
  ctx.drawImage(img, ...NS.br, x + w - bs, y + h - bs, bs, bs);

  // 4 edges (scaled to fill, no tiling — crisp with smoothing off)
  if (innerW > 0) {
    ctx.drawImage(img, ...NS.tc, x + bs, y, innerW, bs);
    ctx.drawImage(img, ...NS.bc, x + bs, y + h - bs, innerW, bs);
  }
  if (innerH > 0) {
    ctx.drawImage(img, ...NS.ml, x, y + bs, bs, innerH);
    ctx.drawImage(img, ...NS.mr, x + w - bs, y + bs, bs, innerH);
  }

  // Center (scaled to fill)
  if (innerW > 0 && innerH > 0) {
    ctx.drawImage(img, ...NS.mc, x + bs, y + bs, innerW, innerH);
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
}

// --- Pixel art icons drawn procedurally ---

function drawSwordIcon(ctx, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.strokeStyle = "#8ab4f8";
  ctx.fillStyle = "#8ab4f8";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  // Blade
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.5);
  ctx.lineTo(cx, cy + s * 0.25);
  ctx.stroke();
  // Tip
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.08, cy - s * 0.42);
  ctx.lineTo(cx, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.42);
  ctx.fill();
  // Crossguard
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.25, cy + s * 0.15);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.15);
  ctx.stroke();
  // Handle
  ctx.strokeStyle = "#c4956a";
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.25);
  ctx.lineTo(cx, cy + s * 0.5);
  ctx.stroke();
  // Pommel
  ctx.fillStyle = "#c4956a";
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.55, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPotionIcon(ctx, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.strokeStyle = "#66bb6a";
  ctx.fillStyle = "#66bb6a";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  // Bottle body (rounded bottom)
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.18, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.22, cy + s * 0.2);
  ctx.quadraticCurveTo(cx - s * 0.22, cy + s * 0.45, cx, cy + s * 0.48);
  ctx.quadraticCurveTo(cx + s * 0.22, cy + s * 0.45, cx + s * 0.22, cy + s * 0.2);
  ctx.lineTo(cx + s * 0.18, cy - s * 0.05);
  ctx.closePath();
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  // Neck
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.1, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.05);
  ctx.stroke();
  // Cork
  ctx.fillStyle = "#c4956a";
  ctx.fillRect(cx - s * 0.12, cy - s * 0.42, s * 0.24, s * 0.13);
  // Bubbles
  ctx.fillStyle = "#a5d6a7";
  ctx.beginPath();
  ctx.arc(cx - s * 0.06, cy + s * 0.15, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.08, cy + s * 0.28, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkullIcon(ctx, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.strokeStyle = "#ef5350";
  ctx.fillStyle = "#ef5350";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  // Skull top (circle)
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.08, s * 0.28, Math.PI, 0);
  ctx.stroke();
  // Sides down to jaw
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy - s * 0.08);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.18);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.28, cy - s * 0.08);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.18);
  ctx.lineTo(cx + s * 0.12, cy + s * 0.25);
  ctx.stroke();
  // Jaw
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.12, cy + s * 0.25);
  ctx.stroke();
  // Eyes
  ctx.fillStyle = "#ef5350";
  ctx.beginPath();
  ctx.arc(cx - s * 0.12, cy - s * 0.08, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.12, cy - s * 0.08, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Teeth lines
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.05, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.05, cy + s * 0.35);
  ctx.moveTo(cx + s * 0.05, cy + s * 0.25);
  ctx.lineTo(cx + s * 0.05, cy + s * 0.35);
  ctx.stroke();
  ctx.restore();
}

function drawTypeIcon(ctx, type, cx, cy, size) {
  if (type === "weapon") drawSwordIcon(ctx, cx, cy, size);
  else if (type === "potion") drawPotionIcon(ctx, cx, cy, size);
  else drawSkullIcon(ctx, cx, cy, size);
}

function drawCardTypeLabel(ctx, cardId, x, y, width, height) {
  const type = typeFromId(cardId);
  const iconSize = Math.min(18, width * 0.22);
  const labelY = y + height + iconSize * 0.9 + 25;
  const centerX = x + width / 2;

  // Icon
  drawTypeIcon(ctx, type, centerX, labelY, iconSize);

  // Label text below icon
  const fontSize = Math.max(8, iconSize * 0.55);
  ctx.save();
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const labelColors = { weapon: "#8ab4f8", potion: "#66bb6a", monster: "#ef5350" };
  ctx.fillStyle = labelColors[type] || "rgba(255,255,255,0.5)";
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  ctx.fillText(label, centerX, labelY + iconSize * 0.55);
  ctx.restore();
}

export function render(ctx, state, cardRegistry, layout, visualState, animator, particles) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Screen shake offset
  const shakeX = animator ? (Math.random() - 0.5) * animator.screenShake * 2 : 0;
  const shakeY = animator ? (Math.random() - 0.5) * animator.screenShake * 2 : 0;

  ctx.save();
  if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

  // Clear canvas (transparent so background GIF shows through)
  ctx.clearRect(-10, -10, w + 20, h + 20);

  // Zone labels drawn first (above banner)
  drawZoneLabels(ctx, layout);

  // Banner background behind dungeon + room + discard
  // Banner uses the card positions but adds its own offset so cards can shift independently
  const bannerImg = getBannerImage();
  if (bannerImg) {
    const d = layout.dungeon;
    const dc = layout.discard;
    const padX = 30;
    const padTop = 32; // extra top padding since cards moved up
    const padBot = 28;
    const bannerX = d.x - padX;
    const bannerY = d.y - padTop + 100 - 90 + 10;
    const bannerW = dc.x + dc.width - d.x + padX * 2;
    const bannerH = d.height + padTop + padBot;
    ctx.drawImage(bannerImg, bannerX, bannerY, bannerW, bannerH);
  }

  // Dungeon pile
  drawPileIndicator(ctx, layout.dungeon.x, layout.dungeon.y, layout.dungeon.width, layout.dungeon.height, state.dungeon.length);

  // Discard pile
  drawPileIndicator(ctx, layout.discard.x, layout.discard.y, layout.discard.width, layout.discard.height, state.discard.length);

  // Room cards (skip animated ones)
  drawRoomCards(ctx, state, cardRegistry, layout, visualState, animator);

  // HP bar above weapon card (centered)
  drawHealthBar(ctx, state, layout, visualState);

  // Resolved indicator (dots) + avoid button + icons
  drawDotsAndAvoid(ctx, state, layout, visualState);

  // Weapon area (skip animated cards)
  drawWeaponArea(ctx, state, cardRegistry, layout, animator);

  // Draw all animated cards on top
  if (animator) {
    for (const [cardId, vis] of animator.cards) {
      const card = cardRegistry.get(cardId);
      if (!card) continue;
      drawCard(ctx, card, vis.x, vis.y, layout.cardSize.width, layout.cardSize.height, {
        faceDown: vis.faceDown,
        scaleX: vis.scaleX,
        scaleY: vis.scaleY,
        opacity: vis.opacity,
        glowColor: vis.glowColor,
        glowAlpha: vis.glowAlpha,
        shakeAmount: vis.shakeAmount,
      });
    }
  }

  // Particles
  if (particles) particles.draw(ctx);

  // Floating damage/heal numbers
  if (animator) drawFloatingTexts(ctx, animator.floats);

  ctx.restore(); // end screen shake

  // HUD (drawn without shake)
  drawHUD(ctx, state, layout, visualState);

  // Damage preview tooltip
  if (visualState.hoverCardIndex !== null && state.gameStatus === "playing" && !animator?.isPlaying()) {
    const idx = visualState.hoverCardIndex;
    if (idx >= 0 && idx < state.room.length) {
      const cardId = state.room[idx];
      const card = cardRegistry.get(cardId);
      const slot = layout.room[idx];
      if (card && slot && card.type === "monster") {
        drawDamagePreview(ctx, card, layout, slot, state);
      }
    }
  }

  // Barehanded choice prompt
  if (visualState.showBarehandedChoice !== null && state.gameStatus === "playing") {
    drawBarehandedPrompt(ctx, state, layout, visualState);
  }

  // Potion waste confirmation prompt
  if (visualState.showPotionWasteChoice !== null && state.gameStatus === "playing") {
    drawPotionWastePrompt(ctx, state, layout, visualState);
  }

  // Settings overlay
  if (visualState.settings.showPanel) {
    drawSettingsPanel(ctx, layout, visualState);
  }
}

function drawZoneLabels(ctx, layout) {
  const fontSize = Math.max(9, layout.cardSize.width * 0.12);
  const lblImg = getLabelBannerImage();
  const lblH = fontSize + 10;
  const lblW = lblH * 3.2; // match aspect ratio of the banner image

  ctx.save();
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  function drawLabel(text, cx, bottomY) {
    const lx = cx - lblW / 2;
    const ly = bottomY - lblH;
    if (lblImg) {
      ctx.drawImage(lblImg, lx, ly, lblW, lblH);
    }
    ctx.fillStyle = "#5a2a1a";
    ctx.fillText(text, cx, ly + lblH / 2);
  }

  drawLabel("Dungeon", layout.dungeon.x + layout.dungeon.width / 2, layout.dungeon.y - 8);
  drawLabel("Discard", layout.discard.x + layout.discard.width / 2, layout.discard.y - 8);

  if (layout.room.length > 0) {
    const roomCenter = (layout.room[0].x + layout.room[layout.room.length - 1].x + layout.cardSize.width) / 2;
    drawLabel("Room", roomCenter, layout.room[0].y - 8);
  }

  ctx.restore();
}

function drawRoomCards(ctx, state, cardRegistry, layout, visualState, animator) {
  for (let i = 0; i < state.room.length; i++) {
    const cardId = state.room[i];
    // Skip if currently animated
    if (animator && animator.cards.has(cardId)) continue;

    const card = cardRegistry.get(cardId);
    const slot = layout.room[i];
    if (!slot || !card) continue;

    const isPlaying = state.gameStatus === "playing";
    const isPromptTarget = visualState.showBarehandedChoice !== null && visualState.showBarehandedChoice === i;
    const isPotionPrompt = visualState.showPotionWasteChoice !== null && visualState.showPotionWasteChoice === i;
    const isHovered = visualState.hoverCardIndex === i && isPlaying;
    const isPotionUsed = state.potionUsedThisTurn && card.type === "potion";

    drawCard(ctx, card, slot.x, slot.y, slot.width, slot.height, {
      highlighted: isPlaying && !isPromptTarget && !isPotionPrompt,
      selected: isPromptTarget || isPotionPrompt,
      dimmed: isPotionUsed && !isPotionPrompt,
      scaleX: isHovered ? 1.04 : 1,
      scaleY: isHovered ? 1.04 : 1,
    });

    // Type icon + label below card
    drawCardTypeLabel(ctx, cardId, slot.x, slot.y, slot.width, slot.height);
  }
}

function drawWeaponArea(ctx, state, cardRegistry, layout, animator) {
  const ws = layout.weaponSlot;

  if (!state.equippedWeapon) {
    // Empty slot with "No Weapon Equipped" text inside
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(ws.x, ws.y, ws.width, ws.height);
    ctx.setLineDash([]);

    const fontSize = Math.max(9, ws.width * 0.1);
    ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No Weapon", ws.x + ws.width / 2, ws.y + ws.height / 2 - fontSize * 0.5);
    ctx.fillText("Equipped", ws.x + ws.width / 2, ws.y + ws.height / 2 + fontSize * 0.5);
    ctx.restore();
    return;
  }

  // Draw equipped weapon card + type icon/label
  if (!animator || !animator.cards.has(state.equippedWeapon)) {
    const weaponCard = cardRegistry.get(state.equippedWeapon);
    if (weaponCard) {
      drawCard(ctx, weaponCard, ws.x, ws.y, ws.width, ws.height, {});
      drawCardTypeLabel(ctx, state.equippedWeapon, ws.x, ws.y, ws.width, ws.height);
    }
  }

  // Slain monsters — stack to the right of weapon, overlapping rightward
  const ss = layout.slainStack;
  for (let i = 0; i < state.slainByWeapon.length; i++) {
    const slainId = state.slainByWeapon[i];
    if (animator && animator.cards.has(slainId)) continue;
    const slainCard = cardRegistry.get(slainId);
    if (!slainCard) continue;
    const slainX = ss.x + i * ss.offsetX;
    drawCard(ctx, slainCard, slainX, ss.y, ss.width, ss.height, {});
  }

  // "Blocks up to X damage" above the weapon type icon
  const weaponRank = rankFromId(state.equippedWeapon);
  const weaponName = getRankName(weaponRank);
  ctx.save();
  ctx.font = `bold 10px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`Blocks up to ${weaponName}`, ws.x + ws.width / 2, ws.y + ws.height + 12);
  ctx.restore();

  // Degradation text below the slain area
  if (state.slainByWeapon.length > 0) {
    const lastSlainId = state.slainByWeapon[state.slainByWeapon.length - 1];
    const lastRank = rankFromId(lastSlainId);
    const rankName = getRankName(lastRank);
    const textX = ss.x;
    const textY = ss.y + ss.height + 14;
    ctx.save();
    ctx.font = `bold 11px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#f0c040";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Kill monsters ${rankName} or lower`, textX, textY);
    ctx.restore();
  }
}

function drawDotsAndAvoid(ctx, state, layout, visualState) {
  const dc = layout.discard;
  const btnW = 60;
  const btnH = 26;
  const centerX = dc.x + dc.width + btnW / 2 + 50; // well to the right of banner
  const btnY = dc.y + dc.height / 2; // vertically centered on the card row

  const showAvoid = canAvoidRoom(state) && state.gameStatus === "playing";

  // Settings + Sound icons above the dots
  const iconSize = 24;
  const iconGap = 6;
  const iconsY = btnY - btnH / 2 - 10 - iconSize - 12;
  const soundRect = { x: centerX - iconSize - iconGap / 2, y: iconsY, width: iconSize, height: iconSize };
  const gearRect = { x: centerX + iconGap / 2, y: iconsY, width: iconSize, height: iconSize };
  drawMuteIcon(ctx, soundRect, visualState?.settings?.muted || false);
  drawGearIcon(ctx, gearRect);
  layout.muteButton = soundRect;
  layout.settingsButton = gearRect;

  // Dots above the avoid button area
  drawResolvedIndicator(ctx, state, centerX, btnY - btnH / 2 - 10);

  if (showAvoid) {
    const btnX = centerX - btnW / 2;
    const r = 4;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(btnX + r, btnY);
    ctx.lineTo(btnX + btnW - r, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + r);
    ctx.lineTo(btnX + btnW, btnY + btnH - r);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH);
    ctx.lineTo(btnX + r, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - r);
    ctx.lineTo(btnX, btnY + r);
    ctx.quadraticCurveTo(btnX, btnY, btnX + r, btnY);
    ctx.closePath();
    ctx.fillStyle = "#8b5e3c";
    ctx.fill();
    ctx.strokeStyle = "#c4956a";
    ctx.lineWidth = 1;
    ctx.stroke();

    const fontSize = Math.max(10, btnH * 0.45);
    ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Avoid", btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    layout.avoidButton = { x: btnX, y: btnY, width: btnW, height: btnH };
  } else {
    layout.avoidButton = { x: -100, y: -100, width: 0, height: 0 };
  }
}

function drawBarehandedPrompt(ctx, state, layout, visualState) {
  const cardIndex = visualState.showBarehandedChoice;
  const slot = layout.room[cardIndex];
  if (!slot) return;

  const btnW = layout.barehandedButton.width;
  const btnH = layout.barehandedButton.height;
  const gap = 6;
  const btnY = slot.y + slot.height + gap;
  const centerX = slot.x + slot.width / 2;

  const weaponBtnX = centerX - btnW - gap / 2;
  const bareBtnX = centerX + gap / 2;

  drawPromptButton(ctx, weaponBtnX, btnY, btnW, btnH, "Use Weapon", "#2a6496");
  drawPromptButton(ctx, bareBtnX, btnY, btnW, btnH, "Barehanded", "#8b5e3c");

  visualState.weaponButtonRect = { x: weaponBtnX, y: btnY, width: btnW, height: btnH };
  visualState.barehandedButtonRect = { x: bareBtnX, y: btnY, width: btnW, height: btnH };
}

function drawPotionWastePrompt(ctx, state, layout, visualState) {
  const cardIndex = visualState.showPotionWasteChoice;
  const slot = layout.room[cardIndex];
  if (!slot) return;

  const btnW = layout.barehandedButton.width;
  const btnH = layout.barehandedButton.height;
  const gap = 6;
  const btnY = slot.y + slot.height + gap;
  const centerX = slot.x + slot.width / 2;

  // Warning text
  ctx.save();
  ctx.font = `bold 10px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#f0c040";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("No healing (already used one)", centerX, btnY - 4);
  ctx.restore();

  const useBtnX = centerX - btnW - gap / 2;
  const cancelBtnX = centerX + gap / 2;

  drawPromptButton(ctx, useBtnX, btnY, btnW, btnH, "Use Anyway", "#8b3030");
  drawPromptButton(ctx, cancelBtnX, btnY, btnW, btnH, "Cancel", "#555");

  visualState.potionUseAnywayRect = { x: useBtnX, y: btnY, width: btnW, height: btnH };
  visualState.potionCancelRect = { x: cancelBtnX, y: btnY, width: btnW, height: btnH };
}

function drawPromptButton(ctx, x, y, w, h, label, color) {
  const r = 4;
  ctx.save();
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
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const fontSize = Math.max(10, h * 0.4);
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}
