// Daily challenge seed generation.
// Zero browser dependencies.

function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDailySeed(dateStr) {
  return djb2("scoundrel-daily-" + dateStr);
}

export function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}
