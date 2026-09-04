/**
 * TodoistSync — Integrasi Todoist REST API v2 untuk GoalGetten
 * Sinkronisasi Proyek & Tugas dua arah dengan Todoist
 * Dokumentasi API: https://developer.todoist.com/rest/v2/
 */

const TODOIST_STORAGE_KEY = 'goalgetten_todoist_token';
const TODOIST_API_BASE = 'https://api.todoist.com/rest/v2';

class TodoistSync {
  // =========================================================================
  // Connection Management
  // =========================================================================
  static getToken() {
    return localStorage.getItem(TODOIST_STORAGE_KEY) || '';
  }

  static setToken(token) {
    localStorage.setItem(TODOIST_STORAGE_KEY, token.trim());
  }

  static clearToken() {
    localStorage.removeItem(TODOIST_STORAGE_KEY);
  }

  static isConnected() {
    return Boolean(this.getToken());
  }

  static async testConnection() {
    const token = this.getToken();
    if (!token) return { ok: false, message: 'Token belum diisi' };

    try {
      const resp = await fetch(`${TODOIST_API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resp.status === 401) return { ok: false, message: 'Token tidak valid / expired' };
      if (!resp.ok) return { ok: false, message: `Error: HTTP ${resp.status}` };

      const projects = await resp.json();
      return { ok: true, message: `Terhubung! (${projects.length} proyek ditemukan)`, projects };
    } catch (err) {
      return { ok: false, message: `Gagal terhubung: ${err.message}` };
    }
  }

  // =========================================================================
  // Fetch Todoist Data
  // =========================================================================
  static async fetchTodoistProjects() {
    const token = this.getToken();
    if (!token) throw new Error('Tidak ada token Todoist');

    const resp = await fetch(`${TODOIST_API_BASE}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }

  static async fetchTodoistTasks(projectId = null) {
    const token = this.getToken();
    if (!token) throw new Error('Tidak ada token Todoist');

    let url = `${TODOIST_API_BASE}/tasks`;
    if (projectId) url += `?project_id=${projectId}`;

    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }

  // =========================================================================
  // Export: GoalGetten → Todoist
  // =========================================================================
  static async createTodoistProject(name, color = '#8b5cf6') {
    const token = this.getToken();
    const body = { name };

    const resp = await fetch(`${TODOIST_API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`Gagal buat proyek: HTTP ${resp.status}`);
    return await resp.json();
  }

  static async createTodoistTask({ content, projectId, dueDate, priority, description }) {
    const token = this.getToken();

    const body = {
      content,
      project_id: projectId,
      priority: this._mapPriority(priority),
      description: description || ''
    };

    if (dueDate) {
      body.due_date = dueDate;
    }

    const resp = await fetch(`${TODOIST_API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-Id': (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9))
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`Gagal buat tugas: HTTP ${resp.status}`);
    return await resp.json();
  }

  static async closeTodoistTask(todoistTaskId) {
    const token = this.getToken();
    const resp = await fetch(`${TODOIST_API_BASE}/tasks/${todoistTaskId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.ok;
  }

  static async reopenTodoistTask(todoistTaskId) {
    const token = this.getToken();
    const resp = await fetch(`${TODOIST_API_BASE}/tasks/${todoistTaskId}/reopen`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.ok;
  }

  // =========================================================================
  // Full Sync: Push all local projects to Todoist
  // =========================================================================
  static async syncAllProjectsToTodoist(onProgress) {
    const projects = ProjectManager.getProjects();
    const results = { synced: 0, errors: 0, details: [] };

    for (const project of projects) {
      try {
        if (onProgress) onProgress(`Mensinkronkan proyek: "${project.title}"...`);

        // Create or reuse Todoist project
        let todoistProjectId = project.todoistProjectId;
        if (!todoistProjectId) {
          const created = await this.createTodoistProject(project.title);
          todoistProjectId = created.id;
          // Save Todoist ID back to local
          ProjectManager.updateProject(project.id, { todoistProjectId });
        }

        // Sync each task
        for (const task of project.tasks) {
          try {
            if (!task.todoistTaskId) {
              // Create new task in Todoist
              const created = await this.createTodoistTask({
                content: task.title,
                projectId: todoistProjectId,
                dueDate: task.dueDate || null,
                priority: task.priority,
                description: task.notes || ''
              });
              // Save Todoist task ID back
              ProjectManager.updateTask(project.id, task.id, { todoistTaskId: created.id });

              if (task.done) {
                await this.closeTodoistTask(created.id);
              }
            } else {
              // Update existing task completion status
              if (task.done) {
                await this.closeTodoistTask(task.todoistTaskId);
              } else {
                await this.reopenTodoistTask(task.todoistTaskId);
              }
            }
          } catch (taskErr) {
            results.errors++;
            results.details.push(`⚠️ Tugas "${task.title}": ${taskErr.message}`);
          }
        }

        results.synced++;
        results.details.push(`✅ Proyek "${project.title}" berhasil disinkronkan`);
      } catch (projErr) {
        results.errors++;
        results.details.push(`❌ Proyek "${project.title}": ${projErr.message}`);
      }
    }

    return results;
  }

  // =========================================================================
  // Import: Todoist → GoalGetten
  // =========================================================================
  static async importFromTodoist(onProgress) {
    const results = { imported: 0, skipped: 0, errors: 0, details: [] };

    try {
      if (onProgress) onProgress('Mengambil daftar proyek dari Todoist...');
      const todoistProjects = await this.fetchTodoistProjects();
      const localProjects = ProjectManager.getProjects();

      for (const tdProject of todoistProjects) {
        // Skip inbox
        if (tdProject.is_inbox_project) continue;

        if (onProgress) onProgress(`Mengimpor: "${tdProject.name}"...`);

        // Check if local project already linked
        const existingLocal = localProjects.find(p => p.todoistProjectId === tdProject.id);

        let localProject;
        if (existingLocal) {
          localProject = existingLocal;
          results.skipped++;
        } else {
          // Create new local project
          localProject = ProjectManager.addProject({
            title: tdProject.name,
            color: '#8b5cf6',
            icon: '📋'
          });
          ProjectManager.updateProject(localProject.id, { todoistProjectId: tdProject.id });
          results.imported++;
          results.details.push(`✅ Proyek baru: "${tdProject.name}"`);
        }

        // Import tasks
        try {
          const tasks = await this.fetchTodoistTasks(tdProject.id);
          const freshLocalProjects = ProjectManager.getProjects();
          const freshProject = freshLocalProjects.find(p => p.todoistProjectId === tdProject.id);

          if (freshProject) {
            for (const tdTask of tasks) {
              const alreadyLinked = freshProject.tasks.find(t => t.todoistTaskId === tdTask.id);
              if (!alreadyLinked) {
                const newTask = ProjectManager.addTask(freshProject.id, {
                  title: tdTask.content,
                  priority: this._unmapPriority(tdTask.priority),
                  dueDate: tdTask.due ? tdTask.due.date : '',
                  notes: tdTask.description || ''
                });
                ProjectManager.updateTask(freshProject.id, newTask.id, { todoistTaskId: tdTask.id });
                results.imported++;
              }
            }
          }
        } catch (taskErr) {
          results.details.push(`⚠️ Gagal impor tugas dari "${tdProject.name}": ${taskErr.message}`);
        }
      }
    } catch (err) {
      results.errors++;
      results.details.push(`❌ Error: ${err.message}`);
    }

    return results;
  }

  // =========================================================================
  // Priority Mapping (GoalGetten ↔ Todoist)
  // GoalGetten: 1=Tinggi, 2=Sedang, 3=Rendah
  // Todoist: 4=p1(urgent), 3=p2(high), 2=p3(medium), 1=p4(low)
  // =========================================================================
  static _mapPriority(localPriority) {
    const map = { 1: 4, 2: 3, 3: 1 };
    return map[localPriority] || 2;
  }

  static _unmapPriority(todoistPriority) {
    const map = { 4: 1, 3: 2, 2: 2, 1: 3 };
    return map[todoistPriority] || 2;
  }
}
