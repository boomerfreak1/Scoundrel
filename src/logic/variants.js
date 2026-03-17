// Variant definitions and config management.
// Zero browser dependencies.

export const DEFAULT_CONFIG = {
  startingHealth: 20,
  maxHealth: 20,
  maxPotionsPerTurn: 1,
  canAvoidRooms: true,
  consecutiveAvoidAllowed: false,
  weaponDegradation: true,
  cardsPerRoom: 4,
  weaponDamageMultiplier: 1,
  endless: false,
};

export const VARIANTS = [
  {
    id: "classic",
    name: "Classic",
    description: "Standard Scoundrel rules.",
    rules: {},
  },
  {
    id: "hardcore",
    name: "Hardcore",
    description: "Start with 15 HP. No room for error.",
    rules: { startingHealth: 15, maxHealth: 15 },
  },
  {
    id: "endless",
    name: "Endless",
    description: "Dungeon reshuffles forever. Survive as long as you can.",
    rules: { endless: true },
  },
  {
    id: "reckless",
    name: "Reckless",
    description: "No room avoidance allowed. Face every room.",
    rules: { canAvoidRooms: false },
  },
  {
    id: "glass_cannon",
    name: "Glass Cannon",
    description: "10 HP, but weapons deal double damage.",
    rules: { startingHealth: 10, maxHealth: 10, weaponDamageMultiplier: 2 },
  },
];

export function getVariantConfig(variantId) {
  const variant = VARIANTS.find((v) => v.id === variantId);
  const rules = variant ? variant.rules : {};
  return { ...DEFAULT_CONFIG, ...rules };
}

export function getConfig(state) {
  return state.variantConfig || DEFAULT_CONFIG;
}
