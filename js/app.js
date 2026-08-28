/**
 * GoalGetten 🎯 Master Controller
 * Full Implementation — Habit Tracker, Goal Manager, AI Coach, Orange Tree & Focus Timer
 */

class GoalGettenApp {
  static currentTab = 'fokus-hari-ini';
  static todayIso = new Date().toISOString().slice(0, 10);
  static parsedMassHabits = [];

  static INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  static INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  static INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  static INDO_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  static calendarViewMode = 'monthly'; // 'monthly' or 'timeline'
  static calendarYear = new Date().getFullYear();

  // Search and Filtering State
  static searchQuery = '';
  static currentStatusFilter = 'all'; // 'all', 'pending', 'completed'
  static currentCategoryFilter = 'all';

  // Project Management Filtering State
  static currentProjectStatusFilter = 'all'; // 'all', 'in-progress', 'completed'
  static currentProjectCategoryFilter = 'all';
  static currentProjectPriorityFilter = 'all';
  static currentProjectSearch = '';

  // Focus Pomodoro Timer State
  static activeTimerHabit = null;
  static timerTotalSeconds = 900;
  static timerRemainingSeconds = 900;
  static timerInterval = null;
  static isTimerRunning = false;

  static formatIndonesianDate(isoOrDate) {
    const d = new Date(isoOrDate);
    return `${this.INDO_DAYS[d.getDay()]}, ${d.getDate()} ${this.INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  static formatIndonesianShort(isoOrDate) {
    const d = new Date(isoOrDate);
    return `${d.getDate()} ${this.INDO_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  static init() {
    try {
      this.currentSortMode = (window.StorageManager ? StorageManager.getSortMode() : null) || 'time-24h';
      const sortSelect = document.getElementById('habit-sort-select');
      if (sortSelect) sortSelect.value = this.currentSortMode;
    } catch (e) { console.warn('Sort mode init error:', e); }
    try { this.applyTheme(); } catch (e) { console.warn('Theme init error:', e); }
    try { this.bindNavigation(); } catch (e) { console.warn('Nav bind error:', e); }
    try { this.bindModals(); } catch (e) { console.warn('Modals bind error:', e); }
    try { this.bindMassUpload(); } catch (e) { console.warn('Mass upload bind error:', e); }
    try { this.bindKeyboardShortcuts(); } catch (e) { console.warn('Shortcuts bind error:', e); }
    try {
      if (window.AuthManager) AuthManager.init();
    } catch (e) { console.warn('Auth init error:', e); }
    try {
      if (window.AICoachManager) AICoachManager.init();
    } catch (e) { console.warn('AI Coach init error:', e); }
    try { this.renderAll(); } catch (e) { console.error('Render error:', e); }
  }

  static bindNavigation() {
    document.querySelectorAll('.nav-list .nav-item a[data-tab]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active', sidebar.classList.contains('open'));
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }
  }

  static switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.querySelectorAll('.page-section').forEach(sec => {
      if (sec.id === `section-${tabId}`) {
        sec.style.display = 'block';
        sec.classList.add('tab-fade-in');
      } else {
        sec.style.display = 'none';
        sec.classList.remove('tab-fade-in');
      }
    });

    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');

    this.renderAll();
  }

  static renderAll() {
    if (window.GamificationManager) {
      GamificationManager.renderLevelWidget();
    }
    this.renderTopSproutWidget();
    this.renderSummaryStats();

    switch (this.currentTab) {
      case 'fokus-hari-ini': this.renderFokusHariIni(); break;
      case 'daftar-goal': this.renderDaftarGoals(); break;
      case 'proyek-tugas': this.renderProjectsTab(); break;
      case 'matriks-habit': this.renderMatriksHabit(); break;
      case 'progres-ringkas': this.renderProgresRingkas(); break;
      case 'kalender-rutinitas': this.renderKalenderRutinitas(); break;
      case 'analisis-cal': this.renderAnalytics(); break;
    }
  }

  // =========================================================================
  // 1. Tunas Kebiasaan Baru Disiram 🌱 Widget
  // =========================================================================
  static renderTopSproutWidget() {
    const habits = StorageManager.getHabits();
    const completedToday = habits.filter(h => h.history && h.history[this.todayIso]).length;
    const totalHabits = habits.length;
    const percentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    let sproutIcon = '🌱';
    let sproutTitle = 'Tunas Kebiasaan Baru Disiram 🌱';
    let sproutDesc = 'Mulai langkah kecilmu hari ini untuk menumbuhkan kebiasaan hebat!';

    if (percentage >= 100 && totalHabits > 0) {
      sproutIcon = '🌳';
      sproutTitle = 'Pohon Kebiasaanmu Tumbuh Subur & Berbuah Lebat! 🍊';
      sproutDesc = 'Luar biasa! Seluruh rutinitas hari ini telah kamu selesaikan dengan sempurna.';
    } else if (percentage >= 50) {
      sproutIcon = '🌿';
      sproutTitle = 'Tanaman Kebiasaanmu Semakin Mekar 🌿';
      sproutDesc = `Lebih dari separuh (${percentage}%) habit telah disiram hari ini. Lanjutkan!`;
    }

    const container = document.getElementById('tunas-sprout-widget');
    if (!container) return;

    container.innerHTML = `
      <div class="plant-icon-area">${sproutIcon}</div>
      <div class="plant-details">
        <h3>${sproutTitle}</h3>
        <p>${sproutDesc}</p>
        <div class="plant-progress-bar">
          <div class="plant-progress-fill" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. Summary Cards Bar
  // =========================================================================
  static renderSummaryStats() {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();

    const completedToday = habits.filter(h => h.history && h.history[this.todayIso]).length;
    const totalHabits = habits.length;
    const rate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const activeStreakCount = habits.filter(h => h.streak > 0).length;

    const elComp = document.getElementById('stat-completed-today');
    const elStreak = document.getElementById('stat-active-streaks');
    const elGoals = document.getElementById('stat-active-goals');

    if (elComp) elComp.textContent = `${completedToday} / ${totalHabits} Habit Selesai (${rate}%)`;
    if (elStreak) elStreak.textContent = `${activeStreakCount} Habit Streak Beruntun`;
    if (elGoals) elGoals.textContent = `${goals.length} Goal Utama Berjalan`;
  }

  // =========================================================================
  // Search & Filter State Handlers
  // =========================================================================
  static handleSearchInput(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    if (this.currentTab === 'fokus-hari-ini') {
      this.renderFokusHariIniListOnly();
    } else {
      this.renderAll();
    }
  }

  static currentSortMode = 'time-24h';

  static setStatusFilter(status) {
    this.currentStatusFilter = status;
    document.querySelectorAll('.filter-status-group .filter-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
    this.renderFokusHariIniListOnly();
  }

  static setCategoryFilter(category) {
    this.currentCategoryFilter = category;
    const select = document.getElementById('habit-category-filter');
    if (select) select.value = category;
    this.renderFokusHariIniListOnly();
  }

  static setSortMode(mode) {
    this.currentSortMode = mode || 'time-24h';
    if (window.StorageManager) StorageManager.setSortMode(this.currentSortMode);
    const select = document.getElementById('habit-sort-select');
    if (select) select.value = this.currentSortMode;
    this.renderFokusHariIniListOnly();
  }

  static getTimeDetails(timeStr, isDone = false) {
    const time = timeStr || '08:00';
    const [hStr, mStr] = time.split(':');
    const hour = parseInt(hStr, 10) || 0;
    const min = parseInt(mStr, 10) || 0;

    let period = 'Pagi';
    let periodEmoji = '🌅';
    if (hour >= 3 && hour < 6) {
      period = 'Subuh';
      periodEmoji = '🌌';
    } else if (hour >= 6 && hour < 11) {
      period = 'Pagi';
      periodEmoji = '🌅';
    } else if (hour >= 11 && hour < 15) {
      period = 'Siang';
      periodEmoji = '☀️';
    } else if (hour >= 15 && hour < 18) {
      period = 'Sore';
      periodEmoji = '🌇';
    } else {
      period = 'Malam';
      periodEmoji = '🌙';
    }

    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();
    const habitTotalMin = hour * 60 + min;

    let statusClass = 'time-upcoming';
    let statusText = `Jadwal ${period}`;
    let statusBadge = `⏳ ${period}`;

    if (isDone) {
      statusClass = 'time-done';
      statusText = 'Selesai';
      statusBadge = '✓ Selesai';
    } else if (Math.abs(currentTotalMin - habitTotalMin) <= 45) {
      statusClass = 'time-now';
      statusText = 'Waktunya Sekarang!';
      statusBadge = '⚡ Sekarang';
    } else if (currentTotalMin > habitTotalMin) {
      statusClass = 'time-overdue';
      statusText = 'Waktu Lewat';
      statusBadge = '🕒 Lewat';
    }

    return {
      formattedTime: time,
      period,
      periodEmoji,
      statusClass,
      statusText,
      statusBadge,
      totalMinutes: habitTotalMin
    };
  }

  static getFilteredHabits(habits) {
    let result = habits.filter(h => {
      // Category filter
      if (this.currentCategoryFilter !== 'all' && h.category !== this.currentCategoryFilter) {
        return false;
      }

      // Status filter
      const isDone = Boolean(h.history && h.history[this.todayIso]);
      if (this.currentStatusFilter === 'pending' && isDone) return false;
      if (this.currentStatusFilter === 'completed' && !isDone) return false;

      // Search query
      if (this.searchQuery) {
        const titleMatch = (h.title || '').toLowerCase().includes(this.searchQuery);
        const goalMatch = (h.goalTitle || '').toLowerCase().includes(this.searchQuery);
        const planMatch = (h.plan || '').toLowerCase().includes(this.searchQuery);
        const catMatch = (h.category || '').toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !goalMatch && !planMatch && !catMatch) return false;
      }

      return true;
    });

    // Automatic 24-hour and custom sorting
    if (this.currentSortMode === 'time-24h') {
      result.sort((a, b) => (a.time || '08:00').localeCompare(b.time || '08:00'));
    } else if (this.currentSortMode === 'streak-desc') {
      result.sort((a, b) => (b.streak || 0) - (a.streak || 0));
    } else if (this.currentSortMode === 'duration-asc') {
      result.sort((a, b) => (a.duration || 15) - (b.duration || 15));
    } else if (this.currentSortMode === 'duration-desc') {
      result.sort((a, b) => (b.duration || 15) - (a.duration || 15));
    }

    return result;
  }

  static markAllDoneToday() {
    const habits = StorageManager.getHabits();
    const filtered = this.getFilteredHabits(habits);
    const pendingList = filtered.filter(h => !h.history || !h.history[this.todayIso]);

    if (pendingList.length === 0) {
      this.showToast('Semua habit pada filter saat ini sudah selesai!', 'info');
      return;
    }

    this.showConfirm(`Tandai ${pendingList.length} habit yang belum selesai sebagai selesai hari ini?`, () => {
      let earnedXP = 0;
      pendingList.forEach(h => {
        if (!h.history) h.history = {};
        h.history[this.todayIso] = true;
        this.recalcStreak(h);
        earnedXP += 25;
        if (window.AuthManager) {
          AuthManager.pushHabitToggle(h.id, this.todayIso, true);
        }
      });

      StorageManager.saveHabits(habits);
      if (window.GamificationManager) {
        GamificationManager.addXP(earnedXP);
      }
      if (window.ConfettiEngine) {
        ConfettiEngine.launch(3000);
      }
      this.showToast(`🎉 Hebat! ${pendingList.length} habit diselesaikan (+${earnedXP} XP)!`, 'success');
      this.renderAll();
    });
  }

  // =========================================================================
  // 3. Tab: Fokus Hari Ini (Checklist & Sub-Goals)
  // =========================================================================
  static renderFokusHariIni() {
    if (window.AICoachManager) {
      AICoachManager.renderDailyInsightBanner();
    }

    const banner = document.getElementById('focus-today-date-banner');
    const d = new Date();
    const dayName = this.INDO_DAYS[d.getDay()];
    const dayNum = d.getDate();
    const monthShort = this.INDO_MONTHS_SHORT[d.getMonth()].toUpperCase();
    const monthFull = this.INDO_MONTHS[d.getMonth()];
    const year = d.getFullYear();

    const habits = StorageManager.getHabits();
    const completedToday = habits.filter(h => h.history && h.history[this.todayIso]).length;
    const totalHabits = habits.length;
    const rate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const quarter = Math.floor(d.getMonth() / 3) + 1;

    if (banner) {
      banner.innerHTML = `
        <div class="today-focus-date-header">
          <div class="today-date-badge-box">
            <div class="today-date-icon-calendar">
              <span class="cal-badge-month">${monthShort}</span>
              <span class="cal-badge-num">${dayNum}</span>
            </div>
            <div>
              <div class="today-date-day-tag">📅 HARI INI • ${dayName.toUpperCase()}</div>
              <h2 class="today-date-title">${dayName}, ${dayNum} ${monthFull} ${year}</h2>
              <span class="today-date-subtitle">Pekan ke-${weekNum} • Kuartal ${quarter} Tahun ${year}</span>
            </div>
          </div>
          <div class="today-date-stats-pill">
            <span class="pulse-dot"></span>
            <span>${completedToday} / ${totalHabits} Habit Selesai Hari Ini (${rate}%)</span>
          </div>
        </div>
      `;
    }

    const heading = document.getElementById('fokus-checklist-heading');
    if (heading) {
      heading.innerHTML = `⚡ Kebiasaan yang Harus Dikerjakan Hari Ini <span class="header-date-tag">(${dayNum} ${monthShort} ${year})</span>`;
    }

    this.renderFokusHariIniListOnly();
    this.renderSideMilestones();
  }

  static renderFokusHariIniListOnly() {
    const list = document.getElementById('fokus-habits-list');
    if (!list) return;

    const allHabits = StorageManager.getHabits();
    const filteredHabits = this.getFilteredHabits(allHabits);

    if (filteredHabits.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-glass);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌱</div>
          <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.35rem;">Tidak ada habit yang cocok</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Coba sesuaikan filter kategori, status, atau kata kunci pencarian Anda.</p>
          <button class="btn btn-secondary btn-sm" onclick="GoalGettenApp.resetFilters()">Reset Filter</button>
        </div>
      `;
      return;
    }

