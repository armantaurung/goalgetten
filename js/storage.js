/**
 * Storage & Data Model for GoalGetten
 */

const STORAGE_KEYS = {
  HABITS: 'goalgetteng_habits',
  GOALS: 'goalgetteng_goals',
  PIN: 'goalgetteng_pin',
  GEMINI_KEY: 'goalgetteng_gemini_key',
  AI_MODEL: 'goalgetteng_ai_model',
  AI_HISTORY: 'goalgetteng_ai_history',
  SUPABASE_URL: 'goalgetteng_supabase_url',
  SUPABASE_ANON_KEY: 'goalgetteng_supabase_anon_key',
  USER_SESSION: 'goalgetteng_user_session',
  LOCAL_ACCOUNTS: 'goalgetteng_local_accounts',
  XP: 'goalgetteng_xp',
  THEME: 'goalgetten_theme',
  SORT_MODE: 'goalgetten_sort_mode',
  PROJECTS: 'goalgetteng_projects'
};

const DEFAULT_PIN = 'ARMANT';
const DEFAULT_AI_MODEL = 'gemini-1.5-flash';
const DEFAULT_SUPABASE_URL = 'https://lzrcvtzigehjltbtgrdi.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cmN2dHppZ2Voamx0YnRncmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ5MTAsImV4cCI6MjEwMzMxMDkxMH0.OoRVz3p1kuDYtCzhOoUpod-4f_3hy2A-Mfn_UJ_YnQQ';

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Peluncuran Website Portofolio & Brand Digital',
    category: 'Intellectual / Career',
    priority: 'high',
    deadline: '2026-09-30',
    description: 'Membangun kehadiran digital profesional dengan portofolio web modern dan showcase proyek AI.',
    color: '#6366f1',
    createdAt: '2026-08-20',
    tasks: [
      { id: 't-101', title: 'Riset tren UI/UX dan pilih palet warna visual', dueDate: '2026-08-24', done: true },
      { id: 't-102', title: 'Susun daftar 3 studi kasus proyek terbaik', dueDate: '2026-08-27', done: true },
      { id: 't-103', title: 'Kembangkan halaman beranda dan navigasi interaktif', dueDate: '2026-09-05', done: true },
      { id: 't-104', title: 'Uji responsivitas di smartphone dan optimasi SEO', dueDate: '2026-09-18', done: false },
      { id: 't-105', title: 'Deploy ke domain kustom dan publikasikan di LinkedIn', dueDate: '2026-09-30', done: false }
    ]
  },
  {
    id: 'proj-2',
    title: 'Transformasi Gaya Hidup & Kebugaran 90 Hari',
    category: 'Physical / Health',
    priority: 'medium',
    deadline: '2026-10-31',
    description: 'Program peningkatan stamina, perbaikan pola makan seimbang, dan konsistensi latihan aerobik.',
    color: '#10b981',
    createdAt: '2026-08-15',
    tasks: [
      { id: 't-201', title: 'Pemeriksaan kesehatan dasar dan ukur komposisi tubuh awal', dueDate: '2026-08-20', done: true },
      { id: 't-202', title: 'Buat meal plan mingguan bebas gula tambahan', dueDate: '2026-08-31', done: true },
      { id: 't-203', title: 'Selesaikan 12 sesi latihan kekuatan dan lari bertahap', dueDate: '2026-09-30', done: false },
      { id: 't-204', title: 'Evaluasi progres lingkar pinggang dan stamina akhir bulan', dueDate: '2026-10-31', done: false }
    ]
  },
  {
    id: 'proj-3',
    title: 'Penataan Finansial & Dana Darurat 6 Bulan',
    category: 'Keuangan',
    priority: 'high',
    deadline: '2026-12-15',
    description: 'Membangun pos tabungan dana darurat likuid dan mengalokasikan investasi portofolio berkala.',
    color: '#06b6d4',
    createdAt: '2026-08-10',
    tasks: [
      { id: 't-301', title: 'Audit seluruh pengeluaran bulanan dan pangkas langganan tak terpakai', dueDate: '2026-08-25', done: true },
      { id: 't-302', title: 'Buka rekening tabungan terpisah untuk dana darurat', dueDate: '2026-09-10', done: true },
      { id: 't-303', title: 'Akumulasi dana darurat mencapai 50% dari target', dueDate: '2026-10-30', done: true },
      { id: 't-304', title: 'Capai target penuh dana darurat 6 bulan pengeluaran', dueDate: '2026-12-15', done: false }
    ]
  }
];

