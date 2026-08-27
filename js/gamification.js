/**
 * Gamification, XP Engine, Audio Feedback, and Confetti System
 * GoalGetten 🎯 Habit & Goal Mastery
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

  // Timer complete chime
  static playTimerFinish() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.12);
        osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {}
  }
}

class ConfettiEngine {
  static launch(duration = 2500) {
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
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#fbbf24', '#06b6d4', '#f97316'];

      for (let i = 0; i < 110; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.55,
          r: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.85) * 18,
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
          p.vy += 0.45; // gravity

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
  'Novice Starter 🌱',
  'Apprentice Habit ⚡',
  'Momentum Builder 🚀',
  'Consistent Achiever 🔥',
  'Focus Warrior ⚔️',
  'Discipline Architect 🏛️',
  'Habit Master 💎',
  'Goal Slayer 🎯',
  'Peak Performer 👑',
  'Legendary Goalgetter 🌟'
];

class GamificationManager {
  static XP_PER_LEVEL = 100;

  static getLevelInfo() {
    const totalXP = window.StorageManager ? StorageManager.getXP() : 0;
    const level = Math.floor(totalXP / this.XP_PER_LEVEL) + 1;
    const currentLevelXP = totalXP % this.XP_PER_LEVEL;
    const progressPercent = Math.min(100, Math.round((currentLevelXP / this.XP_PER_LEVEL) * 100));
    const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
    const title = LEVEL_TITLES[titleIndex];

    return {
      level,
      totalXP,
      currentLevelXP,
      nextLevelXP: this.XP_PER_LEVEL,
      progressPercent,
      title
    };
  }

  static renderLevelWidget() {
    const info = this.getLevelInfo();

    // 1. Top Nav Bar Level Pill
    const topWidget = document.getElementById('top-level-gamification-widget');
    if (topWidget) {
      topWidget.innerHTML = `
        <div class="gamify-top-pill" title="Level ${info.level} • ${info.currentLevelXP}/${info.nextLevelXP} XP menuju level berikutnya">
          <div class="gamify-level-badge">LV ${info.level}</div>
          <div class="gamify-xp-track-box">
            <div class="gamify-xp-meta">
              <span class="gamify-title-label">${info.title}</span>
              <span class="gamify-xp-numbers">${info.currentLevelXP}/${info.nextLevelXP} XP</span>
            </div>
            <div class="gamify-progress-track">
              <div class="gamify-progress-fill" style="width: ${info.progressPercent}%;"></div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Sidebar Gamification Card
    const sidebarWidget = document.getElementById('sidebar-gamification-widget');
    if (sidebarWidget) {
      sidebarWidget.innerHTML = `
        <div class="sidebar-gamify-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="sidebar-gamify-level">⭐ Level ${info.level}</span>
            <span class="sidebar-gamify-xp">${info.totalXP} Total XP</span>
          </div>
          <div class="sidebar-gamify-title">${info.title}</div>
          <div class="sidebar-progress-track">
            <div class="sidebar-progress-fill" style="width: ${info.progressPercent}%;"></div>
          </div>
        </div>
      `;
    }
  }

  static addXP(amount, sourceElement = null) {
    try {
      const prevInfo = this.getLevelInfo();
      const newTotalXP = window.StorageManager ? StorageManager.addXP(amount) : amount;
      const newLevel = Math.floor(newTotalXP / this.XP_PER_LEVEL) + 1;

      if (sourceElement) {
        this.showXPFloat(amount, sourceElement);
      }

      this.renderLevelWidget();

      if (newLevel > prevInfo.level) {
        // Level up celebration!
        SoundEffects.playLevelUp();
        ConfettiEngine.launch(4000);
        const titleIndex = Math.min(newLevel - 1, LEVEL_TITLES.length - 1);
        const newTitle = LEVEL_TITLES[titleIndex];
        if (window.GoalGettenApp && GoalGettenApp.showToast) {
          GoalGettenApp.showToast(`🎉 NAIK LEVEL ${newLevel}! Gelar: "${newTitle}"`, 'success', 5000);
        }
      } else {
        SoundEffects.playPop();
      }
    } catch (e) {
      console.warn('XP add error:', e);
    }
  }

  static showXPFloat(amount, el) {
    try {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.className = 'xp-float-tag';
      tag.textContent = `+${amount} XP`;
      tag.style.position = 'fixed';
      tag.style.left = `${rect.left + rect.width / 2}px`;
      tag.style.top = `${rect.top - 10}px`;
      tag.style.zIndex = '999999';
      document.body.appendChild(tag);

      setTimeout(() => {
        if (tag.parentNode) tag.parentNode.removeChild(tag);
      }, 1000);
    } catch (e) {}
  }
}

/**
 * ============================================================================
 * Ambient Sound Engine (Web Audio API Synthesizer)
 * ============================================================================
 */
