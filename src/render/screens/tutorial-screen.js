// Tutorial / How to Play screen — multi-page walkthrough of game rules.

import { drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

const BG_COLOR = "#0f1921";

const PAGES = [
  {
    title: "Overview",
    lines: [
      { text: "Welcome to Scoundrel!", opts: { size: 16, bold: true } },
      { text: "" },
      { text: "You are a lone adventurer descending" },
      { text: "into a dungeon made of 44 cards." },
      { text: "" },
      { text: "You start with 20 HP." },
      { text: "Each turn, a room of 4 cards is dealt." },
      { text: "You must resolve 3 of them." },
      { text: "The 4th card stays for the next room." },
      { text: "" },
      { text: "Survive the entire dungeon to win!", opts: { bold: true } },
    ],
  },
  {
    title: "Card Types",
    lines: [
      { text: "The dungeon has three card types:", opts: { size: 15 } },
      { text: "" },
      { text: "MONSTERS  (Clubs & Spades, ranks 2-14)", opts: { bold: true } },
      { text: "26 monsters that deal damage equal to rank." },
      { text: "Ace = 14, King = 13, Queen = 12, Jack = 11." },
      { text: "" },
      { text: "WEAPONS  (Diamonds, ranks 2-10)", opts: { bold: true } },
      { text: "9 weapons you can equip to reduce damage." },
      { text: "" },
      { text: "POTIONS  (Hearts, ranks 2-10)", opts: { bold: true } },
      { text: "9 potions that restore HP equal to rank." },
    ],
  },
  {
    title: "Turn Flow",
    lines: [
      { text: "Each turn, 4 cards are dealt to the room." },
      { text: "" },
      { text: "You must resolve exactly 3 of them", opts: { bold: true } },
      { text: "by clicking on cards one at a time." },
      { text: "" },
      { text: "The 4th card stays and carries over" },
      { text: "to the next room (joined by 3 new cards)." },
      { text: "" },
      { text: "The dots to the right of the board track" },
      { text: "how many cards you've resolved this turn." },
      { text: "" },
      { text: "Choose wisely which card to leave behind!", opts: { bold: true } },
    ],
  },
  {
    title: "Combat",
    lines: [
      { text: "When you click a monster, you fight it." },
      { text: "" },
      { text: "BAREHANDED:", opts: { bold: true } },
      { text: "You take full damage equal to the monster's rank." },
      { text: "Example: A 9 of Clubs deals 9 damage." },
      { text: "" },
      { text: "WITH WEAPON:", opts: { bold: true } },
      { text: "Damage = monster rank - weapon rank (min 0)." },
      { text: "Example: 9 monster vs 7 weapon = only 2 damage!" },
      { text: "" },
      { text: "If you have a weapon, you'll be asked to choose." },
    ],
  },
  {
    title: "Weapons & Degradation",
    lines: [
      { text: "Click a Diamond card to equip it as a weapon." },
      { text: "" },
      { text: "You can only carry ONE weapon at a time.", opts: { bold: true } },
      { text: "Equipping a new one discards the old weapon" },
      { text: "along with all monsters it has slain." },
      { text: "" },
      { text: "DEGRADATION:", opts: { bold: true } },
      { text: "After killing a monster with your weapon," },
      { text: "it can only kill monsters of equal or" },
      { text: "LOWER rank than the last kill." },
      { text: "" },
      { text: "Plan your fights from strongest to weakest!", opts: { bold: true } },
    ],
  },
  {
    title: "Potions",
    lines: [
      { text: "Click a Heart card to drink a potion." },
      { text: "" },
      { text: "Heals HP equal to the potion's rank.", opts: { bold: true } },
      { text: "HP cannot exceed 20 (the maximum)." },
      { text: "" },
      { text: "LIMIT: Only ONE potion heals per turn.", opts: { bold: true } },
      { text: "If you use a second potion in the same turn," },
      { text: "it is wasted and gives no healing." },
      { text: "" },
      { text: "Save potions for when you really need them!" },
    ],
  },
  {
    title: "Room Avoidance",
    lines: [
      { text: "Sometimes a room is too dangerous." },
      { text: "" },
      { text: "Before selecting any card, you can press", opts: { bold: true } },
      { text: "the AVOID button to skip the entire room.", opts: { bold: true } },
      { text: "" },
      { text: "All 4 cards go to the bottom of the dungeon" },
      { text: "and a fresh room of 4 new cards is dealt." },
      { text: "" },
      { text: "RESTRICTION:", opts: { bold: true } },
      { text: "You cannot avoid two rooms in a row." },
      { text: "Use it strategically!" },
    ],
  },
  {
    title: "Scoring",
    lines: [
      { text: "WIN: Clear the entire dungeon.", opts: { bold: true } },
      { text: "Score = remaining HP." },
      { text: "Bonus: if the last card you resolve is a potion," },
      { text: "its rank is added to your score!" },
      { text: "" },
      { text: "LOSE: HP drops to 0 or below.", opts: { bold: true } },
      { text: "Score = HP minus remaining monster values." },
      { text: "(Usually a negative number.)" },
      { text: "" },
      { text: "Aim for the highest score. Good luck!", opts: { bold: true, size: 15 } },
    ],
  },
];

export function drawTutorial(ctx, w, h, data, hits) {
  ctx.clearRect(0, 0, w, h);

  const page = data.page || 0;
  const totalPages = PAGES.length;
  const current = PAGES[Math.min(page, totalPages - 1)];

  const cx = w / 2;

  // Light brown card background for readability
  const cardW = Math.min(480, w * 0.75);
  const cardH = h * 0.72;
  const cardX = cx - cardW / 2;
  const cardY = h * 0.06;
  const cardR = 10;

  ctx.save();
  ctx.fillStyle = "#d4c4a0";
  ctx.beginPath();
  ctx.moveTo(cardX + cardR, cardY);
  ctx.lineTo(cardX + cardW - cardR, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR);
  ctx.lineTo(cardX + cardW, cardY + cardH - cardR);
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH);
  ctx.lineTo(cardX + cardR, cardY + cardH);
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR);
  ctx.lineTo(cardX, cardY + cardR);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY);
  ctx.closePath();
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = "#a08860";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Title — same size as main menu "SCOUNDREL"
  const titleSize = Math.max(32, Math.min(w * 0.08, 56));
  drawTitle(ctx, current.title, cx, cardY + 36, BG_COLOR, titleSize);

  // Page indicator
  drawText(ctx, `${page + 1} / ${totalPages}`, cx, cardY + 60, { color: "#8a7a5a", size: 12 });

  // Content lines — dark text on the light card
  const lineH = 20;
  let y = cardY + 82;
  for (const line of current.lines) {
    if (line.text === "") {
      y += lineH * 0.5;
      continue;
    }
    const opts = {
      color: BG_COLOR,
      size: 14,
      ...line.opts,
    };
    // Override any color to stay dark
    opts.color = BG_COLOR;
    drawText(ctx, line.text, cx, y, opts);
    y += lineH;
  }

  // Navigation buttons
  const btnW = 120;
  const btnH = 38;
  const navY = h * 0.88;

  // Back button (always)
  hits.back = centeredBtn(cx - btnW - 20, navY, btnW, btnH);
  drawButton(ctx, hits.back, "Back to Menu", "#555", "#777");

  // Previous (if not first page)
  if (page > 0) {
    hits.prevPage = centeredBtn(cx + 20, navY, btnW * 0.7, btnH);
    drawButton(ctx, hits.prevPage, "Previous", "#8b5e3c", "#6b4e2c");
  }

  // Next or "Got it!" on last page
  if (page < totalPages - 1) {
    hits.nextPage = centeredBtn(cx + 20 + btnW * 0.7 + 10, navY, btnW * 0.7, btnH);
    drawButton(ctx, hits.nextPage, "Next", "#4caf50", "#388e3c");
  } else {
    hits.back2 = centeredBtn(cx + 20 + btnW * 0.7 + 10, navY, btnW * 0.7, btnH);
    drawButton(ctx, hits.back2, "Got it!", "#4caf50", "#388e3c");
  }
}
