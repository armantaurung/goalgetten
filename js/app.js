/**
 * GoalGetteng 🎯 Master Controller
 * Full Implementation matching armantaurung.github.io/goalgetteng + Mass Upload
 */

class GoalGettengApp {
  static currentTab = 'fokus-hari-ini';
  static todayIso = new Date().toISOString().slice(0, 10);
  static parsedMassHabits = [];

  static INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  static INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  static INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  static INDO_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  static calendarViewMode = 'monthly'; // 'monthly' or 'timeline'
  static calendarYear = new Date().getFullYear();

  static formatIndonesianDate(isoOrDate) {
    const d = new Date(isoOrDate);
    return `${this.INDO_DAYS[d.getDay()]}, ${d.getDate()} ${this.INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  static formatIndonesianShort(isoOrDate) {
    const d = new Date(isoOrDate);
    return `${d.getDate()} ${this.INDO_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  static init() {
    try { this.bindNavigation(); } catch (e) { console.warn('Nav bind error:', e); }
    try { this.bindModals(); } catch (e) { console.warn('Modals bind error:', e); }
    try { this.bindMassUpload(); } catch (e) { console.warn('Mass upload bind error:', e); }
    try {
      if (window.AuthManager) AuthManager.init();
    } catch (e) { console.warn('Auth init error:', e); }
    try {
      if (window.AICoachManager) AICoachManager.init();
    } catch (e) { console.warn('AI Coach init error:', e); }
    try { this.renderAll(); } catch (e) { console.error('Render error:', e); }
  }

  static bindNavigation() {
    document.querySelectorAll('.nav-item a[data-tab]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
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
      } else {
        sec.style.display = 'none';
      }
    });

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    this.renderAll();
  }

