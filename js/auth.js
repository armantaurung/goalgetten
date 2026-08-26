/**
 * GoalGetteng 🎯 Authentication & Cloud Sync Engine
 * Supabase Backend-as-a-Service (PostgreSQL + Real-time Auth)
 */

class AuthManager {
  static client = null;
  static currentUser = null;
  static currentProfile = null;
  static isSyncing = false;

  static init() {
    this.initSupabaseClient();
    this.bindAuthEvents();
    this.checkSession();
  }

  static initSupabaseClient() {
    const config = StorageManager.getSupabaseConfig();
    if (config.url && config.key && window.supabase) {
      try {
        this.client = window.supabase.createClient(config.url, config.key);
      } catch (err) {
        console.warn('Gagal menginisialisasi Supabase Client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  static bindAuthEvents() {
    // Auth Form (Login / Register)
    const authForm = document.getElementById('modal-auth-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAuthFormSubmit();
      });
    }

    // Cloud Config Form
    const cloudForm = document.getElementById('modal-cloud-form');
    if (cloudForm) {
      cloudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCloudConfigSubmit();
      });
    }
  }

  static async checkSession() {
    this.initSupabaseClient();

    if (this.client) {
      try {
        const { data: { session }, error } = await this.client.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          StorageManager.setUserSession(session);
          await this.fetchProfile();
          await this.pullCloudData(false);
        } else {
          this.currentUser = null;
          StorageManager.setUserSession(null);
        }

        // Listen for auth state changes
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            this.currentUser = session.user;
            StorageManager.setUserSession(session);
            await this.fetchProfile();
            await this.pullCloudData(true);
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.currentProfile = null;
            StorageManager.setUserSession(null);
            this.updateUIStatus();
            GoalGettengApp.renderAll();
          }
        });
      } catch (e) {
        console.warn('Pengecekan sesi cloud dilewati:', e);
      }
    } else {
      // Fallback check cached session
      const cached = StorageManager.getUserSession();
      if (cached && cached.user) {
        this.currentUser = cached.user;
        this.currentProfile = {
          display_name: cached.user.user_metadata?.full_name || cached.user.email?.split('@')[0] || 'User',
          email: cached.user.email,
          level: 1,
          xp: 0
        };
      } else {
        this.currentUser = null;
        this.currentProfile = null;
      }
    }

    this.updateUIStatus();
  }

  static async fetchProfile() {
    if (!this.client || !this.currentUser) return;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (data && !error) {
        this.currentProfile = data;
      } else {
        // Fallback default profile
        this.currentProfile = {
          display_name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
          email: this.currentUser.email,
          level: 1,
          xp: 0
        };
      }
    } catch (err) {
      console.warn('Gagal mengambil profil cloud:', err);
    }
  }

  // =========================================================================
  // Auth Actions (Login, Register, Logout)
  // =========================================================================
  static async handleAuthFormSubmit() {
    const mode = document.getElementById('auth-active-mode')?.value || 'login';
    const email = document.getElementById('auth-email-input')?.value.trim();
    const password = document.getElementById('auth-password-input')?.value;
    const name = document.getElementById('auth-name-input')?.value.trim();
    const btn = document.getElementById('btn-auth-submit');

    if (!email || !password) {
      alert('Silakan masukkan email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      alert('Kata sandi minimal 6 karakter.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Memproses...</span>`;
    }

    try {
      if (mode === 'register') {
        if (this.client) {
          // Register to Supabase Cloud
          const { data, error } = await this.client.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                full_name: name || email.split('@')[0]
              }
            }
          });

          if (error) throw error;

          this.currentUser = data.user;
          if (data.session) {
            StorageManager.setUserSession(data.session);
            await this.fetchProfile();
          } else {
            const localSession = {
              user: {
                id: data.user.id,
                email: data.user.email,
                user_metadata: { full_name: name || email.split('@')[0] }
              }
            };
            StorageManager.setUserSession(localSession);
            this.currentProfile = {
              display_name: name || email.split('@')[0],
              email: email,
              level: 1,
              xp: 0
            };
          }
          this.closeAuthModal();
          alert(`🎉 Pendaftaran Berhasil! Selamat datang di GoalGetteng, ${name || email}! Akun Cloud Anda telah aktif.`);
          await this.offerLocalDataMigration();
        } else {
          // Instant Local Multi-User Registration
          const localUser = StorageManager.registerLocalAccount(name, email, password);
          const session = {
            user: {
              id: localUser.id,
              email: localUser.email,
              user_metadata: { full_name: localUser.name }
            },
            isLocal: true
          };
          StorageManager.setUserSession(session);
          this.currentUser = session.user;
          this.currentProfile = {
            display_name: localUser.name,
            email: localUser.email,
            level: 1,
            xp: 0
          };
          this.closeAuthModal();
          alert(`🎉 Pendaftaran Berhasil! Selamat datang, ${localUser.name}! Akun Anda telah dibuat dan aktif.`);
        }
      } else {
        // Login mode
        if (this.client) {
          // Try Supabase Login
          const { data, error } = await this.client.auth.signInWithPassword({
            email: email,
            password: password
          });

          if (error) throw error;

          this.currentUser = data.user;
          StorageManager.setUserSession(data.session);
          await this.fetchProfile();
          this.closeAuthModal();
          alert(`👋 Selamat datang kembali, ${this.currentProfile?.display_name || email}!`);
          await this.pullCloudData(true);
        } else {
          // Local Multi-User Login
          const localUser = StorageManager.loginLocalAccount(email, password);
          const session = {
            user: {
              id: localUser.id,
              email: localUser.email,
              user_metadata: { full_name: localUser.name }
            },
            isLocal: true
          };
          StorageManager.setUserSession(session);
          this.currentUser = session.user;
          this.currentProfile = {
            display_name: localUser.name,
            email: localUser.email,
            level: 1,
            xp: 0
          };
          this.closeAuthModal();
          alert(`👋 Selamat datang kembali, ${localUser.name}!`);
        }
      }

      GoalGettengApp.renderAll();
    } catch (err) {
      console.error('Auth Error:', err);
      alert(`⚠️ ${err.message || 'Terjadi kesalahan saat memproses akun'}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>${mode === 'register' ? 'Daftar Akun Baru' : 'Masuk Sekarang'}</span>`;
      }
      this.updateUIStatus();
    }
  }

  static async signInWithGoogle() {
    if (!this.client) {
      this.closeAuthModal();
      this.openCloudConfigModal();
      alert('ℹ️ Silakan masukkan konfigurasi Supabase Anda terlebih dahulu.');
      return;
    }

    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (error) throw error;
    } catch (err) {
      alert(`⚠️ Login Google gagal: ${err.message}`);
    }
  }

  static async signOut() {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun ini?')) return;

    if (this.client) {
      await this.client.auth.signOut().catch(() => {});
    }

    this.currentUser = null;
    this.currentProfile = null;
    StorageManager.setUserSession(null);
    this.updateUIStatus();
    GoalGettengApp.renderAll();

    alert('👋 Anda telah keluar dari akun cloud (kembali ke Mode Tamu Lokal).');
  }

  // =========================================================================
  // Cloud Sync & Data Migration (Push / Pull)
  // =========================================================================
  static async offerLocalDataMigration() {
    const localHabits = StorageManager.getHabits();
    const localGoals = StorageManager.getGoals();

    if (localHabits.length > 0 || localGoals.length > 0) {
      if (confirm('Apakah Anda ingin mengunggah data Habit & Goal lokal Anda ke akun cloud baru ini agar tersinkron di semua perangkat?')) {
        await this.syncLocalToCloud();
      }
    }
  }

  static async syncLocalToCloud() {
    if (!this.client || !this.currentUser) return;

    this.showSyncToast('☁️ Mengunggah data ke cloud...');

    try {
      const userId = this.currentUser.id;
      const habits = StorageManager.getHabits();
      const goals = StorageManager.getGoals();

      // 1. Sync Goals
      for (const g of goals) {
        await this.client.from('goals').upsert({
          id: g.id,
          user_id: userId,
          title: g.title,
          category: g.category || 'Spiritual',
          description: g.description || '',
          target_date: g.targetDate || null,
          color: g.color || '#8b5cf6',
          subgoals: g.subgoals || []
        });
      }

      // 2. Sync Habits & Logs
      for (const h of habits) {
        await this.client.from('habits').upsert({
          id: h.id,
          user_id: userId,
          goal_id: h.goalId || null,
          goal_title: h.goalTitle || '',
          title: h.title,
          category: h.category || 'Spiritual',
          duration: h.duration || 15,
          plan: h.plan || '',
          color: h.color || '#8b5cf6',
          streak: h.streak || 0
        });

        // Sync history logs
        if (h.history) {
          for (const [dateIso, done] of Object.entries(h.history)) {
            if (done) {
              await this.client.from('habit_logs').upsert({
                user_id: userId,
                habit_id: h.id,
                date: dateIso,
                completed: true
              }, { onConflict: 'user_id,habit_id,date' });
            }
          }
        }
      }

      this.showSyncToast('✅ Data berhasil tersinkronisasi ke Cloud!');
      if (window.SoundEffects) SoundEffects.playDing();
    } catch (err) {
      console.error('Sync error:', err);
      this.showSyncToast('⚠️ Gagal menyinkronkan data ke cloud');
    }
  }

  static async pullCloudData(showAlert = false) {
    if (!this.client || !this.currentUser) return;

    this.showSyncToast('☁️ Mengambil data dari cloud...');

    try {
      const userId = this.currentUser.id;

      // 1. Fetch Goals
      const { data: cloudGoals, error: gErr } = await this.client
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      // 2. Fetch Habits
      const { data: cloudHabits, error: hErr } = await this.client
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      // 3. Fetch Habit Logs
      const { data: cloudLogs, error: lErr } = await this.client
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId);

      if (!gErr && cloudGoals && cloudGoals.length > 0) {
        const formattedGoals = cloudGoals.map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          description: g.description,
          targetDate: g.target_date,
          color: g.color,
          subgoals: g.subgoals || []
        }));
        StorageManager.saveGoals(formattedGoals);
      }

      if (!hErr && cloudHabits && cloudHabits.length > 0) {
        // Build history map from logs
        const logsMap = {};
        if (cloudLogs) {
          cloudLogs.forEach(l => {
            if (!logsMap[l.habit_id]) logsMap[l.habit_id] = {};
            logsMap[l.habit_id][l.date] = Boolean(l.completed);
          });
        }

        const formattedHabits = cloudHabits.map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          duration: h.duration,
          goalId: h.goal_id,
          goalTitle: h.goal_title,
          plan: h.plan,
          color: h.color,
          streak: h.streak || 0,
          history: logsMap[h.id] || {}
        }));

        StorageManager.saveHabits(formattedHabits);
      }

      this.showSyncToast('✅ Data Cloud Siap & Tersinkron!');
      GoalGettengApp.renderAll();
    } catch (err) {
      console.warn('Gagal memuat data cloud:', err);
      this.showSyncToast('⚠️ Mode offline aktif (menggunakan data lokal)');
    }
  }

  // Real-time Push on Single Actions
  static async pushHabitToggle(habitId, dateIso, isDone) {
    if (!this.client || !this.currentUser) return;
    const userId = this.currentUser.id;

    try {
      if (isDone) {
        await this.client.from('habit_logs').upsert({
          user_id: userId,
          habit_id: habitId,
          date: dateIso,
          completed: true
        }, { onConflict: 'user_id,habit_id,date' });
      } else {
        await this.client.from('habit_logs')
          .delete()
          .match({ user_id: userId, habit_id: habitId, date: dateIso });
      }
    } catch (e) {
      console.warn('Background sync habit log error:', e);
    }
  }

  static async pushHabitSave(habit) {
    if (!this.client || !this.currentUser) return;
    try {
      await this.client.from('habits').upsert({
        id: habit.id,
        user_id: this.currentUser.id,
        goal_id: habit.goalId || null,
        goal_title: habit.goalTitle || '',
        title: habit.title,
        category: habit.category || 'Spiritual',
        duration: habit.duration || 15,
        plan: habit.plan || '',
        color: habit.color || '#8b5cf6',
        streak: habit.streak || 0
      });
    } catch (e) {
      console.warn('Background sync habit error:', e);
    }
  }

  static async pushHabitDelete(habitId) {
    if (!this.client || !this.currentUser) return;
    try {
      await this.client.from('habits').delete().match({ id: habitId, user_id: this.currentUser.id });
      await this.client.from('habit_logs').delete().match({ habit_id: habitId, user_id: this.currentUser.id });
    } catch (e) {
      console.warn('Background delete habit error:', e);
    }
  }

  static async pushGoalSave(goal) {
    if (!this.client || !this.currentUser) return;
    try {
      await this.client.from('goals').upsert({
        id: goal.id,
        user_id: this.currentUser.id,
        title: goal.title,
        category: goal.category || 'Spiritual',
        description: goal.description || '',
        target_date: goal.targetDate || null,
        color: goal.color || '#8b5cf6',
        subgoals: goal.subgoals || []
      });
    } catch (e) {
      console.warn('Background sync goal error:', e);
    }
  }

  static async pushGoalDelete(goalId) {
    if (!this.client || !this.currentUser) return;
    try {
      await this.client.from('goals').delete().match({ id: goalId, user_id: this.currentUser.id });
    } catch (e) {
      console.warn('Background delete goal error:', e);
    }
  }

  // =========================================================================
  // UI Helpers & Status Display
  // =========================================================================
  static updateUIStatus() {
    const navUserPill = document.getElementById('top-user-auth-pill');
    const sidebarCloudBadge = document.getElementById('sidebar-cloud-badge');
    const cloudStatusBadge = document.querySelector('.cloud-status-badge');
    const topCloudPill = document.querySelector('.cloud-pill-top');

    const isOnline = Boolean(this.currentUser);
    const displayName = this.currentProfile?.display_name || this.currentUser?.email?.split('@')[0] || 'Mode Tamu (Offline)';
    const initial = displayName.charAt(0).toUpperCase();

    if (navUserPill) {
      if (isOnline) {
        navUserPill.innerHTML = `
          <div class="user-pill-auth online" onclick="AuthManager.openUserDropdown(event)">
            <div class="user-avatar-circle">${initial}</div>
            <div class="user-pill-meta">
              <span class="user-pill-name">${displayName}</span>
              <span class="user-pill-status">🟢 Cloud Sync Aktif</span>
            </div>
            <span class="user-dropdown-caret">▼</span>
          </div>
        `;
      } else {
        navUserPill.innerHTML = `
          <button class="btn btn-secondary btn-sm" onclick="AuthManager.openAuthModal('login')" style="border-radius: var(--radius-full); padding: 0.35rem 0.85rem;">
            <span>👤 Masuk / Daftar</span>
          </button>
        `;
      }
    }

    if (topCloudPill) {
      if (isOnline) {
        topCloudPill.innerHTML = `
          <span style="color: #10b981;">☁️ Cloud Sync Aktif</span>
          <span class="pin">[Akun: ${displayName}]</span>
        `;
      } else {
        topCloudPill.innerHTML = `
          <span style="color: #94a3b8;">☁️ Mode Tamu Lokal</span>
          <span class="pin" onclick="AuthManager.openCloudConfigModal()" style="cursor: pointer;" title="Klik untuk hubungkan Supabase">[Setup Cloud]</span>
        `;
      }
    }

    if (sidebarCloudBadge) {
      if (isOnline) {
        sidebarCloudBadge.innerHTML = `<span>☁️ Cloud: ${displayName}</span>`;
      } else {
        sidebarCloudBadge.innerHTML = `<span>☁️ Mode Tamu (Lokal)</span>`;
      }
    }
  }

  static openUserDropdown(e) {
    e.stopPropagation();
    let menu = document.getElementById('user-profile-dropdown');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'user-profile-dropdown';
      menu.className = 'user-dropdown-menu';
      document.body.appendChild(menu);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.left = 'auto';

    const displayName = this.currentProfile?.display_name || this.currentUser?.email || 'User';
    const email = this.currentUser?.email || '';

    menu.innerHTML = `
      <div class="dropdown-header">
        <strong>${displayName}</strong>
        <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">${email}</span>
      </div>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" onclick="AuthManager.syncLocalToCloud()">
        <span>🔄 Sinkronkan Data Sekarang</span>
      </button>
      <button class="dropdown-item" onclick="AuthManager.openCloudConfigModal()">
        <span>⚙️ Pengaturan Supabase Cloud</span>
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item danger" onclick="AuthManager.signOut()">
        <span>🚪 Keluar dari Akun</span>
      </button>
    `;

    menu.classList.add('active');

    const closeHandler = () => {
      menu.classList.remove('active');
      document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
  }

  static showSyncToast(msg) {
    let toast = document.getElementById('sync-status-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sync-status-toast';
      toast.className = 'sync-status-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // =========================================================================
  // Modals Controller
  // =========================================================================
  static openAuthModal(tab = 'login') {
    this.switchAuthTab(tab);
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('active');
  }

  static closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('active');
  }

  static switchAuthTab(tab) {
    const modeInput = document.getElementById('auth-active-mode');
    const nameGroup = document.getElementById('auth-name-group');
    const submitBtn = document.getElementById('btn-auth-submit');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const title = document.getElementById('auth-modal-title');

    if (modeInput) modeInput.value = tab;

    if (tab === 'register') {
      if (tabRegister) tabRegister.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'block';
      if (submitBtn) submitBtn.innerHTML = `<span>Daftar Akun Baru</span>`;
      if (title) title.textContent = 'Daftar Akun GoalGetteng 🚀';
    } else {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'none';
      if (submitBtn) submitBtn.innerHTML = `<span>Masuk Sekarang</span>`;
      if (title) title.textContent = 'Masuk ke Akun GoalGetteng 🎯';
    }
  }

  static openCloudConfigModal() {
    const modal = document.getElementById('modal-cloud-config');
    const config = StorageManager.getSupabaseConfig();
    const urlInput = document.getElementById('cloud-supabase-url');
    const keyInput = document.getElementById('cloud-supabase-key');

    if (urlInput) urlInput.value = config.url;
    if (keyInput) keyInput.value = config.key;
    if (modal) modal.classList.add('active');
  }

  static closeCloudConfigModal() {
    const modal = document.getElementById('modal-cloud-config');
    if (modal) modal.classList.remove('active');
  }

  static handleCloudConfigSubmit() {
    const url = document.getElementById('cloud-supabase-url')?.value.trim();
    const key = document.getElementById('cloud-supabase-key')?.value.trim();

    StorageManager.setSupabaseConfig(url, key);
    this.initSupabaseClient();
    this.closeCloudConfigModal();
    this.updateUIStatus();

    alert('💾 Konfigurasi Supabase berhasil disimpan!');
    this.checkSession();
  }
}

// Attach globally
window.AuthManager = AuthManager;
