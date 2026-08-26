/**
 * Analytics, Heatmap & Progress Visualizer
 */

class AnalyticsManager {
  static init() {
    this.renderAll();
  }

  static renderAll() {
    this.renderHeatmap();
    this.renderWeeklyStats();
  }

  static renderHeatmap() {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;

    const habits = AppStorage.getHabits();
    const today = new Date();
    const cells = [];
    const totalDays = 60; // 60 days of activity

    // Aggregate completion count per date
    const dateCounts = {};
    habits.forEach(h => {
      if (h.history) {
        Object.keys(h.history).forEach(dateStr => {
          if (h.history[dateStr]) {
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          }
        });
      }
    });

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const count = dateCounts[iso] || 0;

      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else if (count >= 4) level = 4;

      cells.push(`
        <div class="heatmap-cell" data-level="${level}" title="${iso}: ${count} habit selesai"></div>
      `);
    }

    container.innerHTML = cells.join('');
  }

  static renderWeeklyStats() {
    const habits = AppStorage.getHabits();
    const container = document.getElementById('weekly-bars-container');
    if (!container) return;

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];

      let done = 0;
      habits.forEach(h => {
        if (h.history && h.history[iso]) done++;
      });

      const total = Math.max(habits.length, 1);
      const percent = Math.min(100, Math.round((done / total) * 100));

      weekData.push({ dayName, done, percent, isToday: i === 0 });
    }

    container.innerHTML = weekData.map(w => `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1;">
        <div style="height: 120px; width: 100%; max-width: 32px; background: var(--bg-input); border-radius: var(--radius-sm); display: flex; align-items: flex-end; overflow: hidden; padding: 2px;">
          <div style="width: 100%; height: ${w.percent}%; background: ${w.isToday ? 'var(--gradient-brand)' : 'var(--accent-primary)'}; border-radius: 4px; transition: height 0.6s ease;"></div>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: ${w.isToday ? 'var(--text-accent)' : 'var(--text-muted)'};">${w.dayName}</span>
      </div>
    `).join('');
  }
}
