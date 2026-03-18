// Input handler — routes clicks based on current screen.
// Supports gameplay, menus, undo, replay, hover preview, settings.

import { canUseWeapon, canHoneWeapon, calculateWeaponDamage, calculateBarehandedDamage } from "../logic/combat.js";
import { typeFromId, rankFromId } from "../logic/card.js";
import { canAvoidRoom } from "../logic/turn.js";

export function setupInputHandler(canvas, getState, getLayout, getCardRegistry, onCommand, getVisualState, getAnimator, getAudio, getScreen, onScreenAction, variantCtrl) {

  function getCSSCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitTest(px, py, rect) {
    return rect && px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
  }

  function handleClick(e) {
    e.preventDefault();
    const { x, y } = getCSSCoords(e);
    const vs = getVisualState();
    const audio = getAudio();

    if (vs.settings.showPanel) {
      handleSettingsClick(x, y, vs, audio);
      return;
    }

    const screen = getScreen();

    if (screen === "playing") {
      handleGameplayClick(x, y);
    } else if (screen === "replay") {
      handleReplayClick(x, y);
    } else if (screen === "variant_select") {
      handleVariantClick(x, y);
    } else {
      handleScreenClick(x, y, screen);
    }
  }

  function handleScreenClick(x, y, screen) {
    const vs = getVisualState();
    const hits = vs.screenHits || {};

    const actionMap = {
      newGame: "newGame",
      enterSeed: "enterSeed",
      menu: "menu",
      back: "menu",
      highScores: "highScores",
      stats: "stats",
      achievements: "achievements",
      settings: "settings",
      clearScores: "clearScores",
      clearStats: "clearStats",
      daily: "daily",
      dailyPlay: "dailyPlay",
      variants: "variants",
      startVariant: "startVariant",
      replay: "replay",
      share: "dailyShare",
      tutorial: "tutorial",
      nextPage: "tutorialNext",
      prevPage: "tutorialPrev",
      back2: "menu",
    };

    for (const [key, action] of Object.entries(actionMap)) {
      if (hits[key] && hitTest(x, y, hits[key])) {
        onScreenAction(action);
        return;
      }
    }
  }

  function handleVariantClick(x, y) {
    const vs = getVisualState();
    const hits = vs.screenHits || {};

    // Check variant cards
    if (hits.variantCards) {
      for (const vc of hits.variantCards) {
        if (hitTest(x, y, vc.rect)) {
          variantCtrl?.setSelectedVariant(vc.variantId);
          getAudio()?.play("buttonClick");
          return;
        }
      }
    }

    // Other buttons
    handleScreenClick(x, y, "variant_select");
  }

  function handleReplayClick(x, y) {
    const vs = getVisualState();
    const hits = vs.screenHits || {};

    const replayActions = {
      replayToggle: "replayToggle",
      replayStep: "replayStep",
      replaySpeed: "replaySpeed",
      replayExit: "replayExit",
    };

    for (const [key, action] of Object.entries(replayActions)) {
      if (hits[key] && hitTest(x, y, hits[key])) {
        onScreenAction(action);
        return;
      }
    }
  }

  function handleGameplayClick(x, y) {
    const state = getState();
    const layout = getLayout();
    const vs = getVisualState();
    const animator = getAnimator();
    const audio = getAudio();

    if (!state) return;

    if (hitTest(x, y, layout.settingsButton)) {
      vs.settings.showPanel = true;
      audio?.play("buttonClick");
      return;
    }
    if (hitTest(x, y, layout.muteButton)) {
      vs.settings.muted = !vs.settings.muted;
      audio?.setMuted(vs.settings.muted);
      return;
    }

    // Menu button
    if (vs._menuButton && hitTest(x, y, vs._menuButton)) {
      audio?.play("buttonClick");
      onScreenAction("menuReturn");
      return;
    }

    if (animator && animator.isPlaying()) return;
    if (state.gameStatus !== "playing") return;

    if (vs.showBarehandedChoice !== null) {
      const cardIndex = vs.showBarehandedChoice;
      if (vs.weaponButtonRect && hitTest(x, y, vs.weaponButtonRect)) {
        vs.showBarehandedChoice = null;
        vs.weaponButtonRect = null;
        vs.barehandedButtonRect = null;
        audio?.play("buttonClick");
        onCommand({ type: "SELECT_CARD", payload: { cardIndex } });
        return;
      }
      if (vs.barehandedButtonRect && hitTest(x, y, vs.barehandedButtonRect)) {
        vs.showBarehandedChoice = null;
        vs.weaponButtonRect = null;
        vs.barehandedButtonRect = null;
        audio?.play("buttonClick");
        onCommand({ type: "FIGHT_BAREHANDED", payload: { cardIndex } });
        return;
      }
      vs.showBarehandedChoice = null;
      vs.weaponButtonRect = null;
      vs.barehandedButtonRect = null;
      return;
    }

    // Weapon equip vs hone choice prompt
    if (vs.showWeaponChoice !== null) {
      const cardIndex = vs.showWeaponChoice;
      if (vs.equipButtonRect && hitTest(x, y, vs.equipButtonRect)) {
        vs.showWeaponChoice = null;
        vs.equipButtonRect = null;
        vs.honeButtonRect = null;
        audio?.play("buttonClick");
        onCommand({ type: "SELECT_CARD", payload: { cardIndex } });
        return;
      }
      if (vs.honeButtonRect && hitTest(x, y, vs.honeButtonRect)) {
        vs.showWeaponChoice = null;
        vs.equipButtonRect = null;
        vs.honeButtonRect = null;
        audio?.play("buttonClick");
        onCommand({ type: "HONE_WEAPON", payload: { cardIndex } });
        return;
      }
      vs.showWeaponChoice = null;
      vs.equipButtonRect = null;
      vs.honeButtonRect = null;
      return;
    }

    // Potion waste confirmation prompt
    if (vs.showPotionWasteChoice !== null) {
      const cardIndex = vs.showPotionWasteChoice;
      if (vs.potionUseAnywayRect && hitTest(x, y, vs.potionUseAnywayRect)) {
        vs.showPotionWasteChoice = null;
        vs.potionUseAnywayRect = null;
        vs.potionCancelRect = null;
        audio?.play("buttonClick");
        onCommand({ type: "SELECT_CARD", payload: { cardIndex } });
        return;
      }
      if (vs.potionCancelRect && hitTest(x, y, vs.potionCancelRect)) {
        vs.showPotionWasteChoice = null;
        vs.potionUseAnywayRect = null;
        vs.potionCancelRect = null;
        audio?.play("buttonClick");
        return;
      }
      vs.showPotionWasteChoice = null;
      vs.potionUseAnywayRect = null;
      vs.potionCancelRect = null;
      return;
    }

    if (canAvoidRoom(state) && hitTest(x, y, layout.avoidButton)) {
      audio?.play("buttonClick");
      onCommand({ type: "AVOID_ROOM", payload: {} });
      return;
    }

    for (let i = 0; i < state.room.length; i++) {
      const slot = layout.room[i];
      if (!slot) continue;
      if (hitTest(x, y, slot)) {
        const cardId = state.room[i];
        const cardType = typeFromId(cardId);

        if (cardType === "monster" && canUseWeapon(state, cardId)) {
          vs.showBarehandedChoice = i;
          audio?.play("buttonClick");
          return;
        }

        if (cardType === "monster") {
          onCommand({ type: "FIGHT_BAREHANDED", payload: { cardIndex: i } });
        } else if (cardType === "potion") {
          // Show potion confirmation (waste warning or first-use confirmation)
          vs.showPotionWasteChoice = i;
          audio?.play("buttonClick");
        } else if (cardType === "weapon" && state.equippedWeapon && canHoneWeapon(state, cardId)) {
          vs.showWeaponChoice = i;
          audio?.play("buttonClick");
        } else {
          onCommand({ type: "SELECT_CARD", payload: { cardIndex: i } });
        }
        return;
      }
    }
  }

  function handleSettingsClick(x, y, vs, audio) {
    if (vs._settingsCloseBtn && hitTest(x, y, vs._settingsCloseBtn)) {
      vs.settings.showPanel = false;
      audio?.play("buttonClick");
      return;
    }
    if (vs._settingsMuteToggle && hitTest(x, y, vs._settingsMuteToggle)) {
      vs.settings.muted = !vs.settings.muted;
      audio?.setMuted(vs.settings.muted);
      return;
    }
    if (vs._settingsSpeedBtns) {
      for (const btn of vs._settingsSpeedBtns) {
        if (hitTest(x, y, btn)) {
          vs.settings.animationSpeed = btn.speed;
          audio?.play("buttonClick");
          return;
        }
      }
    }
    if (vs._settingsExportBtn && hitTest(x, y, vs._settingsExportBtn)) {
      onScreenAction("exportData");
      return;
    }
    if (vs._settingsImportBtn && hitTest(x, y, vs._settingsImportBtn)) {
      onScreenAction("importData");
      return;
    }
    if (vs._settingsThemeBtn && hitTest(x, y, vs._settingsThemeBtn)) {
      onScreenAction("themeChange");
      return;
    }
    const layout = getLayout();
    if (!hitTest(x, y, layout.settingsPanel)) {
      vs.settings.showPanel = false;
    }
  }

  function handleMouseMove(e) {
    const vs = getVisualState();
    const screen = getScreen();
    if (screen !== "playing") { vs.hoverCardIndex = null; return; }

    const state = getState();
    const layout = getLayout();
    const animator = getAnimator();

    if (!state || state.gameStatus !== "playing" || vs.settings.showPanel || (animator && animator.isPlaying())) {
      vs.hoverCardIndex = null;
      return;
    }

    const { x, y } = getCSSCoords(e);
    vs.hoverCardIndex = null;

    for (let i = 0; i < state.room.length; i++) {
      const slot = layout.room[i];
      if (!slot) continue;
      if (hitTest(x, y, slot)) {
        vs.hoverCardIndex = i;
        const cardId = state.room[i];
        if (typeFromId(cardId) === "monster") {
          const monsterRank = rankFromId(cardId);
          const canWeapon = canUseWeapon(state, cardId);
          const weaponDmg = canWeapon ? calculateWeaponDamage(monsterRank, rankFromId(state.equippedWeapon), state.variantConfig) : 0;
          state._preview = { canWeapon, weaponDmg, barehandedDmg: monsterRank };
        }
        break;
      }
    }
  }

  function handleMouseLeave() {
    getVisualState().hoverCardIndex = null;
  }

  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("touchstart", handleClick, { passive: false });
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  return function cleanup() {
    canvas.removeEventListener("click", handleClick);
    canvas.removeEventListener("touchstart", handleClick);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
  };
}