class AmbientSoundEngine {
  static ctx = null;
  static currentSource = null;
  static gainNode = null;
  static currentType = 'mute';
  static currentVolume = 0.3;
  static tickInterval = null;

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

  static setSound(type, volume = 0.3) {
    this.init();
    this.stop();
    this.currentType = type;
    this.currentVolume = volume;

    if (!this.ctx || type === 'mute') return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === 'white-noise') {
      this.playWhiteNoise();
    } else if (type === 'rain') {
      this.playRain();
    } else if (type === 'clock-tick') {
      this.playClockTick();
    }
  }

  static playWhiteNoise() {
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.2;
      }

      this.currentSource = this.ctx.createBufferSource();
      this.currentSource.buffer = noiseBuffer;
      this.currentSource.loop = true;

      // Soft lowpass filter to make white noise soothing
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.currentSource.connect(filter);
      filter.connect(this.gainNode);
      this.currentSource.start();
    } catch (e) {}
  }

  static playRain() {
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 2.5;
      }

      this.currentSource = this.ctx.createBufferSource();
      this.currentSource.buffer = noiseBuffer;
      this.currentSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.currentSource.connect(filter);
      filter.connect(this.gainNode);
      this.currentSource.start();
    } catch (e) {}
  }

  static playClockTick() {
    try {
      const tick = () => {
        if (this.currentType !== 'clock-tick' || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const tickGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        tickGain.gain.setValueAtTime(this.currentVolume * 0.4, this.ctx.currentTime);
        tickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        osc.connect(tickGain);
        tickGain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      };

      tick();
      this.tickInterval = setInterval(tick, 1000);
    } catch (e) {}
  }

  static setVolume(vol) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  static stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
}

/**
 * ============================================================================
 * Achievements & Badges Showcase Manager 🏆
 * ============================================================================
 */
const BADGES_DATABASE = [
  {
    id: 'first_step',
    icon: '🌱',
    title: 'Langkah Pertama',
    desc: 'Selesaikan 1 check-in kebiasaan pertama Anda.',
    check: (habits, goals, xp) => {
      let total = 0;
      habits.forEach(h => {
        if (h.history) total += Object.values(h.history).filter(Boolean).length;
      });
      return { unlocked: total >= 1, progress: Math.min(100, Math.round((total / 1) * 100)), current: total, target: 1 };
    }
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'Flame 3 Hari',
    desc: 'Pertahankan streak 3 hari beruntun pada habit apapun.',
    check: (habits) => {
      const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
      return { unlocked: maxStreak >= 3, progress: Math.min(100, Math.round((maxStreak / 3) * 100)), current: maxStreak, target: 3 };
    }
  },
  {
    id: 'streak_7',
    icon: '⚡',
    title: 'Weekly Warrior',
    desc: 'Pertahankan streak 7 hari beruntun tanpa putus.',
    check: (habits) => {
      const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
      return { unlocked: maxStreak >= 7, progress: Math.min(100, Math.round((maxStreak / 7) * 100)), current: maxStreak, target: 7 };
    }
  },
  {
    id: 'habit_21',
    icon: '💎',
    title: 'Habit Builder 21D',
    desc: 'Mencapai streak 21 hari (Titik pembentukan kebiasaan otomatis).',
    check: (habits) => {
      const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
      return { unlocked: maxStreak >= 21, progress: Math.min(100, Math.round((maxStreak / 21) * 100)), current: maxStreak, target: 21 };
    }
  },
  {
    id: 'harvest_30',
    icon: '🍊',
    title: 'Master Panen Jeruk',
    desc: 'Akumulasikan 30 hari check-in pada satu habit hingga pohon berbuah emas.',
    check: (habits) => {
      let maxCount = 0;
      habits.forEach(h => {
        if (h.history) {
          const c = Object.values(h.history).filter(Boolean).length;
          if (c > maxCount) maxCount = c;
        }
      });
      return { unlocked: maxCount >= 30, progress: Math.min(100, Math.round((maxCount / 30) * 100)), current: maxCount, target: 30 };
    }
  },
  {
    id: 'goal_slayer',
    icon: '🎯',
    title: 'Goal Slayer 100%',
    desc: 'Selesaikan seluruh sub-goal pada satu Goal Utama.',
    check: (habits, goals) => {
      const finishedGoal = goals.some(g => g.subgoals && g.subgoals.length > 0 && g.subgoals.every(s => s.done));
      return { unlocked: finishedGoal, progress: finishedGoal ? 100 : 0, current: finishedGoal ? 1 : 0, target: 1 };
    }
  },
  {
    id: 'century_100',
    icon: '👑',
    title: 'Century Club (100x)',
    desc: 'Akumulasi total 100 check-in habit di seluruh rutinitas.',
    check: (habits) => {
      let total = 0;
      habits.forEach(h => {
        if (h.history) total += Object.values(h.history).filter(Boolean).length;
      });
      return { unlocked: total >= 100, progress: Math.min(100, Math.round((total / 100) * 100)), current: total, target: 100 };
    }
  },
  {
    id: 'level_5',
    icon: '⭐',
    title: 'Rising Champion (LV 5)',
    desc: 'Kumpulkan 400+ XP dan capai Level 5.',
    check: (habits, goals, xp) => {
      const level = Math.floor(xp / 100) + 1;
      return { unlocked: level >= 5, progress: Math.min(100, Math.round((xp / 400) * 100)), current: level, target: 5 };
    }
  },
  {
    id: 'deep_work',
    icon: '⏳',
    title: 'Deep Work Pioneer',
    desc: 'Akumulasikan total 10+ jam waktu fokus latihan.',
    check: (habits) => {
      let totalMinutes = 0;
      habits.forEach(h => {
        if (h.history) {
          const count = Object.values(h.history).filter(Boolean).length;
          totalMinutes += count * (h.duration || 15);
        }
      });
      const hours = (totalMinutes / 60);
      return { unlocked: hours >= 10, progress: Math.min(100, Math.round((hours / 10) * 100)), current: hours.toFixed(1), target: 10 };
    }
  }
];

