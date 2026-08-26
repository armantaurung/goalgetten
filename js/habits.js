/**
 * Habits Management Module
 */

class HabitsManager {
  static activeCategory = 'all';
  static selectedDate = new Date().toISOString().slice(0, 10);

  static init() {
    this.renderCategoryTabs();
    this.renderDateStrip();
    this.renderHabits();
  }

  static getCategories() {
    return ['all', 'Kesehatan', 'Produktivitas', 'Belajar', 'Kebugaran', 'Mindset', 'Finansial'];
  }

  static renderCategoryTabs() {
    const container = document.getElementById('habit-category-tabs');
    if (!container) return;

    const categories = this.getCategories();
    container.innerHTML = categories.map(cat => `
      <button class="cat-tab ${cat === this.activeCategory ? 'active' : ''}" onclick="HabitsManager.setCategory('${cat}')">
        ${cat === 'all' ? '✨ Semua Kategori' : cat}
      </button>
    `).join('');
  }

  static setCategory(cat) {
    this.activeCategory = cat;
    this.renderCategoryTabs();
    this.renderHabits();
  }

  static renderDateStrip() {
    const row = document.getElementById('date-days-row');
    if (!row) return;

    const today = new Date();
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Generate 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        iso: iso,
        name: dayNames[d.getDay()],
        num: d.getDate(),
        isToday: i === 0
      });
    }

    const habits = AppStorage.getHabits();

    row.innerHTML = days.map(d => {
      const hasAnyCompleted = habits.some(h => h.history && h.history[d.iso]);
      const isActive = d.iso === this.selectedDate;

      return `
        <div class="date-pill ${isActive ? 'active' : ''} ${hasAnyCompleted ? 'has-completed' : ''}" onclick="HabitsManager.selectDate('${d.iso}')">
          <span class="day-name">${d.name}</span>
          <span class="day-number">${d.num}</span>
          <span class="day-dot"></span>
        </div>
      `;
    }).join('');
  }

  static selectDate(iso) {
    this.selectedDate = iso;
    this.renderDateStrip();
    this.renderHabits();

    const titleEl = document.getElementById('active-date-label');
    if (titleEl) {
      const isToday = iso === new Date().toISOString().slice(0, 10);
      titleEl.textContent = isToday ? 'Hari Ini' : iso;
    }
  }

  static renderHabits() {
    const list = document.getElementById('habits-list');
    if (!list) return;

    let habits = AppStorage.getHabits();

    if (this.activeCategory !== 'all') {
      habits = habits.filter(h => h.category.toLowerCase() === this.activeCategory.toLowerCase());
    }

    if (habits.length === 0) {
      list.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌱</div>
          <h4>Belum ada habit di kategori ini</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Klik tombol <strong>+ Habit Baru</strong> untuk mulai membangun kebiasaan!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = habits.map(h => {
      const isDone = Boolean(h.history && h.history[this.selectedDate]);
      const isFire = h.streak >= 3;

      return `
        <div class="habit-card ${isDone ? 'completed' : ''}" style="--habit-color: ${h.color || 'var(--accent-primary)'};">
          <div class="habit-top">
            <div class="habit-meta">
              <div class="habit-icon-box">
                ${h.icon || '🎯'}
              </div>
              <div class="habit-details">
                <h4>${h.title}</h4>
                <span class="habit-badge-tag">${h.category} • ${h.time || 'Fleksibel'}</span>
              </div>
            </div>
            <button class="habit-check-btn" title="${isDone ? 'Batal Selesai' : 'Tandai Selesai'}" onclick="HabitsManager.toggleHabit('${h.id}', event)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>

          <div class="habit-bottom">
            <div class="streak-pill ${isFire ? 'on-fire' : ''}">
              ${isFire ? '🔥' : '⚡'} <span>${h.streak} Hari Streak</span>
            </div>
            <div class="habit-card-actions">
              <button class="action-btn-sm" title="Edit Habit" onclick="HabitsManager.openEditModal('${h.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="action-btn-sm" title="Hapus Habit" onclick="HabitsManager.deleteHabit('${h.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.updateMetrics();
  }

  static toggleHabit(habitId, event) {
    const habits = AppStorage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.history) habit.history = {};

    const currentlyDone = Boolean(habit.history[this.selectedDate]);
    habit.history[this.selectedDate] = !currentlyDone;

    // Recalculate streak
    this.recalculateStreak(habit);

    AppStorage.saveHabits(habits);
    this.renderHabits();
    this.renderDateStrip();

    if (!currentlyDone) {
      SoundEffects.playPop();
      GamificationManager.addXP(25, event ? event.currentTarget : null);
      App.showToast(`✨ Hebat! Habit "${habit.title}" selesai! (+25 XP)`, 'success');
    }

    if (window.AnalyticsManager) {
      AnalyticsManager.renderAll();
    }
  }

  static recalculateStreak(habit) {
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);

      if (habit.history && habit.history[iso]) {
        currentStreak++;
      } else if (i === 0) {
        // Today not done yet is fine, streak continues from yesterday
        continue;
      } else {
        break;
      }
    }

    habit.streak = currentStreak;
    habit.bestStreak = Math.max(habit.bestStreak || 0, currentStreak);
  }

  static updateMetrics() {
    const habits = AppStorage.getHabits();
    const todayIso = new Date().toISOString().slice(0, 10);
    const completedToday = habits.filter(h => h.history && h.history[todayIso]).length;
    const totalHabits = habits.length;

    const rate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const maxStreak = Math.max(...habits.map(h => h.streak), 0);

    const elStreak = document.getElementById('metric-longest-streak');
    const elRate = document.getElementById('metric-completion-rate');
    const elToday = document.getElementById('metric-habits-today');

    if (elStreak) elStreak.textContent = `${maxStreak} Hari`;
    if (elRate) elRate.textContent = `${rate}%`;
    if (elToday) elToday.textContent = `${completedToday}/${totalHabits}`;
  }

  static openAddModal() {
    document.getElementById('habit-modal-title').textContent = 'Tambah Habit Baru';
    document.getElementById('habit-form').reset();
    document.getElementById('habit-id-input').value = '';
    App.openModal('habit-modal');
  }

  static openEditModal(id) {
    const habit = AppStorage.getHabits().find(h => h.id === id);
    if (!habit) return;

    document.getElementById('habit-modal-title').textContent = 'Edit Habit';
    document.getElementById('habit-id-input').value = habit.id;
    document.getElementById('habit-title-input').value = habit.title;
    document.getElementById('habit-category-input').value = habit.category;
    document.getElementById('habit-time-input').value = habit.time || '08:00';
    document.getElementById('habit-color-input').value = habit.color || '#6366f1';
    document.getElementById('habit-icon-input').value = habit.icon || '🎯';

    App.openModal('habit-modal');
  }

  static saveHabitFromForm(e) {
    e.preventDefault();
    const id = document.getElementById('habit-id-input').value;
    const title = document.getElementById('habit-title-input').value.trim();
    const category = document.getElementById('habit-category-input').value;
    const time = document.getElementById('habit-time-input').value;
    const color = document.getElementById('habit-color-input').value;
    const icon = document.getElementById('habit-icon-input').value || '🎯';

    if (!title) return;

    const habits = AppStorage.getHabits();

    if (id) {
      // Edit existing
      const habit = habits.find(h => h.id === id);
      if (habit) {
        habit.title = title;
        habit.category = category;
        habit.time = time;
        habit.color = color;
        habit.icon = icon;
      }
      App.showToast('Habit berhasil diperbarui!', 'success');
    } else {
      // Create new
      const newHabit = {
        id: 'habit-' + Date.now(),
        title,
        category,
        time,
        color,
        icon,
        frequency: 'daily',
        streak: 0,
        bestStreak: 0,
        history: {},
        createdAt: new Date().toISOString().slice(0, 10)
      };
      habits.push(newHabit);
      App.showToast('Habit baru berhasil ditambahkan!', 'success');
      GamificationManager.addXP(15);
    }

    AppStorage.saveHabits(habits);
    this.renderHabits();
    this.renderDateStrip();
    App.closeModal('habit-modal');
  }

  static deleteHabit(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus habit ini?')) return;

    let habits = AppStorage.getHabits();
    habits = habits.filter(h => h.id !== id);
    AppStorage.saveHabits(habits);
    this.renderHabits();
    this.renderDateStrip();
    App.showToast('Habit berhasil dihapus', 'info');
  }
}
