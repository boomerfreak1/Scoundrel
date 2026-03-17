// Daily challenge screen — pre/post challenge UI.

import { drawBackground, drawButton, centeredBtn, drawTitle, drawText } from "./ui-helpers.js";

export function drawDaily(ctx, w, h, data, hits) {
  drawBackground(ctx, w, h);

  const cx = w / 2;
  const btnW = Math.min(220, w * 0.6);
  const btnH = 44;

  drawTitle(ctx, "Daily Challenge", cx, h * 0.12, "#f0c040", Math.max(24, w * 0.05));
  drawText(ctx, data.dateStr, cx, h * 0.19, { color: "rgba(255,255,255,0.6)", size: 16 });

  if (data.streak > 0) {
    drawText(ctx, `Streak: ${data.streak} day${data.streak > 1 ? "s" : ""}`, cx, h * 0.24, { color: "#f0c040", size: 13 });
  }

  if (data.played) {
    const r = data.result;
    drawText(ctx, r.outcome === "won" ? "Victory!" : "Defeated", cx, h * 0.34, {
      color: r.outcome === "won" ? "#f0c040" : "#f44336", size: 22, bold: true,
    });
    drawText(ctx, `Score: ${r.score}`, cx, h * 0.42, { size: 18, bold: true });

    let y = h * 0.52;
    hits.share = centeredBtn(cx, y, btnW, btnH);
    drawButton(ctx, hits.share, "Share Result", "#2a6496", "#1a3a5c");
    y += btnH + 14;
    hits.back = centeredBtn(cx, y, btnW, btnH);
    drawButton(ctx, hits.back, "Back", "#555", "#777");
  } else {
    drawText(ctx, "One chance per day. Same deck for everyone.", cx, h * 0.35, { color: "rgba(255,255,255,0.5)", size: 13 });
    drawText(ctx, `Seed: ${data.seed}`, cx, h * 0.40, { color: "rgba(255,255,255,0.3)", size: 12 });

    let y = h * 0.50;
    hits.dailyPlay = centeredBtn(cx, y, btnW, btnH);
    drawButton(ctx, hits.dailyPlay, "Play Today's Challenge", "#4caf50", "#388e3c");
    y += btnH + 14;
    hits.back = centeredBtn(cx, y, btnW, btnH);
    drawButton(ctx, hits.back, "Back", "#555", "#777");
  }

  // History
  const history = (data.history || []).slice(-7).reverse();
  if (history.length > 0) {
    let hy = h * 0.70;
    drawText(ctx, "Recent", cx, hy, { color: "rgba(255,255,255,0.4)", size: 12 });
    hy += 20;
    for (const entry of history) {
      const icon = entry.outcome === "won" ? "\u{1F451}" : "\u{1F480}";
      drawText(ctx, `${entry.date}  ${icon}  ${entry.score}`, cx, hy, { color: "rgba(255,255,255,0.5)", size: 11 });
      hy += 18;
    }
  }
}