const DEFAULT_HABITS = [
  {
    id: 'h-1',
    title: 'Sholat Berjamaah di Masjid',
    category: 'Spiritual',
    time: '04:45',
    duration: 15,
    goalId: 'g-1',
    goalTitle: 'Ketenangan & Ketakwaan Spiritual',
    plan: 'JIKA adzan berkumandang, MAKA saya langsung berwudhu dan berangkat ke masjid.',
    color: '#8b5cf6',
    streak: 8,
    history: {
      '2026-08-19': true,
      '2026-08-20': true,
      '2026-08-21': true,
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': true
    }
  },
  {
    id: 'h-2',
    title: 'Membaca Al-Qur\'an 1 Halaman / Juz',
    category: 'Spiritual',
    time: '05:30',
    duration: 15,
    goalId: 'g-1',
    goalTitle: 'Ketenangan & Ketakwaan Spiritual',
    plan: 'JIKA selesai sholat Subuh, MAKA saya langsung membaca Al-Qur\'an sebelum membuka HP.',
    color: '#8b5cf6',
    streak: 6,
    history: {
      '2026-08-20': true,
      '2026-08-21': true,
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': false
    }
  },
  {
    id: 'h-3',
    title: 'Workout / Senam & Jalan Kaki Pagi',
    category: 'Physical / Health',
    time: '06:15',
    duration: 20,
    goalId: 'g-2',
    goalTitle: 'Kebugaran & Daya Tahan Tubuh Prima',
    plan: 'JIKA jam 06:00 pagi, MAKA saya ganti pakaian olahraga dan peregangan 20 menit.',
    color: '#10b981',
    streak: 5,
    history: {
      '2026-08-21': true,
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': true
    }
  },
  {
    id: 'h-4',
    title: 'Minum Air Putih 2.5 Liter / Hari',
    category: 'Physical / Health',
    time: '07:00',
    duration: 5,
    goalId: 'g-2',
    goalTitle: 'Kebugaran & Daya Tahan Tubuh Prima',
    plan: 'JIKA bangun tidur & sebelum makan, MAKA minum 1 gelas air putih.',
    color: '#10b981',
    streak: 12,
    history: {
      '2026-08-19': true,
      '2026-08-20': true,
      '2026-08-21': true,
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': true
    }
  },
  {
    id: 'h-5',
    title: 'Deep Work: Skill AI & Coding 45 Menit',
    category: 'Intellectual / Career',
    time: '09:00',
    duration: 45,
    goalId: 'g-3',
    goalTitle: 'Karier AI Engineer & Digital Creator',
    plan: 'JIKA jam 09:00 pagi, MAKA matikan notifikasi HP dan fokus ngoding 1 pomodoro.',
    color: '#f59e0b',
    streak: 4,
    history: {
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': false
    }
  },
  {
    id: 'h-6',
    title: 'Catat Arus Kas & Pengeluaran Harian',
    category: 'Keuangan',
    time: '20:30',
    duration: 5,
    goalId: 'g-3',
    goalTitle: 'Karier AI Engineer & Digital Creator',
    plan: 'JIKA selesai transaksi atau sebelum tidur, MAKA buka aplikasi pencatat keuangan.',
    color: '#06b6d4',
    streak: 7,
    history: {
      '2026-08-19': true,
      '2026-08-20': true,
      '2026-08-21': true,
      '2026-08-22': true,
      '2026-08-23': true,
      '2026-08-24': true,
      '2026-08-25': true
    }
  }
];

const DEFAULT_GOALS = [
  {
    id: 'g-1',
    title: 'Ketenangan & Ketakwaan Spiritual',
    category: 'Spiritual',
    description: 'Menjaga hubungan erat dengan Tuhan melalui sholat tepat waktu dan tilawah konsisten.',
    targetDate: '2026-12-31',
    color: '#8b5cf6',
    subgoals: [
      { id: 'sg-1', text: 'Khatam Al-Qur\'an 30 Juz Tahun Ini', targetDate: '2026-12-20', done: true },
      { id: 'sg-2', text: 'Rutinkan Sholat Tahajud 3x Seminggu', targetDate: '2026-10-15', done: false },
      { id: 'sg-3', text: 'Sedekah Subuh Harian Tanpa Putus', targetDate: '2026-09-30', done: true }
    ]
  },
  {
    id: 'g-2',
    title: 'Kebugaran & Daya Tahan Tubuh Prima',
    category: 'Physical / Health',
    description: 'Menurunkan kadar lemak tubuh dan meningkatkan stamina harian agar tidak mudah lelah.',
    targetDate: '2026-11-30',
    color: '#10b981',
    subgoals: [
      { id: 'sg-4', text: 'Tidur Berkualitas Minimal 7 Jam Tiap Malam', targetDate: '2026-09-15', done: true },
      { id: 'sg-5', text: 'Lari 5 Kilometer di bawah 30 menit', targetDate: '2026-10-30', done: false },
      { id: 'sg-6', text: 'Bebas Makanan Olahan & Gula Berlebih 30 Hari', targetDate: '2026-10-01', done: false }
    ]
  },
  {
    id: 'g-3',
    title: 'Karier AI Engineer & Digital Creator',
    category: 'Intellectual / Career',
    description: 'Membangun portofolio produk AI mutakhir dan meluncurkan proyek mandiri.',
    targetDate: '2026-12-31',
    color: '#f59e0b',
    subgoals: [
      { id: 'sg-7', text: 'Rilis Web App GoalGetteng Fullstack', targetDate: '2026-08-30', done: true },
      { id: 'sg-8', text: 'Tulis 10 Artikel Edukasi Teknologi AI', targetDate: '2026-10-15', done: false },
      { id: 'sg-9', text: 'Dapatkan 100 Pengguna Aktif Pertama', targetDate: '2026-11-15', done: false }
    ]
  }
];

