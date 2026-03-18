// Animation queue — tweening, easing, state-diff-driven card transitions.
// No game logic. Reads state diffs and queues visual effects.

// --- Easing functions ---
const easings = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  },
};

function applyEasing(name, t) {
  return (easings[name] || easings.linear)(t);
}

// --- Animator ---
export function createAnimator() {
  const cards = new Map();   // cardId -> { x, y, scaleX, scaleY, opacity, faceDown, shakeAmount }
  const tweens = [];         // active property tweens
  const callbacks = [];      // delayed callbacks
  const floats = [];         // floating damage/heal numbers
  let screenShakeAmount = 0;

  function initCard(id, x, y, opts = {}) {
    cards.set(id, {
      x, y,
      scaleX: 1, scaleY: 1,
      opacity: 1,
      faceDown: opts.faceDown ?? false,
      shakeAmount: 0,
      glowColor: null,
      glowAlpha: 0,
      ...opts,
    });
  }

  function addTween(target, prop, from, to, duration, easing = "easeOutCubic", delay = 0, onDone = null) {
    if (duration <= 0 && delay <= 0) {
      // Instant
      if (target && cards.has(target)) cards.get(target)[prop] = to;
      if (onDone) onDone();
      return;
    }
    tweens.push({ target, prop, from, to, duration: Math.max(1, duration), easing, delay, elapsed: 0, onDone, done: false });
  }

  function addCallback(delay, fn) {
    callbacks.push({ delay, elapsed: 0, fn, done: false });
  }

  function addFloat(text, color, x, y, duration = 800) {
    floats.push({ text, color, x, y, startY: y, elapsed: 0, duration });
  }

  function shake(amount) {
    screenShakeAmount = amount;
  }

  function update(dt) {
    // Tweens
    for (const t of tweens) {
      if (t.done) continue;
      t.elapsed += dt;
      if (t.elapsed < t.delay) continue;
      const progress = Math.min(1, (t.elapsed - t.delay) / t.duration);
      const eased = applyEasing(t.easing, progress);
      const value = t.from + (t.to - t.from) * eased;
      if (t.target && cards.has(t.target)) {
        cards.get(t.target)[t.prop] = value;
      }
      if (progress >= 1) {
        t.done = true;
        if (t.onDone) t.onDone();
      }
    }

    // Callbacks
    for (const c of callbacks) {
      if (c.done) continue;
      c.elapsed += dt;
      if (c.elapsed >= c.delay) {
        c.done = true;
        c.fn();
      }
    }

    // Floating texts
    for (const f of floats) {
      f.elapsed += dt;
    }

    // Screen shake decay
    if (screenShakeAmount > 0) {
      screenShakeAmount *= 0.88;
      if (screenShakeAmount < 0.3) screenShakeAmount = 0;
    }

    // Cleanup
    for (let i = tweens.length - 1; i >= 0; i--) {
      if (tweens[i].done) tweens.splice(i, 1);
    }
    for (let i = callbacks.length - 1; i >= 0; i--) {
      if (callbacks[i].done) callbacks.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      if (floats[i].elapsed >= floats[i].duration) floats.splice(i, 1);
    }

    // Remove cards with no active tweens
    for (const [id] of cards) {
      if (!tweens.some((t) => t.target === id)) {
        cards.delete(id);
      }
    }
  }

  function isPlaying() {
    return tweens.length > 0 || callbacks.length > 0;
  }

  function clear() {
    tweens.length = 0;
    callbacks.length = 0;
    floats.length = 0;
    cards.clear();
    screenShakeAmount = 0;
  }

  return {
    cards,
    floats,
    get screenShake() { return screenShakeAmount; },
    initCard,
    addTween,
    addCallback,
    addFloat,
    shake,
    update,
    isPlaying,
    clear,
  };
}

// --- Transition queueing (maps game events to animations) ---

