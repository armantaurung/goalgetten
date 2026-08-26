/**
 * Goalgetten (Goals & Milestones) Module
 */

class GoalsManager {
  static init() {
    this.renderGoals();
  }

  static renderGoals() {
    const container = document.getElementById('goals-list');
    if (!container) return;

    const goals = AppStorage.getGoals();

    if (goals.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏆</div>
          <h4>Belum ada target / goal yang dibuat</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Rencanakan pencapaian besarmu dengan klik tombol <strong>+ Target Baru</strong>!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(goal => {
      const totalMilestones = goal.milestones ? goal.milestones.length : 0;
      const completedMilestones = goal.milestones ? goal.milestones.filter(m => m.done).length : 0;
      const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

      // Calculate days remaining
      let daysRemainingText = 'Tanpa batas waktu';
      if (goal.targetDate) {
        const target = new Date(goal.targetDate);
        const today = new Date();
        const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          daysRemainingText = `⚠️ Terlewat ${Math.abs(diffDays)} hari`;
        } else if (diffDays === 0) {
          daysRemainingText = `🔥 Deadline Hari Ini!`;
        } else {
          daysRemainingText = `⏳ ${diffDays} hari lagi`;
        }
      }

      return `
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-title-area">
              <h4>${goal.title}</h4>
              <span class="goal-category-pill">${goal.category || 'Umum'} • Prioritas ${goal.priority === 'high' ? '🔥 Tinggi' : '⚡ Normal'}</span>
            </div>
            <div class="habit-card-actions">
              <button class="action-btn-sm" title="Hapus Goal" onclick="GoalsManager.deleteGoal('${goal.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <div class="goal-progress-section">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
              <span>Progress Milestones</span>
              <span>${progressPercent}% (${completedMilestones}/${totalMilestones})</span>
            </div>
            <div class="goal-progress-bar-bg">
              <div class="goal-progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <div class="milestones-list">
            ${(goal.milestones || []).map(m => `
              <div class="milestone-item ${m.done ? 'done' : ''}" onclick="GoalsManager.toggleMilestone('${goal.id}', '${m.id}', event)">
                <input type="checkbox" ${m.done ? 'checked' : ''} style="pointer-events: none; accent-color: var(--accent-primary);">
                <span>${m.text}</span>
              </div>
            `).join('')}
          </div>

          <div class="goal-footer">
            <div class="deadline-tag">
              <span>${daysRemainingText}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Target: ${goal.targetDate || '-'}</span>
          </div>
        </div>
      `;
    }).join('');

    this.updateGoalMetrics();
  }

  static toggleMilestone(goalId, milestoneId, event) {
    const goals = AppStorage.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.milestones) return;

    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    milestone.done = !milestone.done;
    AppStorage.saveGoals(goals);
    this.renderGoals();

    if (milestone.done) {
      SoundEffects.playDing();
      GamificationManager.addXP(40, event ? event.currentTarget : null);
      App.showToast(`🎯 Milestone tercapai: "${milestone.text}" (+40 XP)`, 'success');

      // Check if all milestones completed
      if (goal.milestones.every(m => m.done)) {
        ConfettiEngine.launch(3000);
        GamificationManager.addXP(100);
        App.showToast(`🏆 Luar Biasa! Goal "${goal.title}" selesai 100%! (+100 XP)`, 'success');
      }
    }
  }

  static updateGoalMetrics() {
    const goals = AppStorage.getGoals();
    const activeGoals = goals.filter(g => g.milestones && !g.milestones.every(m => m.done)).length;
    const el = document.getElementById('metric-active-goals');
    if (el) el.textContent = `${activeGoals} Target`;
  }

  static openAddModal() {
    document.getElementById('goal-form').reset();
    document.getElementById('milestones-input-container').innerHTML = `
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
        <input type="text" class="form-control milestone-entry" placeholder="Contoh: Baca 5 bab pertama">
      </div>
    `;
    App.openModal('goal-modal');
  }

  static addMilestoneInput() {
    const container = document.getElementById('milestones-input-container');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.style.marginBottom = '0.5rem';
    div.innerHTML = `
      <input type="text" class="form-control milestone-entry" placeholder="Milestone / langkah berikutnya">
      <button type="button" class="action-btn-sm" style="color: var(--accent-danger);" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
  }

  static saveGoalFromForm(e) {
    e.preventDefault();
    const title = document.getElementById('goal-title-input').value.trim();
    const category = document.getElementById('goal-category-input').value;
    const targetDate = document.getElementById('goal-deadline-input').value;
    const priority = document.getElementById('goal-priority-input').value;

    if (!title) return;

    const milestoneInputs = document.querySelectorAll('.milestone-entry');
    const milestones = [];
    milestoneInputs.forEach((input, idx) => {
      const val = input.value.trim();
      if (val) {
        milestones.push({
          id: 'm-' + Date.now() + '-' + idx,
          text: val,
          done: false
        });
      }
    });

    const newGoal = {
      id: 'goal-' + Date.now(),
      title,
      category,
      targetDate,
      priority,
      milestones,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const goals = AppStorage.getGoals();
    goals.push(newGoal);
    AppStorage.saveGoals(goals);

    this.renderGoals();
    App.closeModal('goal-modal');
    GamificationManager.addXP(30);
    App.showToast('🎯 Target baru berhasil dibuat! (+30 XP)', 'success');
  }

  static deleteGoal(id) {
    if (!confirm('Hapus target ini?')) return;
    let goals = AppStorage.getGoals();
    goals = goals.filter(g => g.id !== id);
    AppStorage.saveGoals(goals);
    this.renderGoals();
    App.showToast('Target berhasil dihapus', 'info');
  }
}