    list.innerHTML = filteredHabits.map(h => {
      const isDone = Boolean(h.history && h.history[this.todayIso]);
      const catColor = h.color || '#8b5cf6';
      const timeInfo = this.getTimeDetails(h.time, isDone);

      return `
        <div class="habit-card-v2 ${isDone ? 'completed' : ''}" style="--habit-color: ${catColor};" data-habit-id="${h.id}">
          <div class="habit-row-top">
            <div class="habit-main-info">
              <div class="habit-drag-handle" title="Tarik / geser untuk mengatur urutan habit (Drag & Drop)" aria-label="Geser urutan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="8" cy="5" r="2.2"/>
                  <circle cx="16" cy="5" r="2.2"/>
                  <circle cx="8" cy="12" r="2.2"/>
                  <circle cx="16" cy="12" r="2.2"/>
                  <circle cx="8" cy="19" r="2.2"/>
                  <circle cx="16" cy="19" r="2.2"/>
                </svg>
              </div>
              <div class="custom-checkbox" onclick="GoalGettenApp.toggleHabit('${h.id}', '${this.todayIso}')">
                ${isDone ? '✓' : ''}
              </div>
              <div class="habit-title-area">
                <div class="habit-title-row">
                  <h4>${h.title}</h4>
                  <span class="tag-pill tag-24h-time ${timeInfo.statusClass}" title="Jadwal 24 jam: ${timeInfo.formattedTime} WIB (${timeInfo.statusText})">
                    ${timeInfo.periodEmoji} ${timeInfo.formattedTime} • ${timeInfo.period}
                  </span>
                </div>
                <div class="habit-meta-tags">
                  <span class="tag-pill tag-time-status ${timeInfo.statusClass}">${timeInfo.statusBadge}</span>
                  <span class="tag-pill tag-duration">⏱️ ${h.duration || 15} Menit</span>
                  <span class="tag-pill tag-category" style="--cat-bg: ${catColor}20; --cat-color: ${catColor};">${h.category}</span>
                  <span class="tag-goal">🎯 ${h.goalTitle || 'Tujuan Utama'}</span>
                </div>
              </div>
            </div>

            <div class="habit-right-actions">
              <button class="btn-focus-timer-start" onclick="GoalGettenApp.openFocusTimer('${h.id}')" title="Mulai Focus Pomodoro Timer untuk habit ini">
                <span>▶️ Mulai</span>
              </button>
              <span class="streak-tag">🔥 ${h.streak || 0} d</span>
              <button class="icon-btn" title="Edit Habit" onclick="GoalGettenApp.openEditHabitModal('${h.id}')">✏️</button>
              <button class="icon-btn" title="Hapus Habit" onclick="GoalGettenApp.deleteHabit('${h.id}')">🗑️</button>
            </div>
          </div>

          ${h.plan ? `
            <div class="implementation-plan-box">
              <span class="label">Rencana Implementasi:</span> ${h.plan}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.initHabitDragAndDrop('#fokus-habits-list');
  }

  static renderSideMilestones() {
    const sideMilestones = document.getElementById('side-milestones-list');
    if (!sideMilestones) return;

    const goals = StorageManager.getGoals();
    let allSubgoals = [];
    goals.forEach(g => {
      (g.subgoals || []).forEach(sg => {
        allSubgoals.push({ ...sg, goalId: g.id, goalTitle: g.title, goalColor: g.color });
      });
    });

    if (allSubgoals.length === 0) {
      sideMilestones.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          Belum ada sub-goal aktif. Tambahkan di tab "Daftar Goal Utama".
        </div>
      `;
    } else {
      sideMilestones.innerHTML = allSubgoals.slice(0, 8).map(sg => `
        <div class="subgoal-item ${sg.done ? 'done' : ''}">
          <input type="checkbox" ${sg.done ? 'checked' : ''} style="margin-top: 3px; accent-color: #8b5cf6;" onchange="GoalGettenApp.toggleSubgoal('${sg.goalId}', '${sg.id}')">
          <div class="subgoal-text">
            <div>${sg.text}</div>
            <div class="subgoal-date">🎯 ${sg.goalTitle} • Target: ${sg.targetDate || '-'}</div>
          </div>
        </div>
      `).join('');
    }
  }

  static resetFilters() {
    this.searchQuery = '';
    this.currentStatusFilter = 'all';
    this.currentCategoryFilter = 'all';
    const sInput = document.getElementById('habit-search-input');
    if (sInput) sInput.value = '';
    const catSelect = document.getElementById('habit-category-filter');
    if (catSelect) catSelect.value = 'all';
    document.querySelectorAll('.filter-status-group .filter-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === 'all');
    });
    this.renderFokusHariIniListOnly();
  }

  // =========================================================================
  // 4. Tab: Daftar Goal Utama (Goals & Sub-goals Cards)
  // =========================================================================
  static renderDaftarGoals() {
    const container = document.getElementById('goals-container-full');
    if (!container) return;

    const goals = StorageManager.getGoals();
    const habits = StorageManager.getHabits();

    if (goals.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-glass);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🚀</div>
          <h4 style="font-size: 1.15rem; color: #fff; margin-bottom: 0.35rem;">Belum ada Goal Utama</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Buat tujuan jangka panjang dan pecah menjadi milestone terukur.</p>
          <button class="btn btn-primary" onclick="GoalGettenApp.openAddGoalModal()">+ Buat Goal Baru</button>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(g => {
      const subgoals = g.subgoals || [];
      const totalSg = subgoals.length;
      const doneSg = subgoals.filter(s => s.done).length;
      const progress = totalSg > 0 ? Math.round((doneSg / totalSg) * 100) : 0;
      const relatedHabitsCount = habits.filter(h => h.goalId === g.id).length;

      return `
        <div class="goal-card-full" style="--goal-color: ${g.color || '#8b5cf6'};">
          <div class="goal-top-header">
            <span class="tag-pill tag-category" style="background: ${g.color}20; color: ${g.color};">${g.category}</span>
            <span class="goal-percent-badge">${progress}%</span>
            <div style="display: flex; gap: 0.25rem;">
              <button class="icon-btn" title="Edit Goal" onclick="GoalGettenApp.openEditGoalModal('${g.id}')">✏️</button>
              <button class="icon-btn" title="Hapus Goal" onclick="GoalGettenApp.deleteGoal('${g.id}')">🗑️</button>
            </div>
          </div>

          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem;">${g.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${g.description || ''}</p>
          </div>

          <div class="plant-progress-bar">
            <div class="plant-progress-fill" style="width: ${progress}%; background: ${g.color || '#8b5cf6'};"></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap; gap: 0.35rem;">
            <span>📅 Target: ${g.targetDate || '-'}</span>
            <span>📌 Sub-Goal: ${doneSg}/${totalSg}</span>
            <span>⚡ Habit Terkait: ${relatedHabitsCount}</span>
          </div>

          <div style="border-top: 1px solid var(--border-glass); padding-top: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">Tujuan-tujuan Kecil (Sub-Goals)</span>
              <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px;" onclick="GoalGettenApp.promptAddSubgoal('${g.id}')">+ Sub-Goal</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              ${subgoals.map(s => `
                <div class="subgoal-item ${s.done ? 'done' : ''}" style="padding: 0.4rem 0.6rem;">
                  <input type="checkbox" ${s.done ? 'checked' : ''} onchange="GoalGettenApp.toggleSubgoal('${g.id}', '${s.id}')" style="accent-color: ${g.color};">
                  <div class="subgoal-text" style="font-size: 0.8rem;">
                    <span>${s.text}</span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">Deadline: ${s.targetDate || '-'}</span>
                  </div>
                  <button class="icon-btn" style="width: 22px; height: 22px; font-size: 0.7rem;" onclick="GoalGettenApp.deleteSubgoal('${g.id}', '${s.id}')">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 5. Tab: Matriks Kelompok Habit (Category Matrix with 7-Day Pills)
  // =========================================================================
  // =========================================================================
  // 2.5 Proyek & Manajemen Tugas 📁
  // =========================================================================
  static renderProjectsTab() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const projects = StorageManager.getProjects();

    // Summary Metric calculations
    const totalProjects = projects.length;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressProjectsCount = 0;
    let completedProjectsCount = 0;
    let totalProgressSum = 0;

    projects.forEach(p => {
      const tasks = p.tasks || [];
      totalTasks += tasks.length;
      const doneCount = tasks.filter(t => t.done).length;
      completedTasks += doneCount;
      const prog = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
      totalProgressSum += prog;
      if (prog === 100 && tasks.length > 0) {
        completedProjectsCount++;
      } else {
        inProgressProjectsCount++;
      }
    });

    const avgProgress = totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0;

    // Update summary stat boxes
    const totalEl = document.getElementById('proj-stat-total');
    const activeEl = document.getElementById('proj-stat-active');
    const doneEl = document.getElementById('proj-stat-tasks-done');
    const avgEl = document.getElementById('proj-stat-avg-progress');

    if (totalEl) totalEl.textContent = `${totalProjects} Proyek`;
    if (activeEl) activeEl.textContent = `${inProgressProjectsCount} Berjalan`;
    if (doneEl) doneEl.textContent = `${completedTasks} / ${totalTasks} Tugas`;
    if (avgEl) avgEl.textContent = `${avgProgress}%`;

    // Filter projects
    const q = (this.currentProjectSearch || '').toLowerCase().trim();
    let filtered = projects.filter(p => {
      const tasks = p.tasks || [];
      const doneCount = tasks.filter(t => t.done).length;
      const isCompleted = tasks.length > 0 && doneCount === tasks.length;

      // Status filter
      if (this.currentProjectStatusFilter === 'in-progress' && isCompleted) return false;
      if (this.currentProjectStatusFilter === 'completed' && !isCompleted) return false;

      // Category filter
      if (this.currentProjectCategoryFilter !== 'all' && (p.category || '').toLowerCase() !== this.currentProjectCategoryFilter.toLowerCase()) {
        return false;
      }

      // Priority filter
      if (this.currentProjectPriorityFilter !== 'all' && (p.priority || 'medium').toLowerCase() !== this.currentProjectPriorityFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (q) {
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const taskMatch = tasks.some(t => (t.title || '').toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !taskMatch) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-glass);">
          <div style="font-size: 2.5rem; margin-bottom: 0.65rem;">📁</div>
          <h4 style="font-size: 1.15rem; color: #fff; margin-bottom: 0.35rem;">Tidak Ada Proyek yang Sesuai Filter</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
            ${q || this.currentProjectStatusFilter !== 'all' || this.currentProjectCategoryFilter !== 'all' ? 'Coba ubah kata kunci pencarian atau filter di atas.' : 'Mulai rancang proyek baru untuk mengorganisir tugas-tugas terstruktur Anda.'}
          </p>
          <button class="btn btn-primary" onclick="GoalGettenApp.openAddProjectModal()">+ Buat Proyek Baru</button>
        </div>
      `;
      return;
    }

    const priorityBadges = {
      'high': '<span class="proj-priority-badge high">🔥 Tinggi</span>',
      'medium': '<span class="proj-priority-badge medium">⚡ Sedang</span>',
      'low': '<span class="proj-priority-badge low">🟢 Normal</span>'
    };

    container.innerHTML = filtered.map(p => {
      const tasks = p.tasks || [];
      const totalT = tasks.length;
      const doneT = tasks.filter(t => t.done).length;
      const progress = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;
      const isComplete = totalT > 0 && doneT === totalT;
      const cardColor = p.color || '#6366f1';

      return `
        <div class="project-card-v2 ${isComplete ? 'completed' : ''}" style="--proj-color: ${cardColor};" data-project-id="${p.id}">
          <div class="project-card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="tag-pill tag-category" style="background: ${cardColor}20; color: ${cardColor};">${p.category || 'General'}</span>
              ${priorityBadges[p.priority] || priorityBadges['medium']}
              ${isComplete ? '<span class="proj-status-badge complete">✓ Selesai 100%</span>' : '<span class="proj-status-badge in-progress">⏳ Berjalan</span>'}
            </div>
            <div class="project-card-actions">
              <button class="icon-btn" title="Edit Proyek" onclick="GoalGettenApp.openEditProjectModal('${p.id}')">✏️</button>
              <button class="icon-btn" title="Hapus Proyek" onclick="GoalGettenApp.deleteProject('${p.id}')">🗑️</button>
            </div>
          </div>

          <div class="project-card-main">
            <h3 class="project-title">${p.title}</h3>
            ${p.description ? `<p class="project-desc">${p.description}</p>` : ''}
          </div>

          <!-- Progress Bar & Indicator -->
          <div class="project-progress-area">
            <div class="project-progress-meta">
              <span class="progress-label">Progres Penyelesaian</span>
              <span class="progress-percent-val ${isComplete ? 'text-emerald' : ''}">${progress}% (${doneT}/${totalT} Tugas)</span>
            </div>
            <div class="plant-progress-bar" style="height: 9px;">
              <div class="plant-progress-fill" style="width: ${progress}%; background: ${isComplete ? 'linear-gradient(90deg, #10b981, #059669)' : cardColor}; transition: width 0.3s ease;"></div>
            </div>
            <div class="project-deadline-row">
              <span>📅 Tenggat: <strong>${p.deadline ? GoalGettenApp.formatIndonesianShort(p.deadline) : 'Tanpa Batas Waktu'}</strong></span>
              ${p.createdAt ? `<span>Dibuat: ${GoalGettenApp.formatIndonesianShort(p.createdAt)}</span>` : ''}
            </div>
          </div>

          <!-- Task Checklist Section -->
          <div class="project-tasks-wrapper">
            <div class="project-tasks-header">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">Daftar Tugas (${doneT}/${totalT})</span>
            </div>

            <div class="project-tasks-list">
              ${tasks.length === 0 ? '<div class="project-no-tasks">Belum ada tugas. Tambahkan tugas pertama di bawah!</div>' : ''}
              ${tasks.map(t => {
                const isOverdue = t.dueDate && !t.done && t.dueDate < GoalGettenApp.todayIso;
                const isDueToday = t.dueDate && !t.done && t.dueDate === GoalGettenApp.todayIso;

                return `
                  <div class="project-task-item ${t.done ? 'done' : ''}">
                    <div class="project-task-left" onclick="GoalGettenApp.toggleProjectTask('${p.id}', '${t.id}')">
                      <div class="project-task-checkbox ${t.done ? 'checked' : ''}">
                        ${t.done ? '✓' : ''}
                      </div>
                      <div class="project-task-text-group">
                        <span class="project-task-title">${t.title}</span>
                        ${t.dueDate ? `
                          <span class="project-task-date-pill ${isOverdue ? 'overdue' : (isDueToday ? 'today' : '')}" title="Target Tanggal: ${GoalGettenApp.formatIndonesianDate(t.dueDate)}">
                            📅 ${GoalGettenApp.formatIndonesianShort(t.dueDate)} ${isOverdue ? '⚠️ Lewat' : (isDueToday ? '🔥 Hari Ini' : '')}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                    <button class="project-task-delete-btn" title="Hapus Tugas" onclick="GoalGettenApp.deleteProjectTask('${p.id}', '${t.id}')">✕</button>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Quick Add Task Form -->
            <div class="project-quick-add-task">
              <input type="text" class="quick-task-input" id="quick-task-input-${p.id}" placeholder="+ Tambah tugas..." onkeydown="if(event.key==='Enter'){event.preventDefault(); GoalGettenApp.quickAddTaskToProject('${p.id}');}">
              <input type="date" class="quick-task-date-input" id="quick-task-date-${p.id}" title="Target tanggal tugas" value="${new Date().toISOString().slice(0, 10)}">
              <button class="btn btn-secondary btn-sm" onclick="GoalGettenApp.quickAddTaskToProject('${p.id}')">
                <span>+ Tambah</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  static setProjectStatusFilter(status) {
    this.currentProjectStatusFilter = status;
    document.querySelectorAll('[data-proj-status]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-proj-status') === status);
    });
    this.renderProjectsTab();
  }

  static setProjectCategoryFilter(cat) {
    this.currentProjectCategoryFilter = cat;
    this.renderProjectsTab();
  }

  static setProjectPriorityFilter(priority) {
    this.currentProjectPriorityFilter = priority;
    this.renderProjectsTab();
  }

  static handleProjectSearch(query) {
    this.currentProjectSearch = query || '';
    this.renderProjectsTab();
  }

  static toggleProjectTask(projectId, taskId) {
    const projects = StorageManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.done = !task.done;
    StorageManager.saveProjects(projects);

    if (task.done) {
      if (window.GamificationManager) {
        GamificationManager.addXP(20);
      }
      if (window.SoundEffects) {
        SoundEffects.playPop();
      }

      const allDone = project.tasks.every(t => t.done);
      if (allDone && project.tasks.length > 0) {
        if (window.ConfettiEngine) ConfettiEngine.launch(3000);
        if (window.SoundEffects) SoundEffects.playLevelUp();
        if (window.GamificationManager) GamificationManager.addXP(100);
        GoalGettenApp.showToast(`🎉 Proyek Selesai 100%: "${project.title}" (+100 XP)`, 'success', 4500);
      } else {
        GoalGettenApp.showToast(`✓ Tugas selesai: "${task.title}" (+20 XP)`, 'info', 1800);
      }
    }

    this.renderProjectsTab();
  }

  static quickAddTaskToProject(projectId) {
    const input = document.getElementById(`quick-task-input-${projectId}`);
    const dateInput = document.getElementById(`quick-task-date-${projectId}`);
    if (!input) return;
    const title = input.value.trim();
    if (!title) return;
    const dueDate = dateInput ? dateInput.value : '';

    const projects = StorageManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!project.tasks) project.tasks = [];
    project.tasks.push({
      id: 't-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: title,
      dueDate: dueDate,
      done: false
    });

    StorageManager.saveProjects(projects);
    input.value = '';
    this.renderProjectsTab();
    this.showToast('✅ Tugas baru ditambahkan!', 'success', 1800);
  }

  static deleteProjectTask(projectId, taskId) {
    const projects = StorageManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return;

    project.tasks = project.tasks.filter(t => t.id !== taskId);
    StorageManager.saveProjects(projects);
    this.renderProjectsTab();
    this.showToast('🗑️ Tugas dihapus', 'info', 1500);
  }

  static openAddProjectModal() {
    const heading = document.getElementById('modal-project-heading');
    if (heading) heading.textContent = '+ Buat Proyek Baru';
    document.getElementById('modal-project-id').value = '';
    document.getElementById('modal-project-title').value = '';
    document.getElementById('modal-project-category').value = 'Intellectual / Career';
    document.getElementById('modal-project-priority').value = 'medium';
    document.getElementById('modal-project-desc').value = '';

    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    document.getElementById('modal-project-deadline').value = d.toISOString().slice(0, 10);

    const d1 = new Date(); d1.setDate(d1.getDate() + 2);
    const d2 = new Date(); d2.setDate(d2.getDate() + 7);
    const d3 = new Date(); d3.setDate(d3.getDate() + 14);

    const taskList = document.getElementById('modal-project-tasks-list');
    if (taskList) {
      taskList.innerHTML = '';
      this.addProjectTaskRow('Riset & perencanaan awal', false, null, d1.toISOString().slice(0, 10));
      this.addProjectTaskRow('Eksekusi pengerjaan tahap inti', false, null, d2.toISOString().slice(0, 10));
      this.addProjectTaskRow('Review & penyelesaian akhir', false, null, d3.toISOString().slice(0, 10));
    }

    const modal = document.getElementById('modal-project');
    if (modal) modal.classList.add('active');
    setTimeout(() => document.getElementById('modal-project-title').focus(), 200);
  }

  static openEditProjectModal(projectId) {
    const projects = StorageManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const heading = document.getElementById('modal-project-heading');
    if (heading) heading.textContent = '✏️ Edit Proyek';
    document.getElementById('modal-project-id').value = project.id;
    document.getElementById('modal-project-title').value = project.title || '';
    document.getElementById('modal-project-category').value = project.category || 'Intellectual / Career';
    document.getElementById('modal-project-priority').value = project.priority || 'medium';
    document.getElementById('modal-project-deadline').value = project.deadline || '';
    document.getElementById('modal-project-desc').value = project.description || '';

    const taskList = document.getElementById('modal-project-tasks-list');
    if (taskList) {
      taskList.innerHTML = '';
      const tasks = project.tasks || [];
      if (tasks.length === 0) {
        this.addProjectTaskRow('', false, null, new Date().toISOString().slice(0, 10));
      } else {
        tasks.forEach(t => {
          this.addProjectTaskRow(t.title, t.done, t.id, t.dueDate || '');
        });
      }
    }

    const modal = document.getElementById('modal-project');
    if (modal) modal.classList.add('active');
  }

  static addProjectTaskRow(taskText = '', isDone = false, existingId = null, dueDate = '') {
    const container = document.getElementById('modal-project-tasks-list');
    if (!container) return;

    const rowId = existingId || ('t-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const row = document.createElement('div');
    row.className = 'project-modal-task-row';
    row.setAttribute('data-task-id', rowId);
    row.innerHTML = `
      <input type="checkbox" class="task-row-checkbox" ${isDone ? 'checked' : ''} title="Tandai selesai">
      <input type="text" class="form-control task-row-input" placeholder="Tuliskan nama tugas..." value="${taskText.replace(/"/g, '&quot;')}">
      <input type="date" class="form-control task-row-date" value="${dueDate || ''}" title="Target tanggal tugas">
      <button type="button" class="icon-btn task-row-remove-btn" title="Hapus baris" onclick="this.closest('.project-modal-task-row').remove()">✕</button>
    `;
    container.appendChild(row);
  }

  static async smartBreakdownProjectTasks() {
    const titleInput = document.getElementById('modal-project-title');
    const catSelect = document.getElementById('modal-project-category');
    const descArea = document.getElementById('modal-project-desc');
    const deadlineInput = document.getElementById('modal-project-deadline');
    const btn = document.getElementById('btn-ai-project-breakdown');

    if (!titleInput || !titleInput.value.trim()) {
      GoalGettenApp.showToast('Ketik Nama Proyek terlebih dahulu agar AI dapat merancang tugas!', 'warning');
      if (titleInput) titleInput.focus();
      return;
    }

    const title = titleInput.value.trim();
    const cat = catSelect ? catSelect.value : 'Intellectual / Career';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Merancang tugas...</span>`;
    }

    try {
      const generatedTasks = [];
      const apiKey = window.StorageManager ? (StorageManager.getApiKey() || '').trim() : '';

      if (apiKey && window.AICoachManager) {
        try {
          const prompt = `Pecah proyek berikut menjadi 4-5 tugas konkret dan terukur: "${title}" (Kategori: ${cat}). Tuliskan hanya 1 tugas per baris tanpa penomoran.`;
          const raw = await AICoachManager.callGeminiAPI(prompt, "You are a professional project manager. Output 4-5 concise actionable tasks in Indonesian, one per line.");
          const lines = raw.split(/\r?\n/).map(l => l.replace(/^\d+[\.\)]\s*|-\s*/, '').trim()).filter(Boolean);
          lines.forEach(l => {
            if (l.length > 2) generatedTasks.push(l);
          });
        } catch (e) {
          console.warn('Gemini project breakdown fallback:', e);
        }
      }

      if (generatedTasks.length === 0) {
        await new Promise(r => setTimeout(r, 400));
        generatedTasks.push(
          `Riset kebutuhan & perencanaan struktur ${title}`,
          `Susun draf awal & siapkan dokumen kerja utama`,
          `Eksekusi pengerjaan tahap inti secara bertahap`,
          `Uji coba, evaluasi kualitas, & perbaiki kekurangan`,
          `Finalisasi & peluncuran / serah terima hasil akhir`
        );
      }

      const deadlineVal = deadlineInput ? deadlineInput.value : '';
      const targetDeadline = deadlineVal ? new Date(deadlineVal) : new Date(Date.now() + 30 * 86400000);
      const nowMs = Date.now();
      const totalSpan = Math.max(86400000, targetDeadline.getTime() - nowMs);

      const taskList = document.getElementById('modal-project-tasks-list');
      if (taskList) {
        taskList.innerHTML = '';
        generatedTasks.forEach((tText, idx) => {
          const stepFraction = (idx + 1) / generatedTasks.length;
          const taskDateMs = nowMs + (totalSpan * stepFraction);
          const taskDateIso = new Date(taskDateMs).toISOString().slice(0, 10);
          GoalGettenApp.addProjectTaskRow(tText, false, null, taskDateIso);
        });
      }

      if (descArea && !descArea.value.trim()) {
        descArea.value = `Proyek strategis ${title} dengan tahapan terencana untuk mencapai hasil optimal.`;
      }

      if (window.SoundEffects) SoundEffects.playDing();
      GoalGettenApp.showToast(`✨ AI berhasil merancang ${generatedTasks.length} tugas beserta jadwalnya untuk "${title}"!`, 'success');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨ AI Breakdown Tugas</span>`;
      }
    }
  }

  static saveProjectFromForm() {
    const id = document.getElementById('modal-project-id').value;
    const title = document.getElementById('modal-project-title').value.trim();
    const category = document.getElementById('modal-project-category').value;
    const priority = document.getElementById('modal-project-priority').value;
    const deadline = document.getElementById('modal-project-deadline').value;
    const description = document.getElementById('modal-project-desc').value.trim();

    if (!title) {
      this.showToast('Nama proyek harus diisi!', 'warning');
      return;
    }

    const catColors = {
      'Spiritual': '#8b5cf6',
      'Physical / Health': '#10b981',
      'Intellectual / Career': '#6366f1',
      'Keuangan': '#06b6d4',
      'Emotional / Personal': '#f43f5e',
      'Creativity / Custom': '#d946ef'
    };

    // Extract tasks from modal builder
    const taskRows = document.querySelectorAll('#modal-project-tasks-list .project-modal-task-row');
    const tasks = [];
    taskRows.forEach(row => {
      const taskId = row.getAttribute('data-task-id') || ('t-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      const checkbox = row.querySelector('.task-row-checkbox');
      const input = row.querySelector('.task-row-input');
      const dateInput = row.querySelector('.task-row-date');
      const taskTitle = input ? input.value.trim() : '';
      const dueDate = dateInput ? dateInput.value : '';

      if (taskTitle) {
        tasks.push({
          id: taskId,
          title: taskTitle,
          dueDate: dueDate,
          done: checkbox ? checkbox.checked : false
        });
      }
    });

    const projects = StorageManager.getProjects();

    if (id) {
      // Edit existing
      const project = projects.find(p => p.id === id);
      if (project) {
        project.title = title;
        project.category = category;
        project.priority = priority;
        project.deadline = deadline;
        project.description = description;
        project.tasks = tasks;
        project.color = catColors[category] || project.color || '#6366f1';
      }
      this.showToast(`✨ Proyek "${title}" berhasil diperbarui!`, 'success');
    } else {
      // Create new
      const newProject = {
        id: 'proj-' + Date.now(),
        title: title,
        category: category,
        priority: priority,
        deadline: deadline,
        description: description,
        color: catColors[category] || '#6366f1',
        createdAt: new Date().toISOString().slice(0, 10),
        tasks: tasks
      };
      projects.unshift(newProject);
      this.showToast(`🎉 Proyek "${title}" berhasil dibuat!`, 'success');
    }

    StorageManager.saveProjects(projects);
    this.closeModal('modal-project');
    this.renderProjectsTab();
  }

  static deleteProject(projectId) {
    const projects = StorageManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    this.showConfirm(`Hapus proyek "${project.title}" beserta seluruh tugasnya?`, () => {
      const updated = projects.filter(p => p.id !== projectId);
      StorageManager.saveProjects(updated);
      this.renderProjectsTab();
      this.showToast(`🗑️ Proyek "${project.title}" telah dihapus`, 'info');
    });
  }

  // =========================================================================
  // 3. Matriks Kelompok Habit ⚡
  // =========================================================================
  static renderMatriksHabit() {
    const container = document.getElementById('matriks-habits-container');
    if (!container) return;

    const habits = StorageManager.getHabits();
    const categories = ['Spiritual', 'Physical / Health', 'Intellectual / Career', 'Keuangan', 'Emotional / Personal', 'Creativity / Custom'];

    const today = new Date();
    const dayNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      past7Days.push({
        iso: d.toISOString().slice(0, 10),
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate()
      });
    }

    container.innerHTML = categories.map(cat => {
      const catHabits = habits.filter(h => (h.category || '').toLowerCase() === cat.toLowerCase());
      if (catHabits.length === 0) return '';

      // Auto-sort by 24h schedule if active sort mode is time-24h
      if (this.currentSortMode === 'time-24h') {
        catHabits.sort((a, b) => (a.time || '08:00').localeCompare(b.time || '08:00'));
      }

      const catColor = catHabits[0].color || '#8b5cf6';

      return `
        <div class="category-matrix-section">
          <div class="matrix-category-header">
            <div class="category-dot" style="--cat-color: ${catColor};"></div>
            <h4 style="font-size: 1rem; font-weight: 700;">${cat} Habit</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">(${catHabits.length} kebiasaan)</span>
          </div>

          <div class="matrix-habits-list">
            ${catHabits.map(h => `
              <div class="habit-card-v2" style="--habit-color: ${catColor}; margin-bottom: 0;" data-habit-id="${h.id}">
                <div class="habit-row-top">
                  <div class="habit-main-info">
                    <div class="habit-drag-handle" title="Tarik / geser untuk mengatur urutan habit (Drag & Drop)" aria-label="Geser urutan">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="8" cy="5" r="2.2"/>
                        <circle cx="16" cy="5" r="2.2"/>
                        <circle cx="8" cy="12" r="2.2"/>
                        <circle cx="16" cy="12" r="2.2"/>
                        <circle cx="8" cy="19" r="2.2"/>
                        <circle cx="16" cy="19" r="2.2"/>
                      </svg>
                    </div>
                    <div class="custom-checkbox" onclick="GoalGettenApp.toggleHabit('${h.id}', '${this.todayIso}')">
                      ${(h.history && h.history[this.todayIso]) ? '✓' : ''}
                    </div>
                    <div class="habit-title-area">
                      <div class="habit-title-row">
                        <h4>${h.title}</h4>
                        <span class="tag-pill tag-24h-time ${this.getTimeDetails(h.time, Boolean(h.history && h.history[this.todayIso])).statusClass}" title="Jadwal 24 jam: ${h.time || '08:00'} WIB">
                          ⏰ ${h.time || '08:00'}
                        </span>
                      </div>
                      <div class="habit-meta-tags">
                        <span class="tag-pill tag-duration">⏱️ ${h.duration || 15} Menit</span>
                        <span class="tag-goal">🎯 ${h.goalTitle || 'Tujuan'}</span>
                      </div>
                    </div>
                  </div>

                  <div class="seven-day-strip">
                    ${past7Days.map(d => {
                      const done = Boolean(h.history && h.history[d.iso]);
                      return `
                        <div class="day-pill-btn ${done ? 'done' : ''}" style="--cat-color: ${catColor};" onclick="GoalGettenApp.toggleHabit('${h.id}', '${d.iso}')" title="${d.iso}">
                          <span>${d.dayName}</span>
                          <span>${d.dayNum}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div class="habit-right-actions">
                    <button class="btn-focus-timer-start" onclick="GoalGettenApp.openFocusTimer('${h.id}')" title="Mulai Timer">
                      <span>▶️</span>
                    </button>
                    <button class="icon-btn" onclick="GoalGettenApp.openEditHabitModal('${h.id}')">✏️</button>
                    <button class="icon-btn" onclick="GoalGettenApp.deleteHabit('${h.id}')">🗑️</button>
                  </div>
                </div>

                ${h.plan ? `
                  <div class="implementation-plan-box" style="margin-top: 0.5rem;">
                    <span class="label">Rencana:</span> ${h.plan}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    this.initHabitDragAndDrop('#matriks-habits-container .matrix-habits-list');
  }

  // =========================================================================
  // 6. Tab: Progres Ringkas Habit (Interactive Orange Tree 🍊 Visualizer)
  // =========================================================================
  static renderProgresRingkas() {
    const container = document.getElementById('progres-ringkas-container');
    if (!container) return;

    const habits = StorageManager.getHabits();

    let totalCompletedCheckins = 0;
    let totalMinutesPracticed = 0;
    let harvestedCount = 0;

    habits.forEach(h => {
      if (h.history) {
        const count = Object.values(h.history).filter(Boolean).length;
        totalCompletedCheckins += count;
        totalMinutesPracticed += count * (h.duration || 15);
        if (count >= 30) harvestedCount++;
      }
    });

    const totalHours = (totalMinutesPracticed / 60).toFixed(1);

    const elTotalCheckin = document.getElementById('prog-stat-checkin');
    const elTotalHours = document.getElementById('prog-stat-hours');
    const elTotalHabits = document.getElementById('prog-stat-habits');
    const elHarvest = document.getElementById('prog-stat-harvest');

    if (elTotalCheckin) elTotalCheckin.textContent = `${totalCompletedCheckins} Selesai`;
    if (elTotalHours) elTotalHours.textContent = `${totalHours} Jam`;
    if (elTotalHabits) elTotalHabits.textContent = `${habits.length} Habit`;
    if (elHarvest) elHarvest.textContent = `${harvestedCount} Panen Jeruk Emas`;

    container.innerHTML = habits.map(h => {
      const historyCount = h.history ? Object.values(h.history).filter(Boolean).length : 0;
      const minutes = historyCount * (h.duration || 15);
      const fruitPercent = Math.min(100, Math.round((historyCount / 30) * 100));

      let treeStageTitle = 'Bibit Tunas Baru';
      let treeBadgeClass = 'stage-seedling';
      let treeSvgContent = '';

      if (historyCount >= 30) {
        treeStageTitle = 'Pohon Berbuah Emas (Mastered) 🍊';
        treeBadgeClass = 'stage-harvest';
        treeSvgContent = `
          <svg class="orange-tree-svg" viewBox="0 0 120 120">
            <!-- Soil -->
            <path d="M15 105 Q60 115 105 105 Z" fill="#78350f" opacity="0.7"/>
            <!-- Trunk -->
            <path d="M52 105 Q58 75 50 55 Q56 40 60 35 Q64 40 70 55 Q62 75 68 105 Z" fill="#92400e"/>
            <!-- Canopy (Lush Green) -->
            <circle cx="60" cy="42" r="34" fill="#15803d" filter="url(#dropShadow)"/>
            <circle cx="42" cy="48" r="22" fill="#16a34a"/>
            <circle cx="78" cy="48" r="22" fill="#16a34a"/>
            <circle cx="60" cy="28" r="20" fill="#22c55e"/>
            <!-- Ripe Golden Oranges -->
            <g class="ripe-orange-pulse">
              <circle cx="45" cy="42" r="6.5" fill="#f97316" stroke="#ea580c" stroke-width="1"/>
              <circle cx="75" cy="42" r="6.5" fill="#f97316" stroke="#ea580c" stroke-width="1"/>
              <circle cx="60" cy="55" r="7" fill="#ea580c" stroke="#c2410c" stroke-width="1"/>
              <circle cx="34" cy="56" r="6" fill="#f97316"/>
              <circle cx="86" cy="56" r="6" fill="#f97316"/>
              <circle cx="58" cy="25" r="6" fill="#f59e0b"/>
            </g>
            <!-- Golden Sparkles -->
            <path d="M60 10 L62 14 L66 16 L62 18 L60 22 L58 18 L54 16 L58 14 Z" fill="#fbbf24" class="sparkle-anim"/>
            <path d="M88 28 L89 31 L92 32 L89 33 L88 36 L87 33 L84 32 L87 31 Z" fill="#fbbf24" class="sparkle-anim"/>
          </svg>
        `;
      } else if (historyCount >= 15) {
        treeStageTitle = 'Pohon Rimbun Bertumbuh 🌳';
        treeBadgeClass = 'stage-bushy';
        treeSvgContent = `
          <svg class="orange-tree-svg" viewBox="0 0 120 120">
            <path d="M20 105 Q60 115 100 105 Z" fill="#78350f" opacity="0.6"/>
            <path d="M54 105 Q58 80 52 60 Q57 45 60 40 Q63 45 68 60 Q62 80 66 105 Z" fill="#92400e"/>
            <circle cx="60" cy="48" r="28" fill="#15803d"/>
            <circle cx="46" cy="54" r="18" fill="#16a34a"/>
            <circle cx="74" cy="54" r="18" fill="#16a34a"/>
            <circle cx="60" cy="34" r="16" fill="#22c55e"/>
            <!-- Small Green/Orange Buds -->
            <circle cx="50" cy="48" r="4.5" fill="#84cc16"/>
            <circle cx="70" cy="48" r="4.5" fill="#84cc16"/>
            <circle cx="60" cy="58" r="4.5" fill="#f59e0b"/>
          </svg>
        `;
      } else if (historyCount >= 8) {
        treeStageTitle = 'Pohon Muda Berdaun 🌿';
        treeBadgeClass = 'stage-sapling';
        treeSvgContent = `
          <svg class="orange-tree-svg" viewBox="0 0 120 120">
            <path d="M30 105 Q60 112 90 105 Z" fill="#78350f" opacity="0.5"/>
            <path d="M56 105 Q60 85 58 70 L62 70 Q60 85 64 105 Z" fill="#92400e"/>
            <circle cx="60" cy="62" r="18" fill="#16a34a"/>
            <circle cx="48" cy="68" r="12" fill="#22c55e"/>
            <circle cx="72" cy="68" r="12" fill="#22c55e"/>
          </svg>
        `;
      } else {
        treeStageTitle = 'Tunas Baru Disiram 🌱';
        treeBadgeClass = 'stage-sprout';
        treeSvgContent = `
          <svg class="orange-tree-svg" viewBox="0 0 120 120">
            <path d="M35 105 Q60 110 85 105 Z" fill="#78350f" opacity="0.4"/>
            <path d="M58 105 Q60 90 60 80 Q60 90 62 105 Z" fill="#65a30d"/>
            <ellipse cx="52" cy="76" rx="10" ry="6" fill="#84cc16" transform="rotate(-30 52 76)"/>
            <ellipse cx="68" cy="76" rx="10" ry="6" fill="#84cc16" transform="rotate(30 68 76)"/>
          </svg>
        `;
      }

      return `
        <div class="orange-tree-card ${historyCount >= 30 ? 'harvest-ready' : ''}">
          <div class="tree-left-info">
            <div class="tree-svg-container">
              ${treeSvgContent}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0;">${h.title}</h4>
                <span class="tag-pill ${treeBadgeClass}" style="font-size: 0.65rem;">${treeStageTitle}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <span>⏱️ ${h.duration || 15} Menit/Sesi</span> • <span>🎯 ${h.goalTitle || 'Tujuan'}</span>
              </div>
            </div>
          </div>

          <div class="tree-right-progress">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
              <span>Akumulasi: ${historyCount} Hari Disiram</span>
              <span style="color: #f97316;">🔥 ${h.streak || 0}d Streak</span>
            </div>
            <div class="plant-progress-bar">
              <div class="plant-progress-fill" style="width: ${fruitPercent}%; background: var(--gradient-orange);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              <span>${minutes} Menit Total Latihan</span>
              <span style="color: #f97316; font-weight: 700;">${fruitPercent}% Matang (Target 30 Hari)</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 7. Tab: Kalender Rutinitas 365 Hari 📅 (Kalender Berjalan & Heatmap)
  // =========================================================================
  static setCalendarViewMode(mode) {
    this.calendarViewMode = mode;
    const btnMonthly = document.getElementById('btn-cal-view-monthly');
    const btnTimeline = document.getElementById('btn-cal-view-timeline');
    if (btnMonthly) btnMonthly.classList.toggle('active', mode === 'monthly');
    if (btnTimeline) btnTimeline.classList.toggle('active', mode === 'timeline');
    this.renderKalenderRutinitas();
  }

  static changeCalendarYear(delta) {
    this.calendarYear += delta;
    const label = document.getElementById('cal-active-year-label');
    const desc = document.getElementById('cal-running-date-desc');
    if (label) label.textContent = this.calendarYear;
    if (desc) desc.textContent = `Visualisasi kalender aktif berjalan tahun ${this.calendarYear}. Klik tanggal mana saja untuk mencatat riwayat kebiasaan.`;
    this.renderKalenderRutinitas();
  }

  static setLiveInspectorInfo(iso, habitTitle, isDone) {
    const inspector = document.getElementById('cal-live-inspector');
    if (!inspector) return;
    const formatted = this.formatIndonesianDate(iso);
    const statusText = isDone ? '✅ Selesai Dikerjakan' : '⚪ Belum Dikerjakan';
    inspector.innerHTML = `<span><strong>${habitTitle}:</strong> 📅 ${formatted} — <span style="color: ${isDone ? '#10b981' : '#f59e0b'}; font-weight: 700;">${statusText}</span> (Klik untuk ubah status)</span>`;
  }

  static renderKalenderRutinitas() {
    const container = document.getElementById('kalender-rutinitas-container');
    if (!container) return;

    const habits = StorageManager.getHabits();
    const currentYear = this.calendarYear;

    const yearLabel = document.getElementById('cal-active-year-label');
    if (yearLabel) yearLabel.textContent = currentYear;

    const todayDateLabel = document.getElementById('cal-legend-today-label');
    if (todayDateLabel) todayDateLabel.textContent = this.formatIndonesianShort(new Date());

    const now = new Date();
    const isCurrentRunningYear = now.getFullYear() === currentYear;
    const runningMonthIndex = isCurrentRunningYear ? now.getMonth() : -1;

    container.innerHTML = habits.map((h, idx) => {
      const history = h.history || {};
      const completedDaysCount = Object.keys(history).filter(k => k.startsWith(`${currentYear}`) && history[k]).length;
      const isDoneToday = Boolean(history[this.todayIso]);
      const catColor = h.color || '#8b5cf6';

      const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const completedThisMonth = Object.keys(history).filter(k => k.startsWith(currentMonthPrefix) && history[k]).length;

      let calendarBodyHTML = '';

      if (this.calendarViewMode === 'monthly') {
        const monthCards = [];

        for (let m = 0; m < 12; m++) {
          const monthName = this.INDO_MONTHS[m];
          const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
          const firstDayIndex = new Date(currentYear, m, 1).getDay();
          const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
          const monthDoneCount = Object.keys(history).filter(k => k.startsWith(monthPrefix) && history[k]).length;
          const isThisActiveMonth = isCurrentRunningYear && m === runningMonthIndex;

          const dayCells = [];
          for (let p = 0; p < firstDayIndex; p++) {
            dayCells.push(`<div class="month-day-cell empty"></div>`);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            const iso = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isChecked = Boolean(history[iso]);
            const isToday = iso === this.todayIso;

            dayCells.push(`
              <div class="month-day-cell ${isChecked ? 'checked' : ''} ${isToday ? 'today-cell' : ''}"
                   style="${isChecked ? `--day-active-color: ${catColor};` : ''}"
                   title="${this.INDO_DAYS[new Date(currentYear, m, day).getDay()]}, ${day} ${monthName} ${currentYear}: ${isChecked ? 'Selesai ✓' : 'Belum Dikerjakan'}"
                   onmouseenter="GoalGettenApp.setLiveInspectorInfo('${iso}', '${h.title.replace(/'/g, "\\'")}', ${isChecked})"
                   onclick="event.stopPropagation(); GoalGettenApp.toggleHabit('${h.id}', '${iso}')">
                <span>${day}</span>
              </div>
            `);
          }

          monthCards.push(`
            <div class="month-calendar-card ${isThisActiveMonth ? 'current-active-month' : ''}">
              <div class="month-card-header">
                <div>
                  <span class="month-card-title">${monthName}</span>
                  ${isThisActiveMonth ? '<span class="month-today-badge">Bulan Ini</span>' : ''}
                </div>
                <span class="month-card-stat" style="color: ${catColor};">${monthDoneCount}/${daysInMonth}</span>
              </div>
              <div class="month-weekday-labels">
                <span>M</span><span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span>
              </div>
              <div class="month-days-grid">
                ${dayCells.join('')}
              </div>
            </div>
          `);
        }

        calendarBodyHTML = `
          <div class="months-12-grid">
            ${monthCards.join('')}
          </div>
        `;
      } else {
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        const startDayOfWeek = startDate.getDay();

        const cells = [];
        for (let p = 0; p < startDayOfWeek; p++) {
          cells.push(`<div class="year-heatmap-cell empty"></div>`);
        }

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().slice(0, 10);
          const isChecked = Boolean(history[iso]);
          const isToday = iso === this.todayIso;

          cells.push(`
            <div class="year-heatmap-cell ${isChecked ? 'checked' : ''} ${isToday ? 'today-cell' : ''}" 
                 style="${isChecked ? `--day-active-color: ${catColor};` : ''}"
                 title="${this.formatIndonesianDate(iso)}: ${isChecked ? 'Selesai ✓' : 'Belum Selesai'}"
                 onmouseenter="GoalGettenApp.setLiveInspectorInfo('${iso}', '${h.title.replace(/'/g, "\\'")}', ${isChecked})"
                 onclick="event.stopPropagation(); GoalGettenApp.toggleHabit('${h.id}', '${iso}')">
            </div>
          `);
        }

        calendarBodyHTML = `
          <div class="timeline-heatmap-wrapper">
            <div class="timeline-months-row">
              ${this.INDO_MONTHS_SHORT.map(m => `<span>${m}</span>`).join('')}
            </div>
            <div class="timeline-grid-with-days">
              <div class="timeline-day-labels">
                <span>Min</span>
                <span>Sel</span>
                <span>Kam</span>
                <span>Sab</span>
              </div>
              <div class="year-heatmap-grid">
                ${cells.join('')}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="calendar-accordion-item ${idx === 0 ? 'expanded' : ''}" id="accordion-${h.id}">
          <div class="calendar-accordion-header" onclick="GoalGettenApp.toggleAccordion('${h.id}')">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <button class="custom-checkbox" onclick="event.stopPropagation(); GoalGettenApp.toggleHabit('${h.id}', '${this.todayIso}')">
                ${isDoneToday ? '✓' : ''}
              </button>
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #ffffff;">${h.title}</h4>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${h.category} • 🎯 ${h.goalTitle || ''}</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
              <span class="streak-tag">🔥 ${h.streak || 0} d</span>
              <span style="font-size: 0.8rem; font-weight: 600; color: #10b981;">${completedDaysCount} Hari Selesai (${currentYear})</span>
              <span class="cal-month-badge" style="font-size: 0.75rem; color: #818cf8; background: rgba(99, 102, 241, 0.12); padding: 0.2rem 0.6rem; border-radius: 9999px;">
                Bulan Ini: ${completedThisMonth} Selesai
              </span>
              <span class="icon-btn" style="font-size: 0.8rem;">▼</span>
            </div>
          </div>

          <div class="calendar-accordion-body">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.85rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-glass); flex-wrap: wrap; gap: 0.5rem;">
              <span>📅 <strong>${h.title}</strong> — Kalender Rutinitas Tahun ${currentYear}</span>
              <span style="color: ${catColor}; font-weight: 700;">Total Akumulasi: ${completedDaysCount} Hari Aktif (${Math.round((completedDaysCount/365)*100)}%)</span>
            </div>
            ${calendarBodyHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  static toggleAccordion(habitId) {
    const el = document.getElementById(`accordion-${habitId}`);
    if (el) {
      el.classList.toggle('expanded');
    }
  }

  // =========================================================================
  // 8. Tab: Dashboard Analisis & Integrasi Google Calendar Lengkap
  // =========================================================================
  static renderAnalytics() {
    const container = document.getElementById('analytics-dashboard-view');
    if (!container) return;

    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();

    // 1. Calculate overall consistency
    let totalPossibleHabitDays = habits.length * 7;
    let completedPast7Days = 0;
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      habits.forEach(h => {
        if (h.history && h.history[iso]) completedPast7Days++;
      });
    }

    const consistencyScore = totalPossibleHabitDays > 0 ? Math.round((completedPast7Days / totalPossibleHabitDays) * 100) : 0;

    // 2. Category time investments
    const categoryStats = {
      'Spiritual': { count: 0, minutes: 0, color: '#8b5cf6' },
      'Physical / Health': { count: 0, minutes: 0, color: '#10b981' },
      'Intellectual / Career': { count: 0, minutes: 0, color: '#f59e0b' },
      'Keuangan': { count: 0, minutes: 0, color: '#06b6d4' },
      'Emotional / Personal': { count: 0, minutes: 0, color: '#f43f5e' },
      'Creativity / Custom': { count: 0, minutes: 0, color: '#d946ef' }
    };

    let grandTotalMinutes = 0;
    habits.forEach(h => {
      const cat = h.category || 'Spiritual';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, minutes: 0, color: '#8b5cf6' };
      }
      const historyCount = h.history ? Object.values(h.history).filter(Boolean).length : 0;
      const min = historyCount * (h.duration || 15);
      categoryStats[cat].count += historyCount;
      categoryStats[cat].minutes += min;
      grandTotalMinutes += min;
    });

    const grandTotalHours = (grandTotalMinutes / 60).toFixed(1);

    // 3. Leaderboard
    const sortedStreaks = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0));
    const topStreakHabit = sortedStreaks[0] || null;

    container.innerHTML = `
      <!-- KPI Top Summary Grid -->
      <div class="analytics-kpi-grid">
        <div class="stat-box">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">📊</div>
          <div class="stat-info">
            <h4>Skor Konsistensi (7 Hari)</h4>
            <div class="stat-value" style="color: #10b981;">${consistencyScore}% Disiplin</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;">⏱️</div>
          <div class="stat-info">
            <h4>Total Jam Investasi</h4>
            <div class="stat-value">${grandTotalHours} Jam Waktu Fokus</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-icon" style="background: rgba(249, 115, 22, 0.15); color: #f97316;">🔥</div>
          <div class="stat-info">
            <h4>Juara Streak</h4>
            <div class="stat-value" style="font-size: 1rem;">${topStreakHabit ? `${topStreakHabit.title} (${topStreakHabit.streak}d)` : '-'}</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-icon" style="background: rgba(234, 88, 12, 0.15); color: #ea580c;">🎯</div>
          <div class="stat-info">
            <h4>Target Goal Aktif</h4>
            <div class="stat-value">${goals.length} Goal Terhubung</div>
          </div>
        </div>
      </div>

      <!-- Two Column Deep Insights -->
      <div class="analytics-two-col-grid" style="margin-top: 1.5rem;">
        
        <!-- Left: Category Time Distribution Breakdown -->
        <div class="analytics-card-glass">
          <div class="card-glass-header">
            <h4>📈 Alokasi Waktu per Kategori</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Total: ${grandTotalHours} Jam</span>
          </div>

          <div class="category-bars-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            ${Object.entries(categoryStats).map(([catName, data]) => {
              const pct = grandTotalMinutes > 0 ? Math.round((data.minutes / grandTotalMinutes) * 100) : 0;
              const hrs = (data.minutes / 60).toFixed(1);
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
                    <span style="font-weight: 600; color: #ffffff;">${catName}</span>
                    <span style="color: ${data.color}; font-weight: 700;">${hrs} Jam (${pct}%)</span>
                  </div>
                  <div class="plant-progress-bar" style="height: 8px;">
                    <div class="plant-progress-fill" style="width: ${pct}%; background: ${data.color};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Habit Leaderboard & Consistency Hall of Fame -->
        <div class="analytics-card-glass">
          <div class="card-glass-header">
            <h4>🏆 Hall of Fame Konsistensi</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Top Habit</span>
          </div>

          <div class="leaderboard-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.65rem;">
            ${sortedStreaks.slice(0, 5).map((h, i) => {
              const medals = ['🥇', '🥈', '🥉', '⭐', '✨'];
              const historyCount = h.history ? Object.values(h.history).filter(Boolean).length : 0;
              return `
                <div class="leaderboard-item-row">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span class="leaderboard-medal">${medals[i] || '•'}</span>
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">${h.title}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${h.category} • Total ${historyCount} Hari</div>
                    </div>
                  </div>
                  <span class="streak-tag">🔥 ${h.streak || 0} d</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Action Integrations & Tools Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
        
        <!-- Google Calendar Card -->
        <div class="stat-box" style="flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">📅</div>
            <h4 style="font-size: 1.1rem; color: var(--text-primary);">Google Calendar (.ICS)</h4>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            Sinkronisasi seluruh rutinitas harian dan deadline goal ke Google Calendar, Apple Calendar, atau Outlook.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="GoalGettenApp.exportCalendarICS()">Unduh Berkas (.ics)</button>
            <button class="btn btn-secondary" onclick="AICoachManager.openDrawer()">Tanya Tips AI</button>
          </div>
        </div>

        <!-- Mass Upload Box -->
        <div class="stat-box" style="flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">📥</div>
            <h4 style="font-size: 1.1rem; color: var(--text-primary);">Mass Upload Habit</h4>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            Tambahkan puluhan habit baru sekaligus menggunakan file spreadsheet CSV, salin-tempel teks, atau AI Generator.
          </p>
          <button class="btn btn-emerald" onclick="GoalGettenApp.openMassUploadModal()">Buka Mass Upload Habit</button>
        </div>

        <!-- Backup & Restore Box -->
        <div class="stat-box" style="flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="stat-icon" style="background: rgba(249, 115, 22, 0.2); color: #f97316;">💾</div>
            <h4 style="font-size: 1.1rem; color: var(--text-primary);">Backup & Restore Data</h4>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            Simpan cadangan data lokal ke format JSON aman atau pulihkan data riwayat dari perangkat lain.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="GoalGettenApp.exportBackupJSON()">Ekspor JSON</button>
            <label class="btn btn-secondary" style="cursor: pointer;">
              <span>Impor JSON</span>
              <input type="file" accept=".json" style="display: none;" onchange="GoalGettenApp.importBackupJSON(event)">
            </label>
            <button class="btn btn-secondary" style="color: #ef4444;" onclick="GoalGettenApp.resetDefault()">Reset Default</button>
          </div>
        </div>

      </div>
    `;
  }

  // =========================================================================
  // 9. Focus Pomodoro Habit Timer Controller ⏱️
  // =========================================================================
  static activeTimerAmbient = 'mute';

  static openFocusTimer(habitId) {
    const habits = StorageManager.getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    this.activeTimerHabit = habit;
    const durMinutes = habit.duration || 15;
    this.timerTotalSeconds = durMinutes * 60;
    this.timerRemainingSeconds = this.timerTotalSeconds;
    this.isTimerRunning = false;

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (window.AmbientSoundEngine) AmbientSoundEngine.stop();

    const titleEl = document.getElementById('timer-habit-title');
    const goalEl = document.getElementById('timer-habit-goal');
    const catEl = document.getElementById('timer-habit-category');
    const statusEl = document.getElementById('timer-status-label');
    const toggleBtn = document.getElementById('btn-timer-toggle');

    if (titleEl) titleEl.textContent = habit.title;
    if (goalEl) goalEl.textContent = `🎯 Goal: ${habit.goalTitle || 'Tujuan Utama'}`;
    if (catEl) {
      catEl.textContent = `🏷️ ${habit.category || 'Spiritual'}`;
      catEl.style.background = `${habit.color || '#8b5cf6'}25`;
      catEl.style.color = habit.color || '#8b5cf6';
    }
    if (statusEl) statusEl.textContent = 'SIAP FOKUS';
    if (toggleBtn) toggleBtn.innerHTML = `<span>▶️ Mulai Fokus</span>`;

    // Highlight closest preset button
    document.querySelectorAll('.timer-preset-btn').forEach(btn => {
      const min = parseInt(btn.getAttribute('data-min'));
      btn.classList.toggle('active', min === durMinutes);
    });

    // Reset ambient pill
    this.activeTimerAmbient = 'mute';
    document.querySelectorAll('.ambient-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-type') === 'mute');
    });

    this.updateTimerDisplay();

    const modal = document.getElementById('modal-focus-timer');
    if (modal) modal.classList.add('active');
  }

  static setTimerPreset(minutes) {
    if (this.isTimerRunning) return; // don't switch during active run without reset
    this.timerTotalSeconds = minutes * 60;
    this.timerRemainingSeconds = this.timerTotalSeconds;

    document.querySelectorAll('.timer-preset-btn').forEach(btn => {
      const m = parseInt(btn.getAttribute('data-min'));
      btn.classList.toggle('active', m === minutes);
    });

    this.updateTimerDisplay();
    if (window.SoundEffects) SoundEffects.playPop();
  }

  static setAmbientSound(type) {
    this.activeTimerAmbient = type;
    document.querySelectorAll('.ambient-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-type') === type);
    });

    if (this.isTimerRunning && window.AmbientSoundEngine) {
      AmbientSoundEngine.setSound(type, 0.35);
    }
    if (window.SoundEffects) SoundEffects.playPop();
  }

  static toggleTimerRun() {
    const toggleBtn = document.getElementById('btn-timer-toggle');
    const statusEl = document.getElementById('timer-status-label');

    if (this.isTimerRunning) {
      // Pause
      this.isTimerRunning = false;
      if (this.timerInterval) clearInterval(this.timerInterval);
      if (window.AmbientSoundEngine) AmbientSoundEngine.stop();
      if (toggleBtn) toggleBtn.innerHTML = `<span>▶️ Lanjutkan</span>`;
      if (statusEl) statusEl.textContent = 'DIJEDA (PAUSED)';
      if (window.SoundEffects) SoundEffects.playPop();
    } else {
      // Start / Resume
      this.isTimerRunning = true;
      if (toggleBtn) toggleBtn.innerHTML = `<span>⏸️ Jeda</span>`;
      if (statusEl) statusEl.textContent = 'SEDANG BERJALAN 🔥';
      if (window.SoundEffects) SoundEffects.playPop();

      if (window.AmbientSoundEngine && this.activeTimerAmbient !== 'mute') {
        AmbientSoundEngine.setSound(this.activeTimerAmbient, 0.35);
      }

      this.timerInterval = setInterval(() => {
        this.tickTimer();
      }, 1000);
    }
  }

  static tickTimer() {
    if (this.timerRemainingSeconds > 0) {
      this.timerRemainingSeconds--;
      this.updateTimerDisplay();
    } else {
      // Finished naturally
      this.completeTimerEarly(true);
    }
  }

  static resetTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (window.AmbientSoundEngine) AmbientSoundEngine.stop();
    this.isTimerRunning = false;
    this.timerRemainingSeconds = this.timerTotalSeconds;

    const toggleBtn = document.getElementById('btn-timer-toggle');
    const statusEl = document.getElementById('timer-status-label');
    if (toggleBtn) toggleBtn.innerHTML = `<span>▶️ Mulai</span>`;
    if (statusEl) statusEl.textContent = 'SIAP FOKUS';

    this.updateTimerDisplay();
    if (window.SoundEffects) SoundEffects.playPop();
  }

  static updateTimerDisplay() {
    const digitsEl = document.getElementById('timer-digits');
    const progressSvg = document.getElementById('timer-progress-svg');

    const m = Math.floor(this.timerRemainingSeconds / 60);
    const s = this.timerRemainingSeconds % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (digitsEl) digitsEl.textContent = formatted;

    if (progressSvg && this.timerTotalSeconds > 0) {
      const radius = 88;
      const circumference = 2 * Math.PI * radius;
      const progressFraction = this.timerRemainingSeconds / this.timerTotalSeconds;
      const offset = circumference * (1 - progressFraction);
      progressSvg.style.strokeDasharray = `${circumference}`;
      progressSvg.style.strokeDashoffset = `${offset}`;
    }
  }

  static completeTimerEarly(autoFinish = false) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (window.AmbientSoundEngine) AmbientSoundEngine.stop();
    this.isTimerRunning = false;

    const habit = this.activeTimerHabit;
    if (habit) {
      const habits = StorageManager.getHabits();
      const target = habits.find(h => h.id === habit.id);
      if (target) {
        if (!target.history) target.history = {};
        target.history[this.todayIso] = true;
        this.recalcStreak(target);
        StorageManager.saveHabits(habits);
        if (window.AuthManager) {
          AuthManager.pushHabitToggle(target.id, this.todayIso, true);
        }
      }
    }

    if (window.SoundEffects) SoundEffects.playTimerFinish();
    if (window.ConfettiEngine) ConfettiEngine.launch(3500);
    if (window.GamificationManager) GamificationManager.addXP(35);

    this.closeFocusTimer();
    this.showToast(`🏆 Sesi Fokus Selesai! Habit "${habit ? habit.title : ''}" berhasil dicentang (+35 XP)!`, 'success', 4500);
    this.renderAll();
  }

  static closeFocusTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (window.AmbientSoundEngine) AmbientSoundEngine.stop();
    this.isTimerRunning = false;
    const modal = document.getElementById('modal-focus-timer');
    if (modal) modal.classList.remove('active');
  }

  // =========================================================================
  // Check-in & Subgoal Handlers
  // =========================================================================
  static toggleHabit(habitId, dateIso) {
    const habits = StorageManager.getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.history) habit.history = {};
    const isNowDone = !habit.history[dateIso];
    habit.history[dateIso] = isNowDone;

    this.recalcStreak(habit);

    StorageManager.saveHabits(habits);
    if (window.AuthManager) {
      AuthManager.pushHabitToggle(habitId, dateIso, isNowDone);
    }

    if (isNowDone) {
      if (window.GamificationManager) {
        GamificationManager.addXP(25);
      } else if (window.SoundEffects) {
        SoundEffects.playPop();
      }
    }

    // Smooth transition if in 'pending' filter mode so cards below don't jump abruptly
    const cardEl = document.querySelector(`.habit-card-v2[data-habit-id="${habitId}"]`);
    if (this.currentTab === 'fokus-hari-ini' && this.currentStatusFilter === 'pending' && isNowDone && cardEl) {
      cardEl.classList.add('completed', 'habit-fade-out');
      setTimeout(() => {
        this.renderAll();
      }, 250);
      return;
    }

    this.renderAll();
  }

  static recalcStreak(habit) {
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);

      if (habit.history && habit.history[iso]) {
        currentStreak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    habit.streak = currentStreak;
  }

  static toggleSubgoal(goalId, subgoalId) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.subgoals) return;

    const sg = goal.subgoals.find(s => s.id === subgoalId);
    if (!sg) return;

    sg.done = !sg.done;
    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalSave(goal);
    }
    if (sg.done) {
      if (window.GamificationManager) {
        GamificationManager.addXP(40);
      }
      GoalGettenApp.showToast(`🎯 Milestone tercapai: "${sg.text}" (+40 XP)`, 'success');
      if (goal.subgoals.every(s => s.done)) {
        if (window.ConfettiEngine) ConfettiEngine.launch(3000);
        if (window.GamificationManager) GamificationManager.addXP(100);
        GoalGettenApp.showToast(`🏆 Goal Selesai 100%: "${goal.title}" (+100 XP)`, 'success', 4500);
      }
    }
    this.renderAll();
  }

  static promptAddSubgoal(goalId) {
    GoalGettenApp.showSubgoalModal(goalId);
  }

  static showSubgoalModal(goalId) {
    const modal = document.getElementById('modal-subgoal');
    if (!modal) return;
    document.getElementById('subgoal-goal-id').value = goalId;
    document.getElementById('subgoal-text-input').value = '';
    document.getElementById('subgoal-date-input').value = new Date().toISOString().slice(0, 10);
    modal.classList.add('active');
    setTimeout(() => document.getElementById('subgoal-text-input').focus(), 200);
  }

  static saveSubgoalFromModal() {
    const goalId = document.getElementById('subgoal-goal-id').value;
    const text = document.getElementById('subgoal-text-input').value.trim();
    const targetDate = document.getElementById('subgoal-date-input').value;
    if (!text) return;

    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    if (!goal.subgoals) goal.subgoals = [];
    goal.subgoals.push({
      id: 'sg-' + Date.now(),
      text: text,
      targetDate: targetDate || '',
      done: false
    });

    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalSave(goal);
    }
    this.closeModal('modal-subgoal');
    this.showToast('✅ Sub-goal baru ditambahkan!', 'success');
    this.renderAll();
  }

  static deleteSubgoal(goalId, subgoalId) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.subgoals) return;

    goal.subgoals = goal.subgoals.filter(s => s.id !== subgoalId);
    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalSave(goal);
    }
    this.renderAll();
  }

  // =========================================================================
  // Modals & Form bindings
  // =========================================================================
  static bindModals() {
    const habitForm = document.getElementById('modal-habit-form');
    if (habitForm) {
      habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveHabitFromForm();
      });
    }

    const goalForm = document.getElementById('modal-goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveGoalFromForm();
      });
    }

    const projectForm = document.getElementById('modal-project-form');
    if (projectForm) {
      projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProjectFromForm();
      });
    }
  }

  static handleFrequencyChange(freq) {
    const box = document.getElementById('modal-habit-custom-days-box');
    if (box) {
      box.style.display = freq === 'custom' ? 'block' : 'none';
    }
  }

  static openAddHabitModal() {
    const heading = document.getElementById('modal-habit-heading');
    if (heading) heading.textContent = 'Tambah Habit Baru';
    document.getElementById('modal-habit-id').value = '';
    document.getElementById('modal-habit-title').value = '';
    document.getElementById('modal-habit-category').value = 'Spiritual';
    const timeEl = document.getElementById('modal-habit-time');
    if (timeEl) timeEl.value = '06:00';
    document.getElementById('modal-habit-duration').value = '15';
    document.getElementById('modal-habit-frequency').value = 'daily';
    document.getElementById('modal-habit-plan').value = '';
    this.handleFrequencyChange('daily');
    this.populateGoalSelect();
    document.getElementById('modal-habit').classList.add('active');
  }

  static openEditHabitModal(id) {
    const habit = StorageManager.getHabits().find(h => h.id === id);
    if (!habit) return;

    const heading = document.getElementById('modal-habit-heading');
    if (heading) heading.textContent = 'Edit Habit';
    document.getElementById('modal-habit-id').value = habit.id;
    document.getElementById('modal-habit-title').value = habit.title;
    document.getElementById('modal-habit-category').value = habit.category;
    const timeEl = document.getElementById('modal-habit-time');
    if (timeEl) timeEl.value = habit.time || '08:00';
    document.getElementById('modal-habit-duration').value = habit.duration || 15;
    const freq = habit.frequency || 'daily';
    document.getElementById('modal-habit-frequency').value = freq;
    this.handleFrequencyChange(freq);

    if (habit.targetDays && Array.isArray(habit.targetDays)) {
      document.querySelectorAll('input[name="habit-target-day"]').forEach(cb => {
        cb.checked = habit.targetDays.includes(parseInt(cb.value));
      });
    }

    document.getElementById('modal-habit-plan').value = habit.plan || '';
    this.populateGoalSelect(habit.goalId);
    document.getElementById('modal-habit').classList.add('active');
  }

  static populateGoalSelect(selectedGoalId = null) {
    const select = document.getElementById('modal-habit-goal');
    if (!select) return;

    const goals = StorageManager.getGoals();
    select.innerHTML = goals.map(g => `
      <option value="${g.id}" ${g.id === selectedGoalId ? 'selected' : ''}>${g.title}</option>
    `).join('');
  }

  static saveHabitFromForm() {
    const id = document.getElementById('modal-habit-id').value;
    const title = document.getElementById('modal-habit-title').value.trim();
    const category = document.getElementById('modal-habit-category').value;
    const time = (document.getElementById('modal-habit-time')?.value || '08:00').trim();
    const duration = parseInt(document.getElementById('modal-habit-duration').value) || 15;
    const frequency = document.getElementById('modal-habit-frequency').value || 'daily';
    const goalId = document.getElementById('modal-habit-goal').value;
    const plan = document.getElementById('modal-habit-plan').value.trim();

    const targetDays = [];
    if (frequency === 'daily') {
      targetDays.push(0, 1, 2, 3, 4, 5, 6);
    } else if (frequency === 'weekdays') {
      targetDays.push(1, 2, 3, 4, 5);
    } else if (frequency === 'weekends') {
      targetDays.push(0, 6);
    } else if (frequency === 'custom') {
      document.querySelectorAll('input[name="habit-target-day"]:checked').forEach(cb => {
        targetDays.push(parseInt(cb.value));
      });
    }

    if (!title) return;

    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    const goalTitle = goal ? goal.title : '';

    const catColors = {
      'Spiritual': '#8b5cf6',
      'Physical / Health': '#10b981',
      'Intellectual / Career': '#f59e0b',
      'Keuangan': '#06b6d4',
      'Emotional / Personal': '#f43f5e',
      'Creativity / Custom': '#d946ef'
    };

    const habits = StorageManager.getHabits();
    let savedHabit = null;

    if (id) {
      const h = habits.find(x => x.id === id);
      if (h) {
        h.title = title;
        h.category = category;
        h.time = time;
        h.duration = duration;
        h.frequency = frequency;
        h.targetDays = targetDays;
        h.goalId = goalId;
        h.goalTitle = goalTitle;
        h.plan = plan;
        h.color = catColors[category] || '#8b5cf6';
        savedHabit = h;
      }
    } else {
      savedHabit = {
        id: 'h-' + Date.now(),
        title,
        category,
        time,
        duration,
        frequency,
        targetDays,
        goalId,
        goalTitle,
        plan,
        color: catColors[category] || '#8b5cf6',
        streak: 0,
        history: {}
      };
      habits.push(savedHabit);
    }

    StorageManager.saveHabits(habits);
    if (window.AuthManager && savedHabit) {
      AuthManager.pushHabitSave(savedHabit);
    }
    this.closeModal('modal-habit');
    this.showToast(id ? '✏️ Habit berhasil diperbarui!' : '✅ Habit baru berhasil ditambahkan!', 'success');
    this.renderAll();
  }

  static deleteHabit(id) {
    GoalGettenApp.showConfirm('Hapus habit ini beserta seluruh riwayatnya?', () => {
      let habits = StorageManager.getHabits();
      habits = habits.filter(h => h.id !== id);
      StorageManager.saveHabits(habits);
      if (window.AuthManager) {
        AuthManager.pushHabitDelete(id);
      }
      GoalGettenApp.showToast('🗑️ Habit berhasil dihapus', 'info');
      GoalGettenApp.renderAll();
    });
  }

  static openAddGoalModal() {
    const heading = document.getElementById('modal-goal-heading');
    if (heading) heading.textContent = 'Buat Goal Baru';
    document.getElementById('modal-goal-id').value = '';
    document.getElementById('modal-goal-form').reset();
    document.getElementById('modal-goal').classList.add('active');
  }

  static openEditGoalModal(goalId) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const heading = document.getElementById('modal-goal-heading');
    if (heading) heading.textContent = 'Edit Goal Utama';
    document.getElementById('modal-goal-id').value = goal.id;
    document.getElementById('modal-goal-title').value = goal.title || '';
    document.getElementById('modal-goal-category').value = goal.category || 'Spiritual';
    document.getElementById('modal-goal-target').value = goal.targetDate || '';
    document.getElementById('modal-goal-desc').value = goal.description || '';
    document.getElementById('modal-goal').classList.add('active');
  }

  static saveGoalFromForm() {
    const id = document.getElementById('modal-goal-id').value;
    const title = document.getElementById('modal-goal-title').value.trim();
    const category = document.getElementById('modal-goal-category').value;
    const description = document.getElementById('modal-goal-desc').value.trim();
    const targetDate = document.getElementById('modal-goal-target').value;

    if (!title) return;

    const catColors = {
      'Spiritual': '#8b5cf6',
      'Physical / Health': '#10b981',
      'Intellectual / Career': '#f59e0b',
      'Keuangan': '#06b6d4',
      'Emotional / Personal': '#f43f5e',
      'Creativity / Custom': '#d946ef'
    };

    const goals = StorageManager.getGoals();
    let savedGoal = null;

    if (id) {
      const g = goals.find(x => x.id === id);
      if (g) {
        const oldTitle = g.title;
        g.title = title;
        g.category = category;
        g.description = description;
        g.targetDate = targetDate;
        g.color = catColors[category] || '#8b5cf6';
        savedGoal = g;

        // Sync linked habits' goalTitle if title changed
        if (oldTitle !== title) {
          const habits = StorageManager.getHabits();
          habits.forEach(h => {
            if (h.goalId === g.id) h.goalTitle = title;
          });
          StorageManager.saveHabits(habits);
        }
      }
    } else {
      savedGoal = {
        id: 'g-' + Date.now(),
        title,
        category,
        description,
        targetDate,
        color: catColors[category] || '#8b5cf6',
        subgoals: []
      };
      goals.push(savedGoal);
    }

    StorageManager.saveGoals(goals);
    if (window.AuthManager && savedGoal) {
      AuthManager.pushGoalSave(savedGoal);
    }
    this.closeModal('modal-goal');
    this.showToast(id ? '✏️ Goal berhasil diperbarui!' : '🎯 Goal baru berhasil dibuat!', 'success');
    this.renderAll();
  }

  static deleteGoal(id) {
    GoalGettenApp.showConfirm('Hapus goal ini beserta semua sub-goalnya?', () => {
      let goals = StorageManager.getGoals();
      goals = goals.filter(g => g.id !== id);
      StorageManager.saveGoals(goals);
      if (window.AuthManager) {
        AuthManager.pushGoalDelete(id);
      }
      GoalGettenApp.showToast('🗑️ Goal berhasil dihapus', 'info');
      GoalGettenApp.renderAll();
    });
  }

  static closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  static exportCalendarICS() {
    StorageManager.downloadICS();
  }

  static exportBackupJSON() {
    StorageManager.exportBackupJSON();
  }

  static importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const ok = StorageManager.importBackupJSON(e.target.result);
      if (ok) {
        GoalGettenApp.showToast('✅ Data berhasil dipulihkan dari backup!', 'success');
        GoalGettenApp.renderAll();
      } else {
        GoalGettenApp.showToast('❌ Format file JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  }

  static resetDefault() {
    GoalGettenApp.showConfirm('⚠️ Kembalikan semua data ke sampel bawaan GoalGetten? Semua data Anda akan hilang.', () => {
      StorageManager.resetToDefault();
      GoalGettenApp.showToast('🔄 Data berhasil dikembalikan ke default', 'info');
      GoalGettenApp.renderAll();
    });
  }

  // =========================================================================
  // 10. Mass Upload Habit Module 🚀
  // =========================================================================
  static bindMassUpload() {
    const dropzone = document.getElementById('mass-upload-dropzone');
    const fileInput = document.getElementById('mass-upload-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleMassFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleMassFile(e.target.files[0]);
        }
      });
    }

    const pasteInput = document.getElementById('mass-paste-textarea');
    if (pasteInput) {
      pasteInput.addEventListener('input', () => {
        this.parseMassPastedText(pasteInput.value);
      });
    }
  }

  static openMassUploadModal() {
    this.parsedMassHabits = [];
    document.getElementById('mass-paste-textarea').value = '';
    document.getElementById('mass-upload-file-input').value = '';
    this.switchMassUploadTab('csv');
    this.renderMassPreviewTable();
    document.getElementById('modal-mass-upload').classList.add('active');
  }

  static switchMassUploadTab(tab) {
    document.querySelectorAll('.upload-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    const csvPane = document.getElementById('mass-tab-csv-pane');
    const textPane = document.getElementById('mass-tab-text-pane');
    const aiPane = document.getElementById('mass-tab-ai-pane');

    if (csvPane) csvPane.style.display = tab === 'csv' ? 'block' : 'none';
    if (textPane) textPane.style.display = tab === 'text' ? 'block' : 'none';
    if (aiPane) aiPane.style.display = tab === 'ai' ? 'block' : 'none';
  }

  static handleMassFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseCSVContent(text);
    };
    reader.readAsText(file);
  }

  static parseCSVContent(csvText) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const parsed = [];
    const goals = StorageManager.getGoals();

    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('nama') || firstLineLower.includes('habit') || firstLineLower.includes('title')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let cols = [];
      if (line.includes(';')) {
        cols = line.split(';');
      } else if (line.includes('|')) {
        cols = line.split('|');
      } else if (line.includes('\t')) {
        cols = line.split('\t');
      } else {
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      }

      cols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());

      const title = cols[0] || '';
      if (!title) continue;

      const category = cols[1] || 'Spiritual';
      const duration = parseInt(cols[2]) || 15;
      const goalName = cols[3] || (goals[0] ? goals[0].title : 'Tujuan Utama');
      const plan = cols[4] || '';

      parsed.push({
        title,
        category: this.normalizeCategory(category),
        duration,
        goalName,
        plan,
        selected: true
      });
    }

    this.parsedMassHabits = parsed;
    this.renderMassPreviewTable();
  }

  static parseMassPastedText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];
    const goals = StorageManager.getGoals();

    lines.forEach(line => {
      let cols = [];
      if (line.includes('|')) cols = line.split('|');
      else if (line.includes(';')) cols = line.split(';');
      else if (line.includes(',')) cols = line.split(',');
      else cols = [line];

      cols = cols.map(c => c.trim());
      const title = cols[0];
      if (!title) return;

      const category = cols[1] || 'Spiritual';
      const duration = parseInt(cols[2]) || 15;
      const goalName = cols[3] || (goals[0] ? goals[0].title : 'Tujuan Utama');
      const plan = cols[4] || '';

      parsed.push({
        title,
        category: this.normalizeCategory(category),
        duration,
        goalName,
        plan,
        selected: true
      });
    });

    this.parsedMassHabits = parsed;
    this.renderMassPreviewTable();
  }

  static normalizeCategory(cat) {
    const lower = cat.toLowerCase();
    if (lower.includes('spirit') || lower.includes('doa') || lower.includes('sholat')) return 'Spiritual';
    if (lower.includes('health') || lower.includes('fisik') || lower.includes('sehat') || lower.includes('olahraga')) return 'Physical / Health';
    if (lower.includes('career') || lower.includes('karir') || lower.includes('kerja') || lower.includes('coding') || lower.includes('intel')) return 'Intellectual / Career';
    if (lower.includes('keuangan') || lower.includes('uang') || lower.includes('finan')) return 'Keuangan';
    if (lower.includes('emosi') || lower.includes('person') || lower.includes('diri')) return 'Emotional / Personal';
    if (lower.includes('kreatif') || lower.includes('creat')) return 'Creativity / Custom';
    return 'Spiritual';
  }

  static renderMassPreviewTable() {
    const tableBody = document.getElementById('mass-preview-tbody');
    const countLabel = document.getElementById('mass-selected-count');
    const importBtn = document.getElementById('btn-execute-mass-import');
    if (!tableBody) return;

    if (this.parsedMassHabits.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            Belum ada habit yang diurai. Unggah berkas CSV atau tempel teks habit di atas.
          </td>
        </tr>
      `;
      if (countLabel) countLabel.textContent = '0';
      if (importBtn) importBtn.disabled = true;
      return;
    }

    const selectedCount = this.parsedMassHabits.filter(h => h.selected).length;
    if (countLabel) countLabel.textContent = selectedCount;
    if (importBtn) importBtn.disabled = selectedCount === 0;

    tableBody.innerHTML = this.parsedMassHabits.map((h, idx) => `
      <tr>
        <td style="width: 32px; text-align: center;">
          <input type="checkbox" ${h.selected ? 'checked' : ''} onchange="GoalGettenApp.toggleMassHabitSelect(${idx})" style="accent-color: #8b5cf6;">
        </td>
        <td style="font-weight: 600; color: #ffffff;">${h.title}</td>
        <td><span class="tag-pill tag-category" style="font-size: 0.65rem;">${h.category}</span></td>
        <td>⏱️ ${h.duration}m</td>
        <td style="color: var(--text-secondary); font-size: 0.75rem;">${h.goalName}</td>
        <td style="color: var(--text-muted); font-size: 0.75rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${h.plan || '-'}</td>
      </tr>
    `).join('');
  }

  static toggleMassHabitSelect(idx) {
    if (this.parsedMassHabits[idx]) {
      this.parsedMassHabits[idx].selected = !this.parsedMassHabits[idx].selected;
      this.renderMassPreviewTable();
    }
  }

  static toggleSelectAllMassHabits() {
    const allSelected = this.parsedMassHabits.every(h => h.selected);
    this.parsedMassHabits.forEach(h => h.selected = !allSelected);
    this.renderMassPreviewTable();
  }

  static executeMassImport() {
    const toImport = this.parsedMassHabits.filter(h => h.selected);
    if (toImport.length === 0) return;

    const catColors = {
      'Spiritual': '#8b5cf6',
      'Physical / Health': '#10b981',
      'Intellectual / Career': '#f59e0b',
      'Keuangan': '#06b6d4',
      'Emotional / Personal': '#f43f5e',
      'Creativity / Custom': '#d946ef'
    };

    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();

    let addedCount = 0;
    toImport.forEach(item => {
      let matchedGoal = goals.find(g => g.title.toLowerCase() === item.goalName.toLowerCase());
      if (!matchedGoal && goals.length > 0) {
        matchedGoal = goals[0];
      }

      habits.push({
        id: 'h-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: item.title,
        category: item.category,
        duration: item.duration || 15,
        goalId: matchedGoal ? matchedGoal.id : 'g-1',
        goalTitle: matchedGoal ? matchedGoal.title : item.goalName,
        plan: item.plan || '',
        color: catColors[item.category] || '#8b5cf6',
        streak: 0,
        history: {}
      });
      addedCount++;
    });

    StorageManager.saveHabits(habits);
    this.closeModal('modal-mass-upload');
    this.renderAll();

    if (window.SoundEffects) {
      SoundEffects.playDing();
    }
    GoalGettenApp.showToast(`🎉 Berhasil mengimpor ${addedCount} habit baru secara massal!`, 'success');
  }

  static downloadCSVTemplate() {
    const templateContent = [
      'Nama Habit,Kategori,Durasi (Menit),Goal Utama,Rencana Implementasi (If-Then)',
      '"Sholat Berjamaah di Masjid","Spiritual",15,"Ketenangan Spiritual","JIKA adzan berkumandang, MAKA langsung wudhu"',
      '"Membaca Al-Qur\'an 1 Halaman","Spiritual",15,"Ketenangan Spiritual","JIKA selesai sholat Subuh, MAKA membaca 1 lembar"',
      '"Workout 20 Menit","Physical / Health",20,"Kebugaran Tubuh Prima","JIKA jam 06:00 pagi, MAKA pakai baju olahraga"',
      '"Minum Air Putih 2.5L","Physical / Health",5,"Kebugaran Tubuh Prima","JIKA bangun tidur & sebelum makan, MAKA minum 1 gelas"',
      '"Belajar Skill AI 45 Menit","Intellectual / Career",45,"Karier AI Engineer","JIKA jam 09:00 pagi, MAKA fokus coding 1 pomodoro"',
      '"Catat Keuangan Harian","Keuangan",5,"Karier AI Engineer","JIKA selesai transaksi, MAKA buka aplikasi pencatat uang"'
    ].join('\r\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_mass_upload_habits.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // =========================================================================
  // 11. Toast & Custom Confirm System
  // =========================================================================
  static showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  static showConfirm(message, onConfirm, onCancel) {
    const overlay = document.getElementById('custom-confirm-overlay');
    const msgEl = document.getElementById('custom-confirm-message');
    const btnYes = document.getElementById('custom-confirm-yes');
    const btnNo = document.getElementById('custom-confirm-no');
    if (!overlay || !msgEl) return;

    msgEl.textContent = message;
    overlay.classList.add('active');

    const cleanup = () => {
      overlay.classList.remove('active');
      btnYes.replaceWith(btnYes.cloneNode(true));
      btnNo.replaceWith(btnNo.cloneNode(true));
    };

    document.getElementById('custom-confirm-yes').addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });

    document.getElementById('custom-confirm-no').addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });
  }

  // =========================================================================
  // 12. Keyboard Shortcuts & Power-User Navigation ⌨️
  // =========================================================================
  static openKeyboardShortcutsModal() {
    const modal = document.getElementById('modal-keyboard-shortcuts');
    if (modal) modal.classList.add('active');
  }

  static bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is actively typing in input, textarea, or select
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      // ESC to close any modal or drawer
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        if (window.AICoachManager && AICoachManager.isOpen) AICoachManager.closeDrawer();
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        return;
      }

      if (isInput) return;

      // ? or Shift+/ -> Open Shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        this.openKeyboardShortcutsModal();
        return;
      }