export function queueTransitions(animator, prevState, newState, events, layout, cardRegistry, audio, speedMult) {
  const dur = (ms) => ms / speedMult;
  let delay = 0;

  // Find where a card was in the previous room
  function prevRoomSlot(cardId) {
    const idx = prevState.room.indexOf(cardId);
    return idx >= 0 ? layout.room[idx] : null;
  }

  for (const event of events) {
    switch (event.type) {
      case "WEAPON_EQUIPPED": {
        const from = prevRoomSlot(event.cardId) || layout.dungeon;
        const to = layout.weaponSlot;
        animator.initCard(event.cardId, from.x, from.y);
        animator.addTween(event.cardId, "x", from.x, to.x, dur(300), "easeOutCubic", delay);
        animator.addTween(event.cardId, "y", from.y, to.y, dur(300), "easeOutCubic", delay);
        // Snap scale
        animator.addTween(event.cardId, "scaleX", 1, 1.1, dur(100), "easeOutCubic", delay + dur(300));
        animator.addTween(event.cardId, "scaleY", 1, 1.1, dur(100), "easeOutCubic", delay + dur(300));
        animator.addTween(event.cardId, "scaleX", 1.1, 1, dur(150), "easeOutBack", delay + dur(400));
        animator.addTween(event.cardId, "scaleY", 1.1, 1, dur(150), "easeOutBack", delay + dur(400));
        audio?.play("weaponEquip");
        delay += dur(350);
        break;
      }

      case "WEAPON_HONED": {
        // Diamond slides to discard
        const honeFrom = prevRoomSlot(event.cardId) || layout.dungeon;
        const honeTo = layout.discard;
        animator.initCard(event.cardId, honeFrom.x, honeFrom.y);
        animator.addTween(event.cardId, "x", honeFrom.x, honeTo.x, dur(400), "easeOutCubic", delay);
        animator.addTween(event.cardId, "y", honeFrom.y, honeTo.y, dur(400), "easeOutCubic", delay);
        animator.addTween(event.cardId, "opacity", 1, 0.3, dur(400), "linear", delay);
        // Weapon glow + bounce to show it was honed
        const wSlot = layout.weaponSlot;
        if (wSlot && event.weaponId) {
          animator.initCard(event.weaponId, wSlot.x, wSlot.y);
          animator.addTween(event.weaponId, "glow", 0, 1, dur(200), "easeOutCubic", delay + dur(200));
          animator.addTween(event.weaponId, "glow", 1, 0, dur(300), "easeInCubic", delay + dur(400));
          animator.addTween(event.weaponId, "scaleX", 1, 1.12, dur(150), "easeOutCubic", delay + dur(200));
          animator.addTween(event.weaponId, "scaleY", 1, 1.12, dur(150), "easeOutCubic", delay + dur(200));
          animator.addTween(event.weaponId, "scaleX", 1.12, 1, dur(200), "easeOutBack", delay + dur(350));
          animator.addTween(event.weaponId, "scaleY", 1.12, 1, dur(200), "easeOutBack", delay + dur(350));
        }
        // Slain monsters slide to discard (degradation cleared)
        if (prevState.slainByWeapon) {
          for (let i = 0; i < prevState.slainByWeapon.length; i++) {
            const sid = prevState.slainByWeapon[i];
            const sx = layout.slainStack.x + i * layout.slainStack.offsetX;
            animator.initCard(sid, sx, layout.slainStack.y);
            animator.addTween(sid, "x", sx, honeTo.x, dur(400), "easeOutCubic", delay + dur(50));
            animator.addTween(sid, "y", layout.slainStack.y, honeTo.y, dur(400), "easeOutCubic", delay + dur(50));
            animator.addTween(sid, "opacity", 1, 0, dur(350), "linear", delay + dur(50));
          }
        }
        audio?.play("weaponHone");
        delay += dur(450);
        break;
      }

      case "WEAPON_DISCARDED": {
        // Old weapon + slain monsters slide to discard
        const from = layout.weaponSlot;
        const to = layout.discard;
        const discardId = event.cardId;
        animator.initCard(discardId, from.x, from.y);
        animator.addTween(discardId, "x", from.x, to.x, dur(400), "easeOutCubic", delay);
        animator.addTween(discardId, "y", from.y, to.y, dur(400), "easeOutCubic", delay);
        animator.addTween(discardId, "opacity", 1, 0.4, dur(400), "linear", delay);
        // Slain monsters follow
        if (prevState.slainByWeapon) {
          for (let i = 0; i < prevState.slainByWeapon.length; i++) {
            const sid = prevState.slainByWeapon[i];
            const sx = layout.slainStack.x + i * layout.slainStack.offsetX;
            animator.initCard(sid, sx, layout.slainStack.y);
            animator.addTween(sid, "x", sx, to.x, dur(400), "easeOutCubic", delay + dur(50));
            animator.addTween(sid, "y", layout.slainStack.y, to.y, dur(400), "easeOutCubic", delay + dur(50));
            animator.addTween(sid, "opacity", 1, 0, dur(350), "linear", delay + dur(50));
          }
        }
        delay += dur(200);
        break;
      }

      case "MONSTER_SLAIN": {
        const from = prevRoomSlot(event.cardId);
        if (!from) break;

        if (event.withWeapon) {
          // Slide to slain position (right of weapon, stacking rightward)
          const slainIdx = newState.slainByWeapon.indexOf(event.cardId);
          const toX = layout.slainStack.x + (slainIdx >= 0 ? slainIdx : 0) * layout.slainStack.offsetX;
          animator.initCard(event.cardId, from.x, from.y);
          animator.addTween(event.cardId, "x", from.x, toX, dur(350), "easeOutCubic", delay);
          animator.addTween(event.cardId, "y", from.y, layout.slainStack.y, dur(350), "easeOutCubic", delay);
          audio?.play("combatHit", { volume: 0.5 });
        } else {
          // Barehanded: shake, red flash, then slide to discard
          animator.initCard(event.cardId, from.x, from.y);
          animator.addTween(event.cardId, "shakeAmount", 6, 0, dur(250), "linear", delay);
          animator.addTween(event.cardId, "glowAlpha", 0.5, 0, dur(300), "linear", delay);
          animator.addCallback(delay, () => {
            const c = animator.cards.get(event.cardId);
            if (c) c.glowColor = "rgba(255,60,60,0.6)";
          });
          // Slide to discard after shake
          animator.addTween(event.cardId, "x", from.x, layout.discard.x, dur(300), "easeOutCubic", delay + dur(280));
          animator.addTween(event.cardId, "y", from.y, layout.discard.y, dur(300), "easeOutCubic", delay + dur(280));
          animator.addTween(event.cardId, "opacity", 1, 0.3, dur(250), "linear", delay + dur(330));
          audio?.play("combatHit", { volume: 0.8 });
        }
        delay += dur(300);
        break;
      }

      case "DAMAGE_TAKEN": {
        if (event.amount > 0) {
          // Float red number from the card that caused it
          const sourceEvent = events.find((e) => e.type === "MONSTER_SLAIN");
          let fx = layout.hud.width / 2;
          let fy = layout.hud.height + 20;
          if (sourceEvent) {
            const slot = prevRoomSlot(sourceEvent.cardId);
            if (slot) { fx = slot.x + slot.width / 2; fy = slot.y; }
          }
          animator.addFloat(`-${event.amount}`, "#f44336", fx, fy);
          // Screen shake for big damage
          if (event.amount >= 6) animator.shake(event.amount * 0.8);
        } else {
          const sourceEvent = events.find((e) => e.type === "MONSTER_SLAIN");
          let fx = layout.hud.width / 2;
          let fy = layout.hud.height + 20;
          if (sourceEvent) {
            const slot = prevRoomSlot(sourceEvent.cardId);
            if (slot) { fx = slot.x + slot.width / 2; fy = slot.y; }
          }
          animator.addFloat("Blocked", "#999", fx, fy);
        }
        break;
      }

      case "HEALED": {
        const from = prevRoomSlot(event.cardId);
        if (from) {
          animator.initCard(event.cardId, from.x, from.y);
          animator.addTween(event.cardId, "glowAlpha", 0.6, 0, dur(400), "linear", delay);
          animator.addCallback(delay, () => {
            const c = animator.cards.get(event.cardId);
            if (c) c.glowColor = "rgba(76,175,80,0.6)";
          });
          animator.addTween(event.cardId, "x", from.x, layout.discard.x, dur(350), "easeOutCubic", delay + dur(150));
          animator.addTween(event.cardId, "y", from.y, layout.discard.y, dur(350), "easeOutCubic", delay + dur(150));
          animator.addTween(event.cardId, "opacity", 1, 0.3, dur(300), "linear", delay + dur(200));
        }
        animator.addFloat(`+${event.amount}`, "#4caf50", layout.hud.x + layout.hud.width * 0.12, layout.hud.height + 10);
        audio?.play("potionDrink");
        delay += dur(300);
        break;
      }

      case "POTION_WASTED": {
        const from = prevRoomSlot(event.cardId);
        if (from) {
          animator.initCard(event.cardId, from.x, from.y, { opacity: 1 });
          animator.addTween(event.cardId, "opacity", 1, 0.3, dur(200), "linear", delay);
          animator.addTween(event.cardId, "x", from.x, layout.discard.x, dur(300), "easeOutCubic", delay + dur(100));
          animator.addTween(event.cardId, "y", from.y, layout.discard.y, dur(300), "easeOutCubic", delay + dur(100));
        }
        audio?.play("potionWaste");
        delay += dur(250);
        break;
      }

      case "ROOM_AVOIDED": {
        // Scoop all room cards toward center, then to dungeon
        const cx = layout.hud.width / 2;
        const cy = layout.room[0] ? layout.room[0].y + layout.cardSize.height / 2 : 200;
        for (let i = 0; i < prevState.room.length; i++) {
          const cardId = prevState.room[i];
          const slot = layout.room[i];
          if (!slot) continue;
          animator.initCard(cardId, slot.x, slot.y);
          // Phase 1: scoop toward center
          animator.addTween(cardId, "x", slot.x, cx - layout.cardSize.width / 2, dur(200), "easeOutCubic", delay);
          animator.addTween(cardId, "y", slot.y, cy, dur(200), "easeOutCubic", delay);
          // Phase 2: slide to dungeon
          animator.addTween(cardId, "x", cx - layout.cardSize.width / 2, layout.dungeon.x, dur(300), "easeOutCubic", delay + dur(200));
          animator.addTween(cardId, "y", cy, layout.dungeon.y, dur(300), "easeOutCubic", delay + dur(200));
          animator.addTween(cardId, "opacity", 1, 0, dur(200), "linear", delay + dur(300));
        }
        audio?.play("roomAvoid");
        delay += dur(500);
        break;
      }

      case "ROOM_FILLED": {
        // New cards slide from dungeon to room slots with flip
        const prevRoomSet = new Set(prevState.room);
        for (let i = 0; i < newState.room.length; i++) {
          const cardId = newState.room[i];
          if (prevRoomSet.has(cardId)) {
            // Existing card may have shifted position
            const prevIdx = prevState.room.indexOf(cardId);
            const prevSlot = layout.room[prevIdx];
            const newSlot = layout.room[i];
            if (prevSlot && newSlot && prevIdx !== i) {
              animator.initCard(cardId, prevSlot.x, prevSlot.y);
              animator.addTween(cardId, "x", prevSlot.x, newSlot.x, dur(250), "easeOutCubic", delay);
              animator.addTween(cardId, "y", prevSlot.y, newSlot.y, dur(250), "easeOutCubic", delay);
            }
          } else {
            // New card from dungeon — slide + flip
            const slot = layout.room[i];
            if (!slot) continue;
            const stagger = i * dur(80);
            animator.initCard(cardId, layout.dungeon.x, layout.dungeon.y, { faceDown: true });
            // Slide
            animator.addTween(cardId, "x", layout.dungeon.x, slot.x, dur(400), "easeOutCubic", delay + stagger);
            animator.addTween(cardId, "y", layout.dungeon.y, slot.y, dur(400), "easeOutCubic", delay + stagger);
            // Flip: compress scaleX to 0, swap faceDown, expand back
            animator.addTween(cardId, "scaleX", 1, 0, dur(120), "easeOutCubic", delay + stagger + dur(100));
            animator.addCallback(delay + stagger + dur(220), () => {
              const c = animator.cards.get(cardId);
              if (c) c.faceDown = false;
            });
            animator.addTween(cardId, "scaleX", 0, 1, dur(120), "easeOutCubic", delay + stagger + dur(220));
            audio?.play("cardFlip", { delay: (delay + stagger + dur(200)) / 1000 });
          }
        }
        delay += dur(500);
        break;
      }

      case "GAME_WON": {
        audio?.play("gameWin");
        break;
      }

      case "GAME_LOST": {
        animator.shake(8);
        audio?.play("gameLoss");
        break;
      }

      case "NEW_GAME": {
        animator.clear();
        // Animate initial room cards from dungeon with flip
        for (let i = 0; i < newState.room.length; i++) {
          const cardId = newState.room[i];
          const slot = layout.room[i];
          if (!slot) continue;
          const stagger = i * dur(100);
          animator.initCard(cardId, layout.dungeon.x, layout.dungeon.y, { faceDown: true });
          animator.addTween(cardId, "x", layout.dungeon.x, slot.x, dur(400), "easeOutCubic", stagger);
          animator.addTween(cardId, "y", layout.dungeon.y, slot.y, dur(400), "easeOutCubic", stagger);
          animator.addTween(cardId, "scaleX", 1, 0, dur(120), "easeOutCubic", stagger + dur(100));
          animator.addCallback(stagger + dur(220), () => {
            const c = animator.cards.get(cardId);
            if (c) c.faceDown = false;
          });
          animator.addTween(cardId, "scaleX", 0, 1, dur(120), "easeOutCubic", stagger + dur(220));
        }
        delay += dur(600);
        break;
      }

      // TURN_COMPLETE and WEAPON_USED don't need their own animations
      default:
        break;
    }
  }
}
