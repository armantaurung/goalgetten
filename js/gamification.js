/**
 * Gamification, XP Engine, Audio Feedback, and Confetti System
 */

class SoundEffects {
  static ctx = null;

  static init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
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
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
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
    const stats = AppStorage.getUserStats();
    stats.xp += amount;

    if (sourceElement) {
      this.showXPFloat(amount, sourceElement);
    }

    let leveledUp = false;
    while (stats.xp >= stats.xpToNextLevel) {
      stats.xp -= stats.xpToNextLevel;
      stats.level += 1;
      stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.35);
      const titleIndex = Math.min(stats.level - 1, LEVEL_TITLES.length - 1);
      stats.title = LEVEL_TITLES[titleIndex];
      leveledUp = true;
    }

    AppStorage.saveUserStats(stats);
    this.updateUIStats();

    if (leveledUp) {
      SoundEffects.playLevelUp();
      ConfettiEngine.launch(3000);
      App.showToast(`🎉 Level Up! Anda sekarang Level ${stats.level} (${stats.title})!`, 'success');
    }

    this.checkBadges();
  }

  static showXPFloat(amount, el) {
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
  }

  static updateUIStats() {
    const stats = AppStorage.getUserStats();
    const levelBadge = document.getElementById('user-level-badge');
    const xpText = document.getElementById('user-xp-text');
    const xpBar = document.getElementById('user-xp-bar');
    const userTitle = document.getElementById('user-level-title');

    if (levelBadge) levelBadge.textContent = `Lv. ${stats.level}`;
    if (xpText) xpText.textContent = `${stats.xp} / ${stats.xpToNextLevel} XP`;
    if (xpBar) {
      const percentage = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));
      xpBar.style.width = `${percentage}%`;
    }
    if (userTitle) userTitle.textContent = stats.title;
  }

  static checkBadges() {
    const habits = AppStorage.getHabits();
    const goals = AppStorage.getGoals();
    const badges = AppStorage.getBadges();
    let newlyUnlocked = false;

    const maxStreak = Math.max(...habits.map(h => h.streak), 0);
    const hasCompletedGoal = goals.some(g => g.milestones.length > 0 && g.milestones.every(m => m.done));

    badges.forEach(b => {
      if (!b.unlocked) {
        if (b.id === 'streak_3' && maxStreak >= 3) {
          b.unlocked = true;
          b.unlockedAt = new Date().toISOString().slice(0, 10);
          newlyUnlocked = b;
        } else if (b.id === 'streak_7' && maxStreak >= 7) {
          b.unlocked = true;
          b.unlockedAt = new Date().toISOString().slice(0, 10);
          newlyUnlocked = b;
        } else if (b.id === 'streak_30' && maxStreak >= 30) {
          b.unlocked = true;
          b.unlockedAt = new Date().toISOString().slice(0, 10);
          newlyUnlocked = b;
        } else if (b.id === 'goal_slayer' && hasCompletedGoal) {
          b.unlocked = true;
          b.unlockedAt = new Date().toISOString().slice(0, 10);
          newlyUnlocked = b;
        }
      }
    });

    if (newlyUnlocked) {
      AppStorage.saveBadges(badges);
      SoundEffects.playLevelUp();
      ConfettiEngine.launch(2500);
      App.showToast(`🏆 Lencana Baru Terbuka: ${newlyUnlocked.name}!`, 'success');
      App.renderBadges();
    }
  }
}