class AchievementsManager {
  static getBadgesStatus() {
    const habits = window.StorageManager ? StorageManager.getHabits() : [];
    const goals = window.StorageManager ? StorageManager.getGoals() : [];
    const xp = window.StorageManager ? StorageManager.getXP() : 0;

    return BADGES_DATABASE.map(badge => {
      const res = badge.check(habits, goals, xp);
      return {
        ...badge,
        unlocked: res.unlocked,
        progress: res.progress,
        current: res.current,
        target: res.target
      };
    });
  }

  static openAchievementsModal() {
    const badges = this.getBadgesStatus();
    const unlockedCount = badges.filter(b => b.unlocked).length;
    const totalCount = badges.length;
    const overallRate = Math.round((unlockedCount / totalCount) * 100);

    const container = document.getElementById('achievements-grid-view');
    const countEl = document.getElementById('achievements-unlocked-count');
    const barEl = document.getElementById('achievements-overall-bar');

    if (countEl) countEl.textContent = `${unlockedCount} / ${totalCount} Lencana Terbuka (${overallRate}%)`;
    if (barEl) barEl.style.width = `${overallRate}%`;

    if (container) {
      container.innerHTML = badges.map(b => `
        <div class="badge-card-glass ${b.unlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon-box">
            <span class="badge-icon">${b.icon}</span>
            ${b.unlocked ? '<span class="badge-unlocked-tick">✓</span>' : '<span class="badge-locked-lock">🔒</span>'}
          </div>
          <div class="badge-info-box">
            <div class="badge-title-row">
              <h4>${b.title}</h4>
              <span class="badge-status-tag ${b.unlocked ? 'unlocked' : 'locked'}">${b.unlocked ? 'TERBUKA' : 'TERKUNCI'}</span>
            </div>
            <p class="badge-desc">${b.desc}</p>
            <div class="badge-progress-wrap">
              <div class="badge-progress-bar">
                <div class="badge-progress-fill" style="width: ${b.progress}%;"></div>
              </div>
              <span class="badge-progress-label">${b.current} / ${b.target} (${b.progress}%)</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    const modal = document.getElementById('modal-achievements');
    if (modal) modal.classList.add('active');
  }

  static closeAchievementsModal() {
    const modal = document.getElementById('modal-achievements');
    if (modal) modal.classList.remove('active');
  }
}

// Attach globally
window.SoundEffects = SoundEffects;
window.ConfettiEngine = ConfettiEngine;
window.GamificationManager = GamificationManager;
window.AmbientSoundEngine = AmbientSoundEngine;
window.AchievementsManager = AchievementsManager;
