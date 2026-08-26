/**
 * Gamification, XP Engine, Audio Feedback, and Confetti System
 */

class SoundEffects {
  static ctx = null;

  static init() {
    if (!this.ctx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      } catch (e) {}
    }
  }

  // Soft satisfying pop for habit tick
  static playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Triumphant Level-Up Chime
  static playLevelUp() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }

  // Milestone Ding
  static playDing() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

class ConfettiEngine {
  static launch(duration = 2000) {
    try {
      let canvas = document.getElementById('confetti-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999999';
        document.body.appendChild(canvas);
      }

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#fbbf24', '#06b6d4'];

      for (let i = 0; i < 90; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.6,
          r: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.8) * 16,
          tilt: Math.random() * 10 - 10,
          tiltAngleInc: (Math.random() * 0.07) + 0.05,
          tiltAngle: 0
        });
      }

      const startTime = Date.now();

      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const elapsed = Date.now() - startTime;

        particles.forEach(p => {
          p.tiltAngle += p.tiltAngleInc;
          p.y += p.vy;
          p.x += p.vx;
          p.vy += 0.4; // gravity

          ctx.beginPath();
          ctx.lineWidth = p.r / 2;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
          ctx.stroke();
        });

        if (elapsed < duration) {
          requestAnimationFrame(render);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      render();
    } catch (e) {}
  }
}

const LEVEL_TITLES = [
  'Novice Starter',
  'Apprentice Habit',
  'Consistent Achiever',
  'Momentum Builder',
  'Focus Warrior',
  'Habit Master',
  'Goal Slayer',
  'Discipline Architect',
  'Peak Performer',
  'Legendary Goalgetter'
];

class GamificationManager {
  static addXP(amount, sourceElement = null) {
    try {
      if (sourceElement) {
        this.showXPFloat(amount, sourceElement);
      }
      SoundEffects.playPop();
    } catch (e) {}
  }

  static showXPFloat(amount, el) {
    try {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.className = 'xp-float-tag';
      tag.textContent = `+${amount} XP`;
      tag.style.left = `${rect.left + rect.width / 2}px`;
      tag.style.top = `${rect.top - 10}px`;
      document.body.appendChild(tag);

      setTimeout(() => {
        if (tag.parentNode) tag.parentNode.removeChild(tag);
      }, 1000);
    } catch (e) {}
  }
}

// Attach globally
window.SoundEffects = SoundEffects;
window.ConfettiEngine = ConfettiEngine;
window.GamificationManager = GamificationManager;