      // N -> Add Habit
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openAddHabitModal();
        return;
      }

      // G -> Add Goal
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        this.openAddGoalModal();
        return;
      }

      // U -> Mass Upload
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        this.openMassUploadModal();
        return;
      }

      // C or A -> Toggle AI Coach
      if (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (window.AICoachManager) AICoachManager.toggleDrawer();
        return;
      }

      // T -> Start focus timer for first habit
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const habits = StorageManager.getHabits();
        const firstUnfinished = habits.find(h => !h.history || !h.history[this.todayIso]) || habits[0];
        if (firstUnfinished) {
          this.openFocusTimer(firstUnfinished.id);
        }
        return;
      }

      // M -> Toggle Theme Mode (Malam / Siang)
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleTheme();
        return;
      }

      // 1 to 7 -> Tabs
      const tabMap = {
        '1': 'fokus-hari-ini',
        '2': 'daftar-goal',
        '3': 'proyek-tugas',
        '4': 'matriks-habit',
        '5': 'progres-ringkas',
        '6': 'kalender-rutinitas',
        '7': 'analisis-cal'
      };
      if (tabMap[e.key]) {
        e.preventDefault();
        this.switchTab(tabMap[e.key]);
        return;
      }
    });
  }

  // =========================================================================
  // 13. Shareable Progress Summary 📋
  // =========================================================================
  static copyProgressSummaryToClipboard() {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();
    const xp = StorageManager.getXP();
    const levelInfo = window.GamificationManager ? GamificationManager.getLevelInfo() : { level: 1, title: 'Novice' };

    const completedToday = habits.filter(h => h.history && h.history[this.todayIso]).length;
    const totalHabits = habits.length;
    const rate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    const textSummary = [
      `🎯 *GoalGetten Progress Report* 🎯`,
      `📅 Tanggal: ${this.formatIndonesianDate(new Date())}`,
      `⭐ Level: LV ${levelInfo.level} (${levelInfo.title}) • ${xp} XP`,
      ``,
      `⚡ *Disiplin Hari Ini:* ${completedToday}/${totalHabits} Habit Selesai (${rate}%)`,
      `🔥 *Streak Tertinggi:* ${maxStreak} Hari Beruntun`,
      `🚀 *Goal Utama Aktif:* ${goals.length} Sasaran`,
      ``,
      `*Daftar Habit Hari Ini:*`,
      ...habits.map(h => {
        const isDone = Boolean(h.history && h.history[this.todayIso]);
        return `${isDone ? '✅' : '⬜'} ${h.title} (🔥 ${h.streak || 0}d)`;
      }),
      ``,
      `🍊 _Dibangun dengan konsistensi di GoalGetten • Dibuat oleh Harman tahun 2026_ 🚀`
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textSummary)
        .then(() => {
          this.showToast('📋 Ringkasan progres berhasil disalin ke clipboard!', 'success');
        })
        .catch(() => {
          this.fallbackCopyText(textSummary);
        });
    } else {
      this.fallbackCopyText(textSummary);
    }
  }

  static fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast('📋 Ringkasan progres berhasil disalin!', 'success');
    } catch (e) {
      this.showToast('Gagal menyalin otomatis. Silakan salin manual.', 'warning');
    }
    document.body.removeChild(ta);
  }

  // =========================================================================
  // 14. Drag & Drop Habit Reordering System (Desktop & Mobile Touch)
  // =========================================================================
  static draggedHabitId = null;

  static initHabitDragAndDrop(containerSelector) {
    const containers = typeof containerSelector === 'string' ? document.querySelectorAll(containerSelector) : [containerSelector];
    
    containers.forEach(container => {
      if (!container) return;
      const cards = container.querySelectorAll('.habit-card-v2[data-habit-id]');

      cards.forEach(card => {
        const habitId = card.getAttribute('data-habit-id');
        const handle = card.querySelector('.habit-drag-handle');

        // Only allow HTML5 Drag when dragged specifically or safely on card
        card.setAttribute('draggable', 'false');
        if (handle) {
          handle.setAttribute('draggable', 'true');

          handle.addEventListener('dragstart', (e) => {
            this.draggedHabitId = habitId;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', habitId);
          });

          handle.addEventListener('dragend', () => {
            this.draggedHabitId = null;
            card.classList.remove('dragging');
            document.querySelectorAll('.habit-card-v2').forEach(c => {
              c.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging');
            });
          });
        }

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (!this.draggedHabitId || this.draggedHabitId === habitId) return;
          e.dataTransfer.dropEffect = 'move';

          const rect = card.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            card.classList.add('drag-over-top');
            card.classList.remove('drag-over-bottom');
          } else {
            card.classList.add('drag-over-bottom');
            card.classList.remove('drag-over-top');
          }
        });

        card.addEventListener('dragleave', (e) => {
          if (!card.contains(e.relatedTarget)) {
            card.classList.remove('drag-over-top', 'drag-over-bottom');
          }
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over-top', 'drag-over-bottom');
          const sourceId = this.draggedHabitId || e.dataTransfer.getData('text/plain');
          const targetId = habitId;

          if (sourceId && targetId && sourceId !== targetId) {
            const rect = card.getBoundingClientRect();
            const isBelow = e.clientY >= (rect.top + rect.height / 2);
            GoalGettenApp.reorderHabits(sourceId, targetId, isBelow);
          }
        });

        // Mobile Touch Reorder Events on Drag Handle with Gesture Threshold
        if (handle) {
          let touchStartY = 0;
          let touchStartX = 0;
          let isTouchDragging = false;
          let touchHoldTimer = null;

          handle.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
            isTouchDragging = false;

            touchHoldTimer = setTimeout(() => {
              isTouchDragging = true;
              this.draggedHabitId = habitId;
              card.classList.add('dragging');
              if (navigator.vibrate) {
                try { navigator.vibrate(25); } catch (err) {}
              }
            }, 160);
          }, { passive: true });

          handle.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const deltaY = Math.abs(touch.clientY - touchStartY);
            const deltaX = Math.abs(touch.clientX - touchStartX);

            if (!isTouchDragging) {
              if (deltaX > 8 || deltaY > 8) {
                clearTimeout(touchHoldTimer);
              }
              return;
            }

            if (e.cancelable) e.preventDefault();

            const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetCard = elemBelow ? elemBelow.closest('.habit-card-v2[data-habit-id]') : null;

            document.querySelectorAll('.habit-card-v2').forEach(c => {
              c.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            if (targetCard && targetCard !== card) {
              const rect = targetCard.getBoundingClientRect();
              if (touch.clientY < rect.top + rect.height / 2) {
                targetCard.classList.add('drag-over-top');
              } else {
                targetCard.classList.add('drag-over-bottom');
              }
            }
          }, { passive: false });

          const handleTouchEnd = (e) => {
            clearTimeout(touchHoldTimer);
            if (!isTouchDragging || !this.draggedHabitId) {
              isTouchDragging = false;
              this.draggedHabitId = null;
              card.classList.remove('dragging');
              return;
            }

            const touch = e.changedTouches ? e.changedTouches[0] : null;
            if (touch) {
              const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
              const targetCard = elemBelow ? elemBelow.closest('.habit-card-v2[data-habit-id]') : null;

              if (targetCard) {
                const targetId = targetCard.getAttribute('data-habit-id');
                if (targetId && targetId !== this.draggedHabitId) {
                  const rect = targetCard.getBoundingClientRect();
                  const isBelow = touch.clientY >= (rect.top + rect.height / 2);
                  GoalGettenApp.reorderHabits(this.draggedHabitId, targetId, isBelow);
                }
              }
            }

            document.querySelectorAll('.habit-card-v2').forEach(c => {
              c.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging');
            });

            isTouchDragging = false;
            this.draggedHabitId = null;
          };

          handle.addEventListener('touchend', handleTouchEnd, { passive: true });
          handle.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        }
      });
    });
  }

  static reorderHabits(sourceId, targetId, isBelow = false) {
    const habits = StorageManager.getHabits();
    const fromIdx = habits.findIndex(h => h.id === sourceId);
    const toIdx = habits.findIndex(h => h.id === targetId);

    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const [moved] = habits.splice(fromIdx, 1);
    
    const targetIdxInNewArray = habits.findIndex(h => h.id === targetId);
    const insertIdx = isBelow ? targetIdxInNewArray + 1 : targetIdxInNewArray;

    habits.splice(insertIdx, 0, moved);
    StorageManager.saveHabits(habits);

    this.currentSortMode = 'custom';
    if (window.StorageManager) StorageManager.setSortMode('custom');
    const sortSelect = document.getElementById('habit-sort-select');
    if (sortSelect) sortSelect.value = 'custom';

    if (window.SoundEffects && SoundEffects.playPop) {
      SoundEffects.playPop();
    }
    if (window.GoalGettenApp && GoalGettenApp.showToast) {
      GoalGettenApp.showToast('✨ Urutan habit berhasil diperbarui (Kustom)!', 'info', 1800);
    }

    if (window.AuthManager && AuthManager.currentUser && AuthManager.syncLocalToCloud) {
      AuthManager.syncLocalToCloud().catch(() => {});
    }

    GoalGettenApp.renderAll();
  }

  // =========================================================================
  // 15. Theme Engine (Mode Malam 🌙 & Mode Siang ☀️)
  // =========================================================================
  static applyTheme(theme) {
    const activeTheme = theme || (window.StorageManager ? StorageManager.getTheme() : 'dark') || 'dark';
    document.documentElement.setAttribute('data-theme', activeTheme);
    if (window.StorageManager) StorageManager.setTheme(activeTheme);

    const icon = document.getElementById('theme-toggle-icon');
    const label = document.getElementById('theme-toggle-label');
    const btn = document.getElementById('btn-theme-toggle');

    if (icon) {
      icon.textContent = activeTheme === 'light' ? '☀️' : '🌙';
    }
    if (label) {
      label.textContent = activeTheme === 'light' ? 'Mode Siang' : 'Mode Malam';
    }
    if (btn) {
      btn.setAttribute('title', activeTheme === 'light' ? 'Beralih ke Mode Malam (Dark Mode 🌙)' : 'Beralih ke Mode Siang (Light Mode ☀️)');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', activeTheme === 'light' ? '#ffffff' : '#6366f1');
    }
  }

  static toggleTheme() {
    const current = (window.StorageManager ? StorageManager.getTheme() : 'dark') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    if (window.SoundEffects && SoundEffects.playPop) {
      SoundEffects.playPop();
    }
    this.showToast(`🌓 Beralih ke ${next === 'light' ? 'Mode Siang (Day Mode ☀️)' : 'Mode Malam (Night Mode 🌙)'}`, 'info', 2000);
  }
}

// Backward compat aliases
window.GoalGettengApp = GoalGettenApp;
window.GoalGettenApp = GoalGettenApp;

// Instant & Reliable DOM Ready Initializer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    GoalGettenApp.init();
  });
} else {
  GoalGettenApp.init();
}
