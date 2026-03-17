// Layout system — zone positions as ratios of canvas dimensions.
// Handles landscape (desktop) and portrait (mobile) layouts.

const CARD_ASPECT = 2.5 / 3.5; // width / height

export function calculateLayout(canvasWidth, canvasHeight) {
  const isPortrait = canvasHeight > canvasWidth;
  return isPortrait
    ? calculatePortraitLayout(canvasWidth, canvasHeight)
    : calculateLandscapeLayout(canvasWidth, canvasHeight);
}

function addHudButtons(base, w, h, padding, hudHeight) {
  const btnH = hudHeight * 0.65;

  // Avoid button: right side
  const avoidBtnW = Math.min(base.isPortrait ? 90 : 120, w * 0.15);
  base.avoidButton = {
    x: w - avoidBtnW - padding * 2,
    y: (hudHeight - btnH) / 2,
    width: avoidBtnW,
    height: btnH,
  };

  // Mute button: small square left of avoid
  const iconSize = Math.max(24, btnH);
  base.muteButton = {
    x: base.avoidButton.x - iconSize - padding,
    y: (hudHeight - iconSize) / 2,
    width: iconSize,
    height: iconSize,
  };

  // Settings button: left of mute
  base.settingsButton = {
    x: base.muteButton.x - iconSize - padding * 0.5,
    y: (hudHeight - iconSize) / 2,
    width: iconSize,
    height: iconSize,
  };

  // New game button (game over overlay)
  const newGameBtnW = Math.min(base.isPortrait ? 180 : 200, w * 0.35);
  const newGameBtnH = base.isPortrait ? 44 : 48;
  base.newGameButton = {
    x: (w - newGameBtnW) / 2,
    y: h * 0.62,
    width: newGameBtnW,
    height: newGameBtnH,
  };

  // Barehanded prompt buttons
  base.barehandedButton = {
    width: Math.min(base.isPortrait ? 120 : 140, w * 0.18),
    height: base.isPortrait ? 32 : 36,
  };

  // Settings panel (centered overlay)
  const panelW = Math.min(300, w * 0.75);
  const panelH = Math.min(300, h * 0.5);
  base.settingsPanel = {
    x: (w - panelW) / 2,
    y: (h - panelH) / 2,
    width: panelW,
    height: panelH,
  };
}

function calculateLandscapeLayout(w, h) {
  const padding = Math.min(w, h) * 0.02;
  const hudHeight = h * 0.08;
  const availH = h - hudHeight - padding * 3;
  const cardH = Math.min(availH * 0.38, 150);
  const cardW = cardH * CARD_ASPECT;
  const gap = Math.min(cardW * 0.2, 16);
  const labelSpace = 10;

  const roomTotalW = cardW * 4 + gap * 3;
  const roomStartX = (w - roomTotalW) / 2;
  const roomY = hudHeight + padding * 2 + labelSpace - 34 + 90 + 180;

  const room = [];
  for (let i = 0; i < 4; i++) {
    room.push({
      x: roomStartX + i * (cardW + gap),
      y: roomY,
      width: cardW,
      height: cardH,
    });
  }

  const dungeonX = Math.max(padding, roomStartX - cardW - gap * 2);
  const dungeon = { x: dungeonX, y: roomY, width: cardW, height: cardH };

  const discardX = Math.min(w - cardW - padding, roomStartX + roomTotalW + gap * 2);
  const discard = { x: discardX, y: roomY, width: cardW, height: cardH };

  const iconLabelSpace = cardH * 0.3 + 50;
  const weaponY = roomY + cardH + iconLabelSpace + padding + 3;
  const weaponX = dungeonX; // aligned to left with dungeon pile
  const weaponSlot = { x: weaponX, y: weaponY, width: cardW, height: cardH };

  // Slain monsters stack to the right of the weapon
  const slainOffsetX = cardW * 0.25;
  const slainStack = {
    x: weaponX + cardW + gap, // first slain card starts right of weapon
    y: weaponY,
    width: cardW,
    height: cardH,
    offsetX: slainOffsetX,
  };

  const hud = { x: 0, y: 0, width: w, height: hudHeight };

  const base = { dungeon, room, discard, weaponSlot, slainStack, hud, cardSize: { width: cardW, height: cardH }, isPortrait: false };
  addHudButtons(base, w, h, padding, hudHeight);
  return base;
}

function calculatePortraitLayout(w, h) {
  const padding = w * 0.03;
  const hudHeight = h * 0.07;
  const availW = w - padding * 2;
  const cardW = Math.min((availW - padding * 3) / 4, 75);
  const cardH = cardW / CARD_ASPECT;
  const gap = (availW - cardW * 4) / 3;
  const labelSpace = 16;

  const topRowY = hudHeight + padding * 1.5 + labelSpace;
  const dungeon = { x: padding, y: topRowY, width: cardW, height: cardH };
  const discard = { x: w - cardW - padding, y: topRowY, width: cardW, height: cardH };

  const roomY = topRowY + cardH + padding * 2;
  const roomStartX = padding;
  const room = [];
  for (let i = 0; i < 4; i++) {
    room.push({ x: roomStartX + i * (cardW + gap), y: roomY, width: cardW, height: cardH });
  }

  const iconLabelSpace = cardH * 0.3 + 16;
  const weaponY = roomY + cardH + iconLabelSpace + padding;
  const weaponX = padding;
  const weaponSlot = { x: weaponX, y: weaponY, width: cardW, height: cardH };

  const slainOffsetX = cardW * 0.25;
  const slainStack = { x: weaponX + cardW + gap, y: weaponY, width: cardW, height: cardH, offsetX: slainOffsetX };

  const hud = { x: 0, y: 0, width: w, height: hudHeight };

  const base = { dungeon, room, discard, weaponSlot, slainStack, hud, cardSize: { width: cardW, height: cardH }, isPortrait: true };
  addHudButtons(base, w, h, padding, hudHeight);
  return base;
}
