// Card art themes — swappable visual styles.

export const THEMES = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    cardBackground: "#f5f0e8",
    cardBorder: "#3a3a3a",
    highlightBorder: "#f0c040",
    monsterColors: { primary: "#1a1a2e", accent: "#2d2d44" },
    weaponColors: { primary: "#1a3a5c", accent: "#2a6496" },
    potionColors: { primary: "#5c1a1a", accent: "#c0392b" },
    cardBackFill: "#2c1810",
    cardBackBorder: "#1a0e08",
    cardBackAccent: "#5a3a28",
    feltColor: "#1a2e1a",
    zoneLabelColor: "rgba(255,255,255,0.2)",
    fontFamily: '"Georgia", serif',
    uiFont: '"Helvetica Neue", Arial, sans-serif',
  },
  dark: {
    id: "dark",
    name: "Dark",
    cardBackground: "#1e1e2e",
    cardBorder: "#444",
    highlightBorder: "#00d4ff",
    monsterColors: { primary: "#ff4466", accent: "#ff6688" },
    weaponColors: { primary: "#44aaff", accent: "#66ccff" },
    potionColors: { primary: "#44ff88", accent: "#66ffaa" },
    cardBackFill: "#0a0a14",
    cardBackBorder: "#222",
    cardBackAccent: "#333355",
    feltColor: "#0d0d1a",
    zoneLabelColor: "rgba(255,255,255,0.15)",
    fontFamily: '"Georgia", serif',
    uiFont: '"Helvetica Neue", Arial, sans-serif',
  },
  parchment: {
    id: "parchment",
    name: "Parchment",
    cardBackground: "#f4e8c1",
    cardBorder: "#8b7355",
    highlightBorder: "#d4a017",
    monsterColors: { primary: "#2d1b0e", accent: "#5a3a28" },
    weaponColors: { primary: "#4a5568", accent: "#718096" },
    potionColors: { primary: "#742a2a", accent: "#9b4444" },
    cardBackFill: "#3d2b1f",
    cardBackBorder: "#2a1a0e",
    cardBackAccent: "#6b4e2c",
    feltColor: "#2d3a2d",
    zoneLabelColor: "rgba(255,255,255,0.18)",
    fontFamily: '"Georgia", serif',
    uiFont: '"Helvetica Neue", Arial, sans-serif',
  },
};

let activeThemeId = "minimal";

export function getTheme() {
  return THEMES[activeThemeId] || THEMES.minimal;
}

export function setTheme(id) {
  if (THEMES[id]) activeThemeId = id;
}

export function getThemeId() {
  return activeThemeId;
}

export function getThemeList() {
  return Object.values(THEMES).map((t) => ({ id: t.id, name: t.name }));
}