class StorageManager {
  static getUserStorageKey(baseKey) {
    const session = this.getUserSession();
    if (session && session.user && session.user.id) {
      return `${baseKey}_${session.user.id}`;
    }
    return baseKey;
  }

  static getRegisteredAccounts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCAL_ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static registerLocalAccount(name, email, password) {
    const accounts = this.getRegisteredAccounts();
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Email ini sudah terdaftar. Silakan gunakan tab Masuk (Login).');
    }
    const user = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password,
      createdAt: new Date().toISOString()
    };
    accounts.push(user);
    localStorage.setItem(STORAGE_KEYS.LOCAL_ACCOUNTS, JSON.stringify(accounts));
    return user;
  }

  static loginLocalAccount(email, password) {
    const accounts = this.getRegisteredAccounts();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Akun dengan email ini belum terdaftar. Silakan klik tab Daftar Akun Baru.');
    }
    if (user.password !== password) {
      throw new Error('Kata sandi yang Anda masukkan salah.');
    }
    return user;
  }

  static getHabits() {
    const key = this.getUserStorageKey(STORAGE_KEYS.HABITS);
    const data = localStorage.getItem(key);
    if (!data) {
      this.saveHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveHabits(DEFAULT_HABITS);
        return DEFAULT_HABITS;
      }
      const timeDefaults = {
        'h-1': '04:45',
        'h-2': '05:30',
        'h-3': '06:15',
        'h-4': '07:00',
        'h-5': '09:00',
        'h-6': '20:30',
        'Spiritual': '05:00',
        'Physical / Health': '06:30',
        'Intellectual / Career': '09:00',
        'Keuangan': '20:00',
        'Emotional / Personal': '21:00',
        'Creativity / Custom': '16:00'
      };
      let modified = false;
      parsed.forEach((h, idx) => {
        if (!h.time) {
          h.time = timeDefaults[h.id] || timeDefaults[h.category] || '08:00';
          modified = true;
        }
      });
      if (modified) {
        this.saveHabits(parsed);
      }
      return parsed;
    } catch (e) {
      this.saveHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
  }

  static saveHabits(habits) {
    const key = this.getUserStorageKey(STORAGE_KEYS.HABITS);
    localStorage.setItem(key, JSON.stringify(habits || []));
  }

  static getGoals() {
    const key = this.getUserStorageKey(STORAGE_KEYS.GOALS);
    const data = localStorage.getItem(key);
    if (!data) {
      this.saveGoals(DEFAULT_GOALS);
      return DEFAULT_GOALS;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveGoals(DEFAULT_GOALS);
        return DEFAULT_GOALS;
      }
      return parsed;
    } catch (e) {
      this.saveGoals(DEFAULT_GOALS);
      return DEFAULT_GOALS;
    }
  }

  static saveGoals(goals) {
    const key = this.getUserStorageKey(STORAGE_KEYS.GOALS);
    localStorage.setItem(key, JSON.stringify(goals || []));
  }

  static getPIN() {
    return localStorage.getItem(STORAGE_KEYS.PIN) || DEFAULT_PIN;
  }

  static setPIN(pin) {
    localStorage.setItem(STORAGE_KEYS.PIN, pin);
  }

  static getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
  }

  static setApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, (key || '').trim());
  }

  static getAiModel() {
    return localStorage.getItem(STORAGE_KEYS.AI_MODEL) || DEFAULT_AI_MODEL;
  }

  static setAiModel(model) {
    localStorage.setItem(STORAGE_KEYS.AI_MODEL, model || DEFAULT_AI_MODEL);
  }

  static getAiHistory() {
    try {
      const hist = localStorage.getItem(STORAGE_KEYS.AI_HISTORY);
      return hist ? JSON.parse(hist) : null;
    } catch (e) {
      return null;
    }
  }

  static saveAiHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_HISTORY, JSON.stringify(history));
    } catch (e) {}
  }

  static clearAiHistory() {
    localStorage.removeItem(STORAGE_KEYS.AI_HISTORY);
  }

  static getSupabaseConfig() {
    return {
      url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL,
      key: localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY
    };
  }

  static setSupabaseConfig(url, key) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, (url || '').trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, (key || '').trim());
  }

  static getUserSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static setUserSession(session) {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }

  static getXP() {
    const key = this.getUserStorageKey(STORAGE_KEYS.XP);
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) || 0 : 0;
  }

  static saveXP(xp) {
    const key = this.getUserStorageKey(STORAGE_KEYS.XP);
    localStorage.setItem(key, String(Math.max(0, xp || 0)));
  }

  static addXP(amount) {
    const current = this.getXP();
    const next = current + (amount || 0);
    this.saveXP(next);
    return next;
  }

  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme || 'dark');
  }

  static getSortMode() {
    return localStorage.getItem(STORAGE_KEYS.SORT_MODE) || 'custom';
  }

  static setSortMode(mode) {
    localStorage.setItem(STORAGE_KEYS.SORT_MODE, mode || 'custom');
  }

  static getProjects() {
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.PROJECTS);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading projects storage:', e);
    }
    // Return sample projects on initial load
    return DEFAULT_PROJECTS;
  }

  static saveProjects(projects) {
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.PROJECTS);
      localStorage.setItem(key, JSON.stringify(projects || []));
    } catch (e) {
      console.error('Error saving projects storage:', e);
    }
  }

  static resetToDefault() {
    this.saveHabits(DEFAULT_HABITS);
    this.saveGoals(DEFAULT_GOALS);
    this.saveProjects(DEFAULT_PROJECTS);
    this.setPIN(DEFAULT_PIN);
    this.saveXP(0);
  }

  // Google Calendar .ICS Export (RFC 5545)
  static generateICS() {
    const habits = this.getHabits();
    const goals = this.getGoals();
    const now = new Date();
    const nowStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GoalGetten//Habit & Goal Mastery//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:GoalGetten Rutinitas & Goals',
      'X-WR-TIMEZONE:Asia/Jakarta'
    ];

    habits.forEach(h => {
      const todayFormatted = now.toISOString().slice(0, 10).replace(/-/g, '');
      const uid = `habit-${h.id}-${now.getTime()}@goalgetteng.app`;

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${nowStamp}`);
      ics.push(`DTSTART:${todayFormatted}T080000`);
      ics.push(`DTEND:${todayFormatted}T08${h.duration || 15}00`);
      ics.push('RRULE:FREQ=DAILY;INTERVAL=1');
      ics.push(`SUMMARY:🎯 [Habit] ${h.title}`);
      ics.push(`DESCRIPTION:Kategori: ${h.category}\\nDurasi: ${h.duration || 15} menit\\nGoal: ${h.goalTitle || '-'}\\n${h.plan || ''}`);
      ics.push('BEGIN:VALARM');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:Waktunya rutinitas: ${h.title}!`);
      ics.push('TRIGGER:-PT5M');
      ics.push('END:VALARM');
      ics.push('END:VEVENT');
    });

    goals.forEach(g => {
      if (g.targetDate) {
        const targetClean = g.targetDate.replace(/-/g, '');
        const uid = `goal-${g.id}-${now.getTime()}@goalgetteng.app`;

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${uid}`);
        ics.push(`DTSTAMP:${nowStamp}`);
        ics.push(`DTSTART;VALUE=DATE:${targetClean}`);
        ics.push(`DTEND;VALUE=DATE:${targetClean}`);
        ics.push(`SUMMARY:🚀 [Goal Target] ${g.title}`);
        const subList = (g.subgoals || []).map(s => (s.done ? '[x] ' : '[ ] ') + s.text).join('\\n');
        ics.push(`DESCRIPTION:Kategori: ${g.category}\\nTarget: ${g.targetDate}\\n\\nSub-Goals:\\n${subList}`);
        ics.push('BEGIN:VALARM');
        ics.push('ACTION:DISPLAY');
        ics.push(`DESCRIPTION:Target GoalGetten: ${g.title} mendekati batas waktu!`);
        ics.push('TRIGGER:-P1D');
        ics.push('END:VALARM');
        ics.push('END:VEVENT');
      }
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  static downloadICS() {
    const icsData = this.generateICS();
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `goalgetteng_calendar_${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportBackupJSON() {
    const data = {
      habits: this.getHabits(),
      goals: this.getGoals(),
      projects: this.getProjects(),
      pin: this.getPIN(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `goalgetteng_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.habits) this.saveHabits(data.habits);
      if (data.goals) this.saveGoals(data.goals);
      if (data.projects) this.saveProjects(data.projects);
      if (data.pin) this.setPIN(data.pin);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// Attach globally
window.StorageManager = StorageManager;