  static renderAll() {
    this.renderTopSproutWidget();
    this.renderSummaryStats();
    this.renderFokusHariIni();
    this.renderDaftarGoals();
    this.renderMatriksHabit();
    this.renderProgresRingkas();
    this.renderKalenderRutinitas();
    this.renderAnalytics();
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

    if (percentage >= 100) {
      sproutIcon = '🌳';
      sproutTitle = 'Pohon Kebiasaanmu Tumbuh Subur & Berbuah Lebat! 🌳';
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

    // Calculate week number of year and quarter
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

    const list = document.getElementById('fokus-habits-list');
    const sideMilestones = document.getElementById('side-milestones-list');
    if (!list) return;

    const goals = StorageManager.getGoals();

    list.innerHTML = habits.map(h => {
      const isDone = Boolean(h.history && h.history[this.todayIso]);
      const catColor = h.color || '#8b5cf6';

      return `
        <div class="habit-card-v2 ${isDone ? 'completed' : ''}" style="--habit-color: ${catColor};">
          <div class="habit-row-top">
            <div class="habit-main-info">
              <div class="custom-checkbox" onclick="GoalGettengApp.toggleHabit('${h.id}', '${this.todayIso}')">
                ${isDone ? '✓' : ''}
              </div>
              <div class="habit-title-area">
                <h4>${h.title}</h4>
                <div class="habit-meta-tags">
                  <span class="tag-pill tag-duration">⏱️ ${h.duration || 15} Menit</span>
                  <span class="tag-pill tag-category" style="--cat-bg: ${catColor}20; --cat-color: ${catColor};">${h.category}</span>
                  <span class="tag-goal">🎯 ${h.goalTitle || 'Tujuan Utama'}</span>
                </div>
              </div>
            </div>

            <div class="habit-right-actions">
              <span class="streak-tag">🔥 ${h.streak || 0} d</span>
              <button class="icon-btn" title="Edit Habit" onclick="GoalGettengApp.openEditHabitModal('${h.id}')">✏️</button>
              <button class="icon-btn" title="Hapus Habit" onclick="GoalGettengApp.deleteHabit('${h.id}')">🗑️</button>
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

    if (sideMilestones) {
      let allSubgoals = [];
      goals.forEach(g => {
        (g.subgoals || []).forEach(sg => {
          allSubgoals.push({ ...sg, goalId: g.id, goalTitle: g.title, goalColor: g.color });
        });
      });

      sideMilestones.innerHTML = allSubgoals.slice(0, 6).map(sg => `
        <div class="subgoal-item ${sg.done ? 'done' : ''}">
          <input type="checkbox" ${sg.done ? 'checked' : ''} style="margin-top: 3px; accent-color: #8b5cf6;" onchange="GoalGettengApp.toggleSubgoal('${sg.goalId}', '${sg.id}')">
          <div class="subgoal-text">
            <div>${sg.text}</div>
            <div class="subgoal-date">🎯 ${sg.goalTitle} • Target: ${sg.targetDate || '-'}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // 4. Tab: Daftar Goal Utama (Goals & Sub-goals Cards)
  // =========================================================================
  static renderDaftarGoals() {
    const container = document.getElementById('goals-container-full');
    if (!container) return;

    const goals = StorageManager.getGoals();
    const habits = StorageManager.getHabits();

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
              <button class="icon-btn" onclick="GoalGettengApp.deleteGoal('${g.id}')">🗑️</button>
            </div>
          </div>

          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem;">${g.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${g.description || ''}</p>
          </div>

          <div class="plant-progress-bar">
            <div class="plant-progress-fill" style="width: ${progress}%; background: ${g.color || '#8b5cf6'};"></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
            <span>📅 Target: ${g.targetDate || '-'}</span>
            <span>📌 Sub-Goal: ${doneSg}/${totalSg}</span>
            <span>⚡ Habit: ${relatedHabitsCount}</span>
          </div>

          <div style="border-top: 1px solid var(--border-glass); padding-top: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">Tujuan-tujuan Kecil (Sub-Goals)</span>
              <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px;" onclick="GoalGettengApp.promptAddSubgoal('${g.id}')">+ Sub-Goal</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              ${subgoals.map(s => `
                <div class="subgoal-item ${s.done ? 'done' : ''}" style="padding: 0.4rem 0.6rem;">
                  <input type="checkbox" ${s.done ? 'checked' : ''} onchange="GoalGettengApp.toggleSubgoal('${g.id}', '${s.id}')" style="accent-color: ${g.color};">
                  <div class="subgoal-text" style="font-size: 0.8rem;">
                    <span>${s.text}</span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">Deadline: ${s.targetDate || '-'}</span>
                  </div>
                  <button class="icon-btn" style="width: 22px; height: 22px; font-size: 0.7rem;" onclick="GoalGettengApp.deleteSubgoal('${g.id}', '${s.id}')">✕</button>
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
              <div class="habit-card-v2" style="--habit-color: ${catColor}; margin-bottom: 0;">
                <div class="habit-row-top">
                  <div class="habit-main-info">
                    <div class="custom-checkbox" onclick="GoalGettengApp.toggleHabit('${h.id}', '${this.todayIso}')">
                      ${(h.history && h.history[this.todayIso]) ? '✓' : ''}
                    </div>
                    <div class="habit-title-area">
                      <h4>${h.title}</h4>
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
                        <div class="day-pill-btn ${done ? 'done' : ''}" style="--cat-color: ${catColor};" onclick="GoalGettengApp.toggleHabit('${h.id}', '${d.iso}')" title="${d.iso}">
                          <span>${d.dayName}</span>
                          <span>${d.dayNum}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div class="habit-right-actions">
                    <button class="icon-btn" onclick="GoalGettengApp.openEditHabitModal('${h.id}')">✏️</button>
                    <button class="icon-btn" onclick="GoalGettengApp.deleteHabit('${h.id}')">🗑️</button>
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
  }

  // =========================================================================
  // 6. Tab: Progres Ringkas Habit (Orange Tree 🍊 / Pohon Jeruk Visualizer)
  // =========================================================================
  static renderProgresRingkas() {
    const container = document.getElementById('progres-ringkas-container');
    if (!container) return;

    const habits = StorageManager.getHabits();

    let totalCompletedCheckins = 0;
    let totalMinutesPracticed = 0;

    habits.forEach(h => {
      if (h.history) {
        const count = Object.values(h.history).filter(Boolean).length;
        totalCompletedCheckins += count;
        totalMinutesPracticed += count * (h.duration || 15);
      }
    });

    const totalHours = (totalMinutesPracticed / 60).toFixed(1);

    const elTotalCheckin = document.getElementById('prog-stat-checkin');
    const elTotalHours = document.getElementById('prog-stat-hours');
    const elTotalHabits = document.getElementById('prog-stat-habits');

    if (elTotalCheckin) elTotalCheckin.textContent = `${totalCompletedCheckins} Selesai`;
    if (elTotalHours) elTotalHours.textContent = `${totalHours} Jam`;
    if (elTotalHabits) elTotalHabits.textContent = `${habits.length} Habit`;

    container.innerHTML = habits.map(h => {
      const historyCount = h.history ? Object.values(h.history).filter(Boolean).length : 0;
      const minutes = historyCount * (h.duration || 15);
      const fruitPercent = Math.min(100, Math.round((historyCount / 30) * 100));

      let treeEmoji = '🌱';
      if (fruitPercent >= 100) treeEmoji = '🍊';
      else if (fruitPercent >= 60) treeEmoji = '🌳';
      else if (fruitPercent >= 30) treeEmoji = '🌿';

      return `
        <div class="orange-tree-card">
          <div class="tree-left-info">
            <div class="tree-sprout-icon">${treeEmoji}</div>
            <div>
              <h4 style="font-size: 1rem; font-weight: 700;">${h.title}</h4>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                <span>⏱️ ${h.duration || 15} Menit</span> • <span>🎯 ${h.goalTitle || 'Tujuan'}</span>
              </div>
            </div>
          </div>

          <div class="tree-right-progress">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
              <span>Akumulasi: ${historyCount} Hari</span>
              <span style="color: #f97316;">🔥 ${h.streak || 0}d Streak</span>
            </div>
            <div class="plant-progress-bar">
              <div class="plant-progress-fill" style="width: ${fruitPercent}%; background: var(--gradient-orange);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              <span>${minutes} Menit Berlatih</span>
              <span style="color: #f97316; font-weight: 700;">${fruitPercent}% Pohon Berbuah 🍊</span>
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

      // Current month stats
      const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const completedThisMonth = Object.keys(history).filter(k => k.startsWith(currentMonthPrefix) && history[k]).length;

      let calendarBodyHTML = '';

      if (this.calendarViewMode === 'monthly') {
        // Render 12 Monthly Calendar Cards (Januari - Desember)
        const monthCards = [];

        for (let m = 0; m < 12; m++) {
          const monthName = this.INDO_MONTHS[m];
          const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
          const firstDayIndex = new Date(currentYear, m, 1).getDay(); // 0 = Sun, 1 = Mon, ...
          const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
          const monthDoneCount = Object.keys(history).filter(k => k.startsWith(monthPrefix) && history[k]).length;
          const isThisActiveMonth = isCurrentRunningYear && m === runningMonthIndex;

          const dayCells = [];
          // Empty padding days before the 1st
          for (let p = 0; p < firstDayIndex; p++) {
            dayCells.push(`<div class="month-day-cell empty"></div>`);
          }

          // Actual days in month
          for (let day = 1; day <= daysInMonth; day++) {
            const iso = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isChecked = Boolean(history[iso]);
            const isToday = iso === this.todayIso;

            dayCells.push(`
              <div class="month-day-cell ${isChecked ? 'checked' : ''} ${isToday ? 'today-cell' : ''}"
                   style="${isChecked ? `--day-active-color: ${catColor};` : ''}"
                   title="${this.INDO_DAYS[new Date(currentYear, m, day).getDay()]}, ${day} ${monthName} ${currentYear}: ${isChecked ? 'Selesai ✓' : 'Belum Dikerjakan'}"
                   onmouseenter="GoalGettengApp.setLiveInspectorInfo('${iso}', '${h.title.replace(/'/g, "\\'")}', ${isChecked})"
                   onclick="event.stopPropagation(); GoalGettengApp.toggleHabit('${h.id}', '${iso}')">
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
        // Render 53-Week Timeline Heatmap View with Month Labels & Day Labels
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        const startDayOfWeek = startDate.getDay(); // 0 = Sun

        const cells = [];
        // Empty padding before Jan 1st
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
                 onmouseenter="GoalGettengApp.setLiveInspectorInfo('${iso}', '${h.title.replace(/'/g, "\\'")}', ${isChecked})"
                 onclick="event.stopPropagation(); GoalGettengApp.toggleHabit('${h.id}', '${iso}')">
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
          <div class="calendar-accordion-header" onclick="GoalGettengApp.toggleAccordion('${h.id}')">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <button class="custom-checkbox" onclick="event.stopPropagation(); GoalGettengApp.toggleHabit('${h.id}', '${this.todayIso}')">
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
  // 8. Tab: Analisis & Google Cal
  // =========================================================================
  static renderAnalytics() {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();

    const elHabits = document.getElementById('an-total-habits');
    const elGoals = document.getElementById('an-total-goals');
    if (elHabits) elHabits.textContent = habits.length;
    if (elGoals) elGoals.textContent = goals.length;
  }

  // ===============================================  static toggleHabit(habitId, dateIso) {
    const habits = StorageManager.getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.history) habit.history = {};
    habit.history[dateIso] = !habit.history[dateIso];

    this.recalcStreak(habit);

    StorageManager.saveHabits(habits);
    if (window.AuthManager) {
      AuthManager.pushHabitToggle(habitId, dateIso, habit.history[dateIso]);
    }
    this.renderAll();

    if (habit.history[dateIso] && window.SoundEffects) {
      SoundEffects.playPop();
    }
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
    this.renderAll();
  }

  static promptAddSubgoal(goalId) {
    const text = prompt('Masukkan nama sub-goal / milestone baru:');
    if (!text || !text.trim()) return;

    const targetDate = prompt('Target tanggal penyelesaian (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));

    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    if (!goal.subgoals) goal.subgoals = [];
    goal.subgoals.push({
      id: 'sg-' + Date.now(),
      text: text.trim(),
      targetDate: targetDate || '',
      done: false
    });

    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalSave(goal);
    }
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
  }

  static openAddHabitModal() {
    document.getElementById('modal-habit-id').value = '';
    document.getElementById('modal-habit-title').value = '';
    document.getElementById('modal-habit-category').value = 'Spiritual';
    document.getElementById('modal-habit-duration').value = '15';
    document.getElementById('modal-habit-plan').value = '';
    this.populateGoalSelect();
    document.getElementById('modal-habit').classList.add('active');
  }

  static openEditHabitModal(id) {
    const habit = StorageManager.getHabits().find(h => h.id === id);
    if (!habit) return;

    document.getElementById('modal-habit-id').value = habit.id;
    document.getElementById('modal-habit-title').value = habit.title;
    document.getElementById('modal-habit-category').value = habit.category;
    document.getElementById('modal-habit-duration').value = habit.duration || 15;
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
    const duration = parseInt(document.getElementById('modal-habit-duration').value) || 15;
    const goalId = document.getElementById('modal-habit-goal').value;
    const plan = document.getElementById('modal-habit-plan').value.trim();

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
        h.duration = duration;
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
        duration,
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
    this.renderAll();
  }

  static deleteHabit(id) {
    if (!confirm('Hapus habit ini?')) return;
    let habits = StorageManager.getHabits();
    habits = habits.filter(h => h.id !== id);
    StorageManager.saveHabits(habits);
    if (window.AuthManager) {
      AuthManager.pushHabitDelete(id);
    }
    this.renderAll();
  }

  static openAddGoalModal() {
    document.getElementById('modal-goal-form').reset();
    document.getElementById('modal-goal').classList.add('active');
  }

  static saveGoalFromForm() {
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
    const newGoal = {
      id: 'g-' + Date.now(),
      title,
      category,
      description,
      targetDate,
      color: catColors[category] || '#8b5cf6',
      subgoals: []
    };
    goals.push(newGoal);

    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalSave(newGoal);
    }
    this.closeModal('modal-goal');
    this.renderAll();
  }

  static deleteGoal(id) {
    if (!confirm('Hapus goal ini beserta sub-goalnya?')) return;
    let goals = StorageManager.getGoals();
    goals = goals.filter(g => g.id !== id);
    StorageManager.saveGoals(goals);
    if (window.AuthManager) {
      AuthManager.pushGoalDelete(id);
    }
    this.renderAll();
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
        alert('Data berhasil dipulihkan!');
        GoalGettengApp.renderAll();
      } else {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  }

  static resetDefault() {
    if (confirm('Kembalikan semua data ke sampel bawaan GoalGetteng?')) {
      StorageManager.resetToDefault();
      this.renderAll();
    }
  }

  // =========================================================================
  // 9. MASS UPLOAD HABIT MODULE 🚀
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

    // Check if line 0 is a header
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('nama') || firstLineLower.includes('habit') || firstLineLower.includes('title')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma, semicolon, tab or pipe
      let cols = [];
      if (line.includes(';')) {
        cols = line.split(';');
      } else if (line.includes('|')) {
        cols = line.split('|');
      } else if (line.includes('\t')) {
        cols = line.split('\t');
      } else {
        // basic comma splitter (ignoring nested commas in quotes)
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
          <input type="checkbox" ${h.selected ? 'checked' : ''} onchange="GoalGettengApp.toggleMassHabitSelect(${idx})" style="accent-color: #8b5cf6;">
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
      // Find matching goal or fallback
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
    alert(`🎉 Berhasil mengimpor ${addedCount} habit baru secara massal!`);
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
}

// Attach globally
window.GoalGettengApp = GoalGettengApp;

// Instant & Reliable DOM Ready Initializer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    GoalGettengApp.init();
  });
} else {
  GoalGettengApp.init();
}
