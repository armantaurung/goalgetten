/**
 * GoogleCalendarSync — Integrasi Google Calendar untuk GoalGetten
 * 
 * Mode 1: ICS Export (offline, tanpa login) — sudah ada di storage.js
 * Mode 2: Direct API Sync via Google OAuth2 + Calendar API (memerlukan internet & login)
 * 
 * Setup:
 * 1. Buat project di https://console.cloud.google.com/
 * 2. Enable Google Calendar API
 * 3. Buat OAuth 2.0 Client ID (Web application)
 * 4. Tambahkan origin URL ke "Authorized JavaScript origins" (e.g. https://goalgetten.vercel.app)
 * 5. Isi CLIENT_ID di bawah ini
 */

const GCAL_CLIENT_ID_KEY = 'goalgetten_gcal_client_id';
const GCAL_CONNECTED_KEY = 'goalgetten_gcal_connected';

// Default kalender ID yang dipakai
const GCAL_CALENDAR_ID = 'primary';
const GCAL_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

class GoogleCalendarSync {
  static _tokenClient = null;
  static _gapiInited = false;
  static _gsiInited = false;
  static _accessToken = null;

  // =========================================================================
  // Config & Client ID Management
  // =========================================================================
  static getClientId() {
    return localStorage.getItem(GCAL_CLIENT_ID_KEY) || '';
  }

  static setClientId(clientId) {
    localStorage.setItem(GCAL_CLIENT_ID_KEY, clientId.trim());
  }

  static isConnected() {
    return Boolean(this._accessToken) || localStorage.getItem(GCAL_CONNECTED_KEY) === 'true';
  }

  static getConnectionStatus() {
    if (this._accessToken) return 'connected';
    if (localStorage.getItem(GCAL_CONNECTED_KEY) === 'true') return 'session-expired';
    return 'disconnected';
  }

  // =========================================================================
  // Initialize Google API
  // =========================================================================
  static async initGoogleAPI(clientId) {
    if (clientId) this.setClientId(clientId);
    const storedClientId = this.getClientId();

    if (!storedClientId) {
      throw new Error('Client ID Google belum diisi. Silakan masukkan Client ID terlebih dahulu.');
    }

    return new Promise((resolve, reject) => {
      // Load GAPI
      if (!window.gapi) {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          gapi.load('client', async () => {
            try {
              await gapi.client.init({ discoveryDocs: [GCAL_DISCOVERY_DOC] });
              this._gapiInited = true;
              this._loadGSI(storedClientId, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        };
        gapiScript.onerror = () => reject(new Error('Gagal memuat Google API'));
        document.head.appendChild(gapiScript);
      } else {
        if (!this._gapiInited) {
          gapi.load('client', async () => {
            try {
              await gapi.client.init({ discoveryDocs: [GCAL_DISCOVERY_DOC] });
              this._gapiInited = true;
              this._loadGSI(storedClientId, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        } else {
          this._loadGSI(storedClientId, resolve, reject);
        }
      }
    });
  }

  static _loadGSI(clientId, resolve, reject) {
    if (window.google && window.google.accounts) {
      this._initTokenClient(clientId);
      this._gsiInited = true;
      resolve(true);
    } else {
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.onload = () => {
        this._initTokenClient(clientId);
        this._gsiInited = true;
        resolve(true);
      };
      gsiScript.onerror = () => reject(new Error('Gagal memuat Google Sign-In'));
      document.head.appendChild(gsiScript);
    }
  }

  static _initTokenClient(clientId) {
    this._tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GCAL_SCOPES,
      callback: (response) => {
        if (response.error) {
          console.error('OAuth error:', response.error);
          this._onAuthCallback && this._onAuthCallback(false, response.error);
          return;
        }
        this._accessToken = response.access_token;
        gapi.client.setToken({ access_token: response.access_token });
        localStorage.setItem(GCAL_CONNECTED_KEY, 'true');
        this._onAuthCallback && this._onAuthCallback(true, null);
      }
    });
  }

  // =========================================================================
  // Sign In / Sign Out
  // =========================================================================
  static async signIn(onComplete) {
    if (!this._gapiInited || !this._gsiInited || !this._tokenClient) {
      throw new Error('Google API belum diinisialisasi. Panggil initGoogleAPI() terlebih dahulu.');
    }
    this._onAuthCallback = onComplete;
    this._tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  static signOut() {
    if (this._accessToken) {
      google.accounts.oauth2.revoke(this._accessToken, () => {
        console.log('Google OAuth revoked');
      });
      this._accessToken = null;
    }
    localStorage.removeItem(GCAL_CONNECTED_KEY);
    gapi.client.setToken(null);
  }

  // =========================================================================
  // Export Habits → Google Calendar
  // =========================================================================
  static async exportHabitsToCalendar(habits, onProgress) {
    if (!this._accessToken) throw new Error('Belum login ke Google. Silakan connect terlebih dahulu.');

    const results = { created: 0, errors: 0, details: [] };
    const today = new Date();

    for (const habit of habits) {
      try {
        if (onProgress) onProgress(`Mengekspor habit: "${habit.title}"...`);

        const startTime = new Date(today);
        startTime.setHours(8, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (habit.duration || 15));

        const event = {
          summary: `🎯 [Habit] ${habit.title}`,
          description: `Kategori: ${habit.category}\nDurasi: ${habit.duration || 15} menit\nGoal: ${habit.goalTitle || '-'}\n${habit.plan ? 'Rencana: ' + habit.plan : ''}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Jakarta'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Jakarta'
          },
          recurrence: ['RRULE:FREQ=DAILY;COUNT=365'],
          colorId: this._mapHabitColor(habit.color),
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 5 }]
          },
          extendedProperties: {
            private: {
              goalgetten_habit_id: habit.id
            }
          }
        };

        await gapi.client.calendar.events.insert({
          calendarId: GCAL_CALENDAR_ID,
          resource: event
        });

        results.created++;
        results.details.push(`✅ "${habit.title}" berhasil ditambahkan ke Google Calendar`);
      } catch (err) {
        results.errors++;
        results.details.push(`❌ "${habit.title}": ${err.message || err.result?.error?.message}`);
      }
    }

    return results;
  }

  // =========================================================================
  // List Upcoming Events from Google Calendar
  // =========================================================================
  static async listUpcomingEvents(maxResults = 10) {
    if (!this._accessToken) throw new Error('Belum login ke Google.');

    const now = new Date();
    const resp = await gapi.client.calendar.events.list({
      calendarId: GCAL_CALENDAR_ID,
      timeMin: now.toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults,
      orderBy: 'startTime'
    });

    return resp.result.items || [];
  }

  // =========================================================================
  // Color Mapping (habit color hex → Google Calendar colorId)
  // =========================================================================
  static _mapHabitColor(hexColor) {
    const colorMap = {
      '#8b5cf6': '9',  // Grape (purple)
      '#10b981': '2',  // Sage (green)
      '#f59e0b': '5',  // Banana (yellow)
      '#06b6d4': '7',  // Peacock (teal)
      '#f43f5e': '11', // Tomato (red)
      '#d946ef': '3'   // Flamingo (pink)
    };
    return colorMap[hexColor] || '1';
  }

  // =========================================================================
  // Helper: Format event time for display
  // =========================================================================
  static formatEventTime(event) {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return event.start.date;
  }
}
