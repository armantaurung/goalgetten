/**
 * GoalGetten 🎯 AI Coach & Smart Generator Engine
 * Dual Engine: Google Gemini API (Online) + Smart Heuristic Engine (Offline)
 */

class AICoachManager {
  static isOpen = false;
  static isGenerating = false;
  static conversation = [];

  static init() {
    this.loadHistory();
    this.bindEvents();
    this.updateEngineBadge();
  }

  static bindEvents() {
    // Floating Action Button
    const fab = document.getElementById('btn-ai-fab');
    if (fab) {
      fab.addEventListener('click', () => this.toggleDrawer());
    }

    // Drawer Close Button & Backdrop
    const closeBtn = document.getElementById('ai-drawer-close');
    const backdrop = document.getElementById('ai-drawer-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());
    if (backdrop) backdrop.addEventListener('click', () => this.closeDrawer());

    // Send Message Form
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');
    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          this.sendMessage(text);
          chatInput.value = '';
        }
      });
    }

    // Settings Modal
    const btnSettings = document.getElementById('btn-ai-settings-toggle');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => this.openSettingsModal());
    }

    const settingsForm = document.getElementById('ai-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyInput = document.getElementById('ai-gemini-key-input');
        const modelSelect = document.getElementById('ai-gemini-model-select');
        if (keyInput) StorageManager.setApiKey(keyInput.value);
        if (modelSelect) StorageManager.setAiModel(modelSelect.value);
        this.closeSettingsModal();
        this.updateEngineBadge();
        this.addSystemMessage('🔑 Pengaturan AI berhasil disimpan! Engine siap digunakan.');
        if (window.GoalGettenApp) {
          GoalGettenApp.showToast('🔑 Pengaturan AI Gemini berhasil disimpan!', 'success');
        }
      });
    }
  }

  // =========================================================================
  // Drawer UI Controllers
  // =========================================================================
  static toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  static openDrawer() {
    this.isOpen = true;
    const drawer = document.getElementById('ai-coach-drawer');
    const backdrop = document.getElementById('ai-drawer-backdrop');
    const fab = document.getElementById('btn-ai-fab');

    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (fab) fab.classList.add('hidden');

    this.renderMessages();

    if (this.conversation.length === 0) {
      this.sendInitialWelcome();
    }

    setTimeout(() => {
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
    }, 300);
  }

  static closeDrawer() {
    this.isOpen = false;
    const drawer = document.getElementById('ai-coach-drawer');
    const backdrop = document.getElementById('ai-drawer-backdrop');
    const fab = document.getElementById('btn-ai-fab');

    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (fab) fab.classList.remove('hidden');
  }

  static openSettingsModal() {
    const modal = document.getElementById('modal-ai-settings');
    const keyInput = document.getElementById('ai-gemini-key-input');
    const modelSelect = document.getElementById('ai-gemini-model-select');

    if (keyInput) keyInput.value = StorageManager.getApiKey();
    if (modelSelect) modelSelect.value = StorageManager.getAiModel();
    if (modal) modal.classList.add('active');
  }

  static closeSettingsModal() {
    const modal = document.getElementById('modal-ai-settings');
    if (modal) modal.classList.remove('active');
  }

  static updateEngineBadge() {
    const badge = document.getElementById('ai-engine-status-badge');
    const key = StorageManager.getApiKey();
    if (badge) {
      if (key) {
        badge.innerHTML = `<span>⚡ Gemini AI (${StorageManager.getAiModel()})</span>`;
        badge.className = 'ai-badge online';
      } else {
        badge.innerHTML = `<span>🧠 Smart Local Engine (Offline)</span>`;
        badge.className = 'ai-badge offline';
      }
    }
  }

  // =========================================================================
  // History & Message Rendering
  // =========================================================================
  static loadHistory() {
    const hist = StorageManager.getAiHistory();
    if (hist && Array.isArray(hist)) {
      this.conversation = hist;
    } else {
      this.conversation = [];
    }
  }

  static saveHistory() {
    if (this.conversation.length > 30) {
      this.conversation = this.conversation.slice(-30);
    }
    StorageManager.saveAiHistory(this.conversation);
  }

  static resetConversation() {
    GoalGettenApp.showConfirm('Bersihkan riwayat percakapan dengan AI Coach?', () => {
      this.conversation = [];
      StorageManager.clearAiHistory();
      this.sendInitialWelcome();
      this.renderMessages();
      GoalGettenApp.showToast('🔄 Riwayat percakapan AI telah dibersihkan', 'info');
    });
  }

  static sendInitialWelcome() {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();
    const todayIso = new Date().toISOString().slice(0, 10);
    const completedToday = habits.filter(h => h.history && h.history[todayIso]).length;

    let text = `Halo! Saya **AI Coach GoalGetten** 🎯 asisten pribadi Anda untuk produktivitas, pembentukan kebiasaan, dan pencapaian target.\n\n` +
      `Saat ini Anda memiliki **${goals.length} Goal Utama** dan **${habits.length} Habit** terdaftar ` +
      `(${completedToday}/${habits.length} selesai hari ini).\n\n` +
      `Ada yang bisa saya bantu untuk meningkatkan fokus Anda hari ini?`;

    this.conversation.push({
      role: 'assistant',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveHistory();
    this.renderMessages();
  }

  static addSystemMessage(text) {
    this.conversation.push({
      role: 'system',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveHistory();
    this.renderMessages();
  }

  static renderMessages() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    if (this.conversation.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.conversation.map(msg => {
      if (msg.role === 'system') {
        return `
          <div class="ai-msg-system">
            <span>${msg.text}</span>
          </div>
        `;
      }

      const isUser = msg.role === 'user';
      const formattedBody = this.formatMessageText(msg.text);

      return `
        <div class="ai-msg-row ${isUser ? 'user' : 'assistant'}">
          <div class="ai-avatar">${isUser ? '👤' : '🎯'}</div>
          <div class="ai-bubble">
            <div class="ai-bubble-content">${formattedBody}</div>
            <div class="ai-bubble-time">${msg.time || ''}</div>
          </div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  static formatMessageText(rawText) {
    if (!rawText) return '';

    let text = rawText.replace(/\[ADD_HABIT:\s*([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|?([^\]]*)\]/gi, (match, title, category, duration, plan, goal) => {
      const cleanTitle = (title || '').trim();
      const cleanCat = (category || 'Spiritual').trim();
      const cleanDur = parseInt(duration) || 15;
      const cleanPlan = (plan || '').trim();
      const cleanGoal = (goal || '').trim();

      const encTitle = cleanTitle.replace(/'/g, "\\'");
      const encCat = cleanCat.replace(/'/g, "\\'");
      const encPlan = cleanPlan.replace(/'/g, "\\'");
      const encGoal = cleanGoal.replace(/'/g, "\\'");

      return `
        <div class="ai-suggest-habit-card">
          <div class="ai-suggest-badge">⚡ Rekomendasi Habit Baru</div>
          <div class="ai-suggest-title">${cleanTitle}</div>
          <div class="ai-suggest-meta">
            <span>🏷️ ${cleanCat}</span>
            <span>⏱️ ${cleanDur} Menit</span>
            ${cleanGoal ? `<span>🎯 ${cleanGoal}</span>` : ''}
          </div>
          ${cleanPlan ? `<div class="ai-suggest-plan"><strong>Rencana:</strong> ${cleanPlan}</div>` : ''}
          <button type="button" class="btn btn-emerald btn-sm" onclick="AICoachManager.addHabitFromAI('${encTitle}', '${encCat}', ${cleanDur}, '${encPlan}', '${encGoal}')">
            <span>+ Tambahkan ke Habit Saya</span>
          </button>
        </div>
      `;
    });

    text = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    return text;
  }

  // =========================================================================
  // Sending Messages & AI Query Pipeline
  // =========================================================================
  static async sendMessage(userText) {
    if (this.isGenerating || !userText.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.conversation.push({
      role: 'user',
      text: userText.trim(),
      time: time
    });
    this.saveHistory();
    this.renderMessages();

    this.isGenerating = true;
    this.showTypingIndicator();

    try {
      const apiKey = StorageManager.getApiKey();
      let replyText = '';

      if (apiKey) {
        replyText = await this.callGeminiAPI(userText);
      } else {
        await this.simulateTypingDelay(600);
        replyText = this.generateLocalHeuristicReply(userText);
      }

      this.hideTypingIndicator();

      this.conversation.push({
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveHistory();
      this.renderMessages();

      if (window.SoundEffects) {
        SoundEffects.playPop();
      }
    } catch (err) {
      console.error('AI Coach Error:', err);
      this.hideTypingIndicator();

      const fallbackReply = this.generateLocalHeuristicReply(userText);
      this.conversation.push({
        role: 'assistant',
        text: `⚠️ *Koneksi Gemini API mengalami kendala, beralih ke Smart Local Engine:*\n\n${fallbackReply}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveHistory();
      this.renderMessages();
    } finally {
      this.isGenerating = false;
    }
  }

  static showTypingIndicator() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    let indicator = document.getElementById('ai-typing-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'ai-typing-indicator';
      indicator.className = 'ai-msg-row assistant typing';
      indicator.innerHTML = `
        <div class="ai-avatar">🎯</div>
        <div class="ai-bubble">
          <div class="ai-typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      container.appendChild(indicator);
      container.scrollTop = container.scrollHeight;
    }
  }

  static hideTypingIndicator() {
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  static simulateTypingDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =========================================================================
  // Gemini API Integration
  // =========================================================================
  static async callGeminiAPI(prompt) {
    const apiKey = StorageManager.getApiKey();
    const model = StorageManager.getAiModel() || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemContext = this.buildUserSystemContext();

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemContext + "\n\nUser Question: " + prompt }]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Respon kosong dari model Gemini');
    }

    return candidateText;
  }

  static buildUserSystemContext() {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();
    const todayIso = new Date().toISOString().slice(0, 10);
    const completedToday = habits.filter(h => h.history && h.history[todayIso]).length;

    const habitsSummary = habits.map(h => `- ${h.title} (${h.category}, ${h.duration}m, Streak: ${h.streak}d, Done Today: ${Boolean(h.history && h.history[todayIso])})`).join('\n');
    const goalsSummary = goals.map(g => `- ${g.title} (${g.category}, Target: ${g.targetDate}, Subgoals: ${(g.subgoals || []).filter(s => s.done).length}/${(g.subgoals || []).length})`).join('\n');

    return `
You are the elite "AI Habit & Goal Coach" for the GoalGetten app.
Your mission: Help the user build atomic habits, overcome procrastination, achieve goals, and stay disciplined.
Language: Indonesian (Warm, motivating, practical, structured, high-energy).

CURRENT USER CONTEXT:
- Date: ${todayIso}
- Goals Registered:
${goalsSummary || 'None'}
- Habits Registered:
${habitsSummary || 'None'}
- Today's Progress: ${completedToday} of ${habits.length} habits completed.

SPECIAL CAPABILITY:
When you recommend a concrete new habit for the user, format it exactly like this anywhere in your response so the UI creates an interactive 1-click add button:
[ADD_HABIT: Judul Habit | Kategori | DurasiMenit | Rencana If-Then | Goal Utama Terkait]
Example categories: Spiritual, Physical / Health, Intellectual / Career, Keuangan, Emotional / Personal, Creativity / Custom.
`.trim();
  }

  // =========================================================================
  // Smart Local Heuristic Engine (100% Offline Capability)
  // =========================================================================
  static generateLocalHeuristicReply(prompt) {
    const lower = prompt.toLowerCase();
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();
    const todayIso = new Date().toISOString().slice(0, 10);
    const completedToday = habits.filter(h => h.history && h.history[todayIso]).length;
    const rate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
    const topStreakHabit = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];

    // Scenario 1: Evaluasi / Laporan / Progress
    if (lower.includes('evaluasi') || lower.includes('laporan') || lower.includes('progress') || lower.includes('konsistensi') || lower.includes('minggu ini')) {
      let advice = `📊 **Evaluasi Performa & Konsistensi Habit Anda:**\n\n`;
      advice += `• **Status Hari Ini:** ${completedToday} dari ${habits.length} habit (${rate}%) telah diselesaikan.\n`;
      if (topStreakHabit) {
        advice += `• **Juara Konsistensi:** 🔥 *${topStreakHabit.title}* dengan streak beruntun **${topStreakHabit.streak} hari**!\n`;
      }
      advice += `• **Goal Berjalan:** ${goals.length} sasaran utama aktif.\n\n`;

      if (rate >= 80) {
        advice += `🌟 **Catatan Coach:** Momentum Anda sangat luar biasa! Jangan menambah terlalu banyak beban baru, pertahankan ritme ini.\n`;
      } else if (rate >= 40) {
        advice += `💡 **Catatan Coach:** Anda sudah melangkah di jalur yang benar. Selesaikan 1 atau 2 habit kecil (di bawah 15 menit) sekarang untuk menutup hari dengan kemenangan penuh!\n`;
      } else {
        advice += `⚡ **Catatan Coach:** Hari ini masih bisa dimenangkan! Pilih 1 habit paling mudah dengan aturan *2-Minute Rule* sekarang.\n`;
      }
      return advice;
    }

    // Scenario 2: Malas / Prokrastinasi / Tidak Semangat
    if (lower.includes('malas') || lower.includes('prokrastinasi') || lower.includes('tunda') || lower.includes('lelah') || lower.includes('capek') || lower.includes('cape')) {
      return `⚡ **Strategi Anti-Prokrastinasi (Atomic Action):**\n\n` +
        `Rasa malas adalah sinyal bahwa target terasa terlalu besar di otak. Terapkan strategi **"2-Minute Rule"**:\n\n` +
        `1. **Kecilkan Skala:** Jangan pikirkan lari 5 km, cukup pasang sepatu olahraga.\n` +
        `2. **Aturan 5 Detik:** Hitung mundur *5-4-3-2-1* lalu langsung berdiri tanpa negosiasi pikiran.\n` +
        `3. **Pilih 1 Habit Termudah:** Kerjakan habit paling ringan di daftar Anda sekarang.\n\n` +
        `*Ingat:* Motivasi datang **SETELAH** Anda mulai bergerak, bukan sebelumnya! 🚀`;
    }

    // Scenario 3: Saran Habit Baru / Rekomendasi
    if (lower.includes('saran') || lower.includes('rekomendasi') || lower.includes('habit baru') || lower.includes('tambah habit') || lower.includes('kebiasaan baru')) {
      const gTitle = goals[0] ? goals[0].title : 'Karier & Produktivitas';
      return `💡 **Berikut 2 Rekomendasi Habit Berdampak Tinggi (*Keystone Habits*):**\n\n` +
        `1. **Deep Work Pomodoro (Fokus Tinggi):**\n` +
        `Meningkatkan output kerja hingga 3x lipat tanpa distraksi ponsel.\n` +
        `[ADD_HABIT: Deep Work Sesi Pagi 25 Menit | Intellectual / Career | 25 | JIKA jam 08:30 pagi, MAKA matikan notifikasi HP dan pasang timer fokus 25 menit | ${gTitle}]\n\n` +
        `2. **Refleksi & Jurnal Syukur Malam:**\n` +
        `Menurunkan stres harian dan menyiapkan tidur yang nyenyak.\n` +
        `[ADD_HABIT: Jurnal Refleksi & Evaluasi Malam | Emotional / Personal | 10 | JIKA sebelum naik ke tempat tidur, MAKA tulis 3 hal yang disyukuri hari ini | Ketenangan Batin]\n\n` +
        `*Klik tombol hijau di atas untuk langsung menambahkannya ke daftar habit Anda!* ✨`;
    }

    // Scenario 4: Pecah Goal / Breakdown
    if (lower.includes('pecah') || lower.includes('goal') || lower.includes('target') || lower.includes('breakdown') || lower.includes('milestone')) {
      return `🎯 **Panduan Memecah Goal Besar Menjadi Kebiasaan Harian:**\n\n` +
        `Setiap goal besar selalu merupakan kumpulan dari tindakan kecil yang diulang setiap hari:\n\n` +
        `• **Target Outcome:** Misalnya *Kuasai Skill AI / Bisnis Baru*.\n` +
        `• **Milestone Sub-Goal:** 1) Selesai modul dasar, 2) Buat 1 proyek nyata, 3) Publikasikan portofolio.\n` +
        `• **Habit Harian:** Belajar 30 menit per hari.\n\n` +
        `[ADD_HABIT: Belajar & Praktik Skill Kunci 30 Menit | Intellectual / Career | 30 | JIKA jam 07:00 pagi, MAKA buka materi pembelajaran selama 30 menit | Kuasai Skill AI & Produktivitas]\n\n` +
        `Coba tanyakan tujuan spesifik Anda, saya akan buatkan pemecahannya secara mendetail!`;
    }

    // Scenario 5: Kebugaran / Kesehatan
    if (lower.includes('olahraga') || lower.includes('sehat') || lower.includes('berat badan') || lower.includes('diet') || lower.includes('fit') || lower.includes('tidur')) {
      return `🏃 **Rekomendasi Kebiasaan Kebugaran & Vitalitas:**\n\n` +
        `Tubuh yang bugar adalah fondasi dari seluruh produktivitas harian Anda.\n\n` +
        `[ADD_HABIT: Jalan Cepat / Kardio Ringan 20 Menit | Physical / Health | 20 | JIKA jam 06:00 pagi, MAKA langsung kenakan sepatu dan jalan pagi 20 menit | Kebugaran & Daya Tahan Tubuh Prima]\n\n` +
        `[ADD_HABIT: Minum 1 Gelas Air Putih Saat Bangun Tidur | Physical / Health | 5 | JIKA kaki menyentuh lantai saat bangun, MAKA segera teguk 1 gelas air putih hangat | Kebugaran & Daya Tahan Tubuh Prima]`;
    }

    // Default General Coach response
    return `🎯 **Saran dari AI Coach:**\n\n` +
      `Kunci dari pencapaian besar adalah **konsistensi mikro** (1% lebih baik setiap hari).\n\n` +
      `• Hari ini progres Anda: **${completedToday}/${habits.length} habit** (${rate}%).\n` +
      `• Fokuskan energi pada habit yang memiliki kaitan langsung dengan Goal Utama Anda.\n\n` +
      `*Pilih salah satu tombol cepat di bawah atau tanyakan hal spesifik tentang kebiasaan & goal Anda!* ✨`;
  }

  // =========================================================================
  // 1-Click Action from AI Chat
  // =========================================================================
  static addHabitFromAI(title, category, duration, plan, goalTitle) {
    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();

    let matchedGoal = goals.find(g => (g.title || '').toLowerCase() === (goalTitle || '').toLowerCase());
    if (!matchedGoal && goals.length > 0) {
      matchedGoal = goals[0];
    }

    const catColors = {
      'Spiritual': '#8b5cf6',
      'Physical / Health': '#10b981',
      'Intellectual / Career': '#f59e0b',
      'Keuangan': '#06b6d4',
      'Emotional / Personal': '#f43f5e',
      'Creativity / Custom': '#d946ef'
    };

    const newHabit = {
      id: 'h-' + Date.now(),
      title: title,
      category: category || 'Spiritual',
      duration: parseInt(duration) || 15,
      goalId: matchedGoal ? matchedGoal.id : 'g-1',
      goalTitle: matchedGoal ? matchedGoal.title : (goalTitle || 'Tujuan Utama'),
      plan: plan || '',
      color: catColors[category] || '#8b5cf6',
      streak: 0,
      history: {}
    };

    habits.push(newHabit);
    StorageManager.saveHabits(habits);

    GoalGettenApp.renderAll();

    if (window.SoundEffects) {
      SoundEffects.playLevelUp();
    }
    if (window.ConfettiEngine) {
      ConfettiEngine.launch(2000);
    }

    this.addSystemMessage(`✅ Habit **"${title}"** berhasil ditambahkan ke daftar Anda!`);
    GoalGettenApp.showToast(`✅ Habit "${title}" berhasil ditambahkan!`, 'success');
  }

  // =========================================================================
  // Quick Prompt Action Handler
  // =========================================================================
  static sendQuickPrompt(type) {
    switch (type) {
      case 'breakdown':
        this.sendMessage('Pecah salah satu Goal Utama saya menjadi sub-goals dan kebiasaan harian yang terukur.');
        break;
      case 'eval':
        this.sendMessage('Evaluasi konsistensi dan performa habit saya minggu ini.');
        break;
      case 'suggest':
        this.sendMessage('Beri saya 2 rekomendasi habit baru yang paling berdampak besar untuk produktivitas.');
        break;
      case 'lazy':
        this.sendMessage('Saya sedang merasa malas dan ingin menunda hari ini. Bagaimana cara mengatasinya?');
        break;
    }
  }

  // =========================================================================
  // Form Smart Generators (Modal Goal, Habit, Mass Upload)
  // =========================================================================
  static async smartBreakdownGoalForm() {
    const titleInput = document.getElementById('modal-goal-title');
    const catSelect = document.getElementById('modal-goal-category');
    const descArea = document.getElementById('modal-goal-desc');
    const targetInput = document.getElementById('modal-goal-target');
    const btn = document.getElementById('btn-ai-goal-breakdown');

    if (!titleInput || !titleInput.value.trim()) {
      GoalGettenApp.showToast('Ketik Judul Goal terlebih dahulu agar AI dapat menganalisis!', 'warning');
      if (titleInput) titleInput.focus();
      return;
    }

    const title = titleInput.value.trim();
    const category = catSelect ? catSelect.value : 'Intellectual / Career';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ AI sedang merancang target...</span>`;
    }

    try {
      await this.simulateTypingDelay(500);

      let generatedDesc = '';
      let targetMonths = 3;

      if (category === 'Spiritual') {
        generatedDesc = `Memperkuat disiplin spiritual dan ketenangan batin secara konsisten melalui ibadah harian dan pemahaman nilai luhur.`;
      } else if (category === 'Physical / Health') {
        generatedDesc = `Meningkatkan stamina, daya tahan tubuh prima, dan mencapai komposisi fisik ideal dengan nutrisi serta olahraga teratur.`;
      } else if (category === 'Intellectual / Career') {
        generatedDesc = `Menguasai keahlian kunci ${title}, membangun portofolio kredibel, dan meningkatkan kapabilitas profesional secara signifikan.`;
      } else if (category === 'Keuangan') {
        generatedDesc = `Membangun kestabilan finansial, mengontrol arus kas, dan mengalokasikan tabungan serta investasi secara disiplin.`;
      } else {
        generatedDesc = `Mencapai target ${title} secara terencana dengan langkah-langkah terstruktur dan evaluasi mingguan.`;
      }

      if (descArea && !descArea.value.trim()) {
        descArea.value = generatedDesc;
      }

      if (targetInput && !targetInput.value) {
        const d = new Date();
        d.setMonth(d.getMonth() + targetMonths);
        targetInput.value = d.toISOString().slice(0, 10);
      }

      if (window.SoundEffects) SoundEffects.playDing();
      GoalGettenApp.showToast(`✨ AI berhasil melengkapi deskripsi dan target waktu untuk "${title}"!`, 'success');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨ AI Breakdown Goal</span>`;
      }
    }
  }

  static async smartGenerateIfThenPlan() {
    const titleInput = document.getElementById('modal-habit-title');
    const planInput = document.getElementById('modal-habit-plan');
    const catSelect = document.getElementById('modal-habit-category');
    const durInput = document.getElementById('modal-habit-duration');
    const btn = document.getElementById('btn-ai-habit-plan');

    if (!titleInput || !titleInput.value.trim()) {
      GoalGettenApp.showToast('Ketik Nama Kebiasaan / Habit terlebih dahulu!', 'warning');
      if (titleInput) titleInput.focus();
      return;
    }

    const title = titleInput.value.trim();
    const cat = catSelect ? catSelect.value : 'Spiritual';
    const dur = durInput ? parseInt(durInput.value) || 15 : 15;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Merancang If-Then Plan...</span>`;
    }

    try {
      await this.simulateTypingDelay(400);

      let generatedPlan = '';
      const lower = title.toLowerCase();

      if (lower.includes('sholat') || lower.includes('doa') || lower.includes('quran') || cat === 'Spiritual') {
        generatedPlan = `JIKA adzan berkumandang atau selesai sholat fardhu, MAKA saya langsung melakukan ${title} selama ${dur} menit tanpa menunda.`;
      } else if (lower.includes('workout') || lower.includes('senam') || lower.includes('lari') || lower.includes('olahraga') || cat === 'Physical / Health') {
        generatedPlan = `JIKA jam 06:00 pagi atau selesai ganti pakaian olahraga, MAKA saya langsung memulai ${title} selama ${dur} menit.`;
      } else if (lower.includes('baca') || lower.includes('buku') || lower.includes('read')) {
        generatedPlan = `JIKA selesai makan malam atau sebelum tidur, MAKA saya matikan notifikasi HP dan membaca selama ${dur} menit.`;
      } else if (lower.includes('code') || lower.includes('coding') || lower.includes('ai') || lower.includes('belajar') || cat === 'Intellectual / Career') {
        generatedPlan = `JIKA jam 09:00 pagi atau duduk di meja kerja, MAKA saya pasang timer pomodoro ${dur} menit untuk fokus pada ${title}.`;
      } else if (lower.includes('uang') || lower.includes('kas') || cat === 'Keuangan') {
        generatedPlan = `JIKA selesai melakukan transaksi pembayaran, MAKA saya langsung mencatat pengeluaran di aplikasi.`;
      } else {
        generatedPlan = `JIKA waktu rutinitas harian tiba, MAKA saya segera menjalankan ${title} selama ${dur} menit dengan penuh fokus.`;
      }

      if (planInput) {
        planInput.value = generatedPlan;
      }

      if (window.SoundEffects) SoundEffects.playPop();
      GoalGettenApp.showToast(`✨ Rencana If-Then dibuat!`, 'success');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨ AI Buat Rencana (If-Then)</span>`;
      }
    }
  }

  static async smartGenerateMassUpload() {
    const promptInput = document.getElementById('ai-mass-prompt-input');
    const btn = document.getElementById('btn-ai-mass-generate');

    if (!promptInput || !promptInput.value.trim()) {
      GoalGettenApp.showToast('Ketikkan tujuan atau bidang kebiasaan yang ingin Anda bangun!', 'warning');
      if (promptInput) promptInput.focus();
      return;
    }

    const promptText = promptInput.value.trim();
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ AI sedang merancang daftar habit...</span>`;
    }

    try {
      await this.simulateTypingDelay(600);

      const generated = [];
      const lower = promptText.toLowerCase();
      const goals = StorageManager.getGoals();
      const mainGoal = goals[0] ? goals[0].title : 'Goal Utama';

      if (lower.includes('sehat') || lower.includes('turun') || lower.includes('fit') || lower.includes('berat badan') || lower.includes('olahraga')) {
        generated.push(
          { title: 'Minum 500ml Air Putih Pagi', category: 'Physical / Health', duration: 5, goalName: mainGoal, plan: 'JIKA bangun tidur, MAKA segera minum air putih', selected: true },
          { title: 'Workout / Senam HIIT 20 Menit', category: 'Physical / Health', duration: 20, goalName: mainGoal, plan: 'JIKA jam 06:30 pagi, MAKA pakai baju olahraga dan senam', selected: true },
          { title: 'Jalan Santai 5.000 Langkah', category: 'Physical / Health', duration: 30, goalName: mainGoal, plan: 'JIKA sore hari jam 16:30, MAKA jalan santai di sekitar rumah', selected: true },
          { title: 'Tidur Berkualitas Sebelum Jam 23:00', category: 'Physical / Health', duration: 15, goalName: mainGoal, plan: 'JIKA jam 22:30, MAKA matikan lampu dan jauhkan ponsel', selected: true }
        );
      } else if (lower.includes('coding') || lower.includes('karir') || lower.includes('ai') || lower.includes('kerja') || lower.includes('belajar')) {
        generated.push(
          { title: 'Deep Work Ngoding 45 Menit', category: 'Intellectual / Career', duration: 45, goalName: mainGoal, plan: 'JIKA jam 09:00 pagi, MAKA buka IDE dan matikan notifikasi', selected: true },
          { title: 'Baca Dokumentasi & Paper AI 20 Menit', category: 'Intellectual / Career', duration: 20, goalName: mainGoal, plan: 'JIKA jam 13:30, MAKA pelajari 1 teknik baru', selected: true },
          { title: 'Review & Rapikan Kode / Commit Git', category: 'Intellectual / Career', duration: 15, goalName: mainGoal, plan: 'JIKA sebelum mengakhiri kerja, MAKA push ke GitHub', selected: true },
          { title: 'Tulis Catatan / Lesson Learned Harian', category: 'Intellectual / Career', duration: 10, goalName: mainGoal, plan: 'JIKA jam 17:00, MAKA rangkum 1 insight penting', selected: true }
        );
      } else {
        generated.push(
          { title: 'Fokus Prioritas Utama 30 Menit', category: 'Intellectual / Career', duration: 30, goalName: mainGoal, plan: 'JIKA jam 08:30, MAKA kerjakan hal terpenting pertama', selected: true },
          { title: 'Peregangan Tubuh & Olahraga 15 Menit', category: 'Physical / Health', duration: 15, goalName: mainGoal, plan: 'JIKA jam 06:00, MAKA lakukan peregangan tubuh', selected: true },
          { title: 'Tilawah / Doa Refleksi Spiritual', category: 'Spiritual', duration: 15, goalName: mainGoal, plan: 'JIKA selesai sholat subuh, MAKA luangkan 15 menit', selected: true },
          { title: 'Evaluasi Arus Kas Harian', category: 'Keuangan', duration: 5, goalName: mainGoal, plan: 'JIKA sebelum tidur, MAKA catat pengeluaran hari ini', selected: true }
        );
      }

      GoalGettenApp.parsedMassHabits = generated;
      GoalGettenApp.renderMassPreviewTable();

      if (window.SoundEffects) SoundEffects.playDing();
      GoalGettenApp.showToast(`🎉 AI menghasilkan ${generated.length} habit baru! Tinjau dan klik Import.`, 'success', 4000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨ Generate Habit via AI</span>`;
      }
    }
  }

  // =========================================================================
  // AI Daily Insight Banner Generator for "Fokus Hari Ini"
  // =========================================================================
  static renderDailyInsightBanner() {
    const container = document.getElementById('ai-daily-insight-container');
    if (!container) return;

    const habits = StorageManager.getHabits();
    const goals = StorageManager.getGoals();
    const todayIso = new Date().toISOString().slice(0, 10);
    const completedToday = habits.filter(h => h.history && h.history[todayIso]).length;
    const totalHabits = habits.length;
    const rate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const topStreak = Math.max(...habits.map(h => h.streak || 0), 0);

    let title = '';
    let advice = '';
    let icon = '💡';

    if (rate === 100 && totalHabits > 0) {
      icon = '🏆';
      title = 'Luar Biasa! Semua Habit Hari Ini Selesai 100%';
      advice = 'Disiplin sempurna hari ini! Otak Anda semakin kuat membangun jalur saraf kebiasaan baru. Waktunya istirahat berkualitas.';
    } else if (rate >= 50) {
      icon = '🔥';
      title = `Momentum Bagus! ${completedToday}/${totalHabits} Habit Telah Disiram (${rate}%)`;
      advice = `Pertahankan ritme! Selesaikan sisa ${totalHabits - completedToday} habit sebelum malam tiba agar streak tidak terputus.`;
    } else {
      icon = '✨';
      title = 'Awali Hari dengan 1 Langkah Mikro (Atomic Habit)';
      advice = topStreak > 0
        ? `Streak terbaik Anda saat ini ${topStreak} hari beruntun! Pilih 1 kebiasaan termudah di bawah untuk menyalakan api fokus hari ini.`
        : 'Setiap pencapaian besar dimulai dari satu centang kecil. Pilih 1 habit dan mulai sekarang!';
    }

    container.innerHTML = `
      <div class="ai-insight-card">
        <div class="ai-insight-icon">${icon}</div>
        <div class="ai-insight-content">
          <div class="ai-insight-header">
            <span class="ai-pill">✨ AI Daily Insight</span>
            <h4>${title}</h4>
          </div>
          <p>${advice}</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="AICoachManager.openDrawer()" style="white-space: nowrap; align-self: center;">
          <span>💬 Konsultasi AI</span>
        </button>
      </div>
    `;
  }
}

// Attach globally
window.AICoachManager = AICoachManager;
