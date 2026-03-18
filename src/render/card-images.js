// Card image loader — maps card IDs to image assets from Jorel's Card Pack.
// File naming: club_0001.png (ace) through club_0013.png (king)
// Our ranks: 2-13 map to files 0002-0013, rank 14 (ace) maps to file 0001.

const images = new Map();
let cardBack = null;
let barBase = null;
let barFill = null;
let gearIcon = null;
let soundIcon = null;
let xmarkIcon = null;
let bannerImg = null;
let buttonBgImg = null;
let labelBannerImg = null;
let dotFilled = null;
let dotEmpty = null;
let loaded = false;
let loadPromise = null;

const SUIT_FOLDERS = {
  clubs: { folder: "clubs", prefix: "club" },
  diamonds: { folder: "diamonds", prefix: "diamond" },
  hearts: { folder: "hearts", prefix: "heart" },
  spades: { folder: "spades", prefix: "spade" },
};

function rankToFileNum(rank) {
  // rank 14 (Ace) = file 0001, rank 2-13 = file 0002-0013
  return rank === 14 ? 1 : rank;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

export async function loadCardImages() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const promises = [];

    // Load card back
    promises.push(
      loadImage("assets/cards/card_back.png").then((img) => { cardBack = img; })
    );

    // Load health bar UI assets
    promises.push(
      loadImage("assets/ui/healthbarbase.png").then((img) => { barBase = img; })
    );
    promises.push(
      loadImage("assets/ui/healthbarred.png").then((img) => { barFill = img; })
    );
    promises.push(
      loadImage("assets/ui/gear.png").then((img) => { gearIcon = img; })
    );
    promises.push(
      loadImage("assets/ui/sound.png").then((img) => { soundIcon = img; })
    );
    promises.push(
      loadImage("assets/ui/room_banner.png").then((img) => { bannerImg = img; })
    );
    promises.push(
      loadImage("assets/ui/button_bg.png").then((img) => { buttonBgImg = img; })
    );
    promises.push(
      loadImage("assets/ui/label_banner.png").then((img) => { labelBannerImg = img; })
    );
    promises.push(
      loadImage("assets/ui/dot_filled.png").then((img) => { dotFilled = img; })
    );
    promises.push(
      loadImage("assets/ui/dot_empty.png").then((img) => { dotEmpty = img; })
    );
    promises.push(
      loadImage("assets/ui/xmark.png").then((img) => { xmarkIcon = img; })
    );

    // Load all cards in the Scoundrel deck
    for (const [suit, info] of Object.entries(SUIT_FOLDERS)) {
      const maxRank = suit === "diamonds" || suit === "hearts" ? 10 : 14;
      for (let rank = 2; rank <= maxRank; rank++) {
        const fileNum = String(rankToFileNum(rank)).padStart(4, "0");
        const src = `assets/cards/${info.folder}/${info.prefix}_${fileNum}.png`;
        const cardId = `${suit}_${rank}`;
        promises.push(
          loadImage(src).then((img) => { images.set(cardId, img); })
        );
      }
    }

    await Promise.all(promises);
    loaded = true;
  })();

  return loadPromise;
}

export function getCardImage(cardId) {
  return images.get(cardId) || null;
}

export function getCardBackImage() {
  return cardBack;
}

export function getBarBaseImage() {
  return barBase;
}

export function getBarFillImage() {
  return barFill;
}

export function getGearIcon() {
  return gearIcon;
}

export function getSoundIcon() {
  return soundIcon;
}

export function getXmarkIcon() {
  return xmarkIcon;
}

export function getDotFilledImage() {
  return dotFilled;
}

export function getDotEmptyImage() {
  return dotEmpty;
}

export function getButtonBgImage() {
  return buttonBgImg;
}

export function getLabelBannerImage() {
  return labelBannerImg;
}

export function getBannerImage() {
  return bannerImg;
}

export function areImagesLoaded() {
  return loaded;
}
