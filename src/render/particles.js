// Lightweight particle system for visual effects.

export function createParticleSystem() {
  const particles = [];

  function emit(x, y, config = {}) {
    const {
      count = 10,
      color = "#4caf50",
      speed = 80,
      lifetime = 600,
      size = 3,
      gravity = 60,
      spread = Math.PI * 2,
      angle = -Math.PI / 2,
    } = config;

    for (let i = 0; i < count; i++) {
      const dir = angle + (Math.random() - 0.5) * spread;
      const spd = speed * (0.5 + Math.random() * 0.5);
      particles.push({
        x,
        y,
        vx: Math.cos(dir) * spd,
        vy: Math.sin(dir) * spd,
        color,
        size: size * (0.7 + Math.random() * 0.6),
        life: 0,
        maxLife: lifetime * (0.7 + Math.random() * 0.3),
        gravity,
      });
    }
  }

  function update(dt) {
    const dtSec = dt / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dtSec;
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
    }
  }

  function draw(ctx) {
    for (const p of particles) {
      const progress = p.life / p.maxLife;
      const alpha = 1 - progress;
      const currentSize = p.size * (1 - progress * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function isActive() {
    return particles.length > 0;
  }

  return { emit, update, draw, isActive };
}
