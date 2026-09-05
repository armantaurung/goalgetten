/**
 * ProjectManager — Proyek & Tugas untuk GoalGetten
 * Data Model: { id, title, category, priority, dueDate, description, color, icon, todoistProjectId, tasks: [{id, title, priority, dueDate, done, todoistTaskId, notes}] }
 */

class ProjectManager {
  static getProjects() {
    if (typeof StorageManager !== 'undefined' && StorageManager.getProjects) {
      return StorageManager.getProjects();
    }
    const data = localStorage.getItem('goalgetten_projects');
    return data ? JSON.parse(data) : [];
  }

  static saveProjects(projects) {
    if (typeof StorageManager !== 'undefined' && StorageManager.saveProjects) {
      StorageManager.saveProjects(projects);
      return;
    }
    localStorage.setItem('goalgetten_projects', JSON.stringify(projects));
  }

  static getProject(projectId) {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  static addProject({ title, category = 'Intellectual / Career', priority = 1, dueDate = '', description = '', color = '#8b5cf6', icon = '📋', tasks = [] }) {
    const projects = this.getProjects();
    const newProject = {
      id: 'p-' + Date.now(),
      title: (title || '').trim(),
      category: category || 'Intellectual / Career',
      priority: parseInt(priority) || 1,
      dueDate: dueDate || '',
      description: (description || '').trim(),
      color: color || '#8b5cf6',
      icon: icon || '📋',
      todoistProjectId: null,
      tasks: (tasks || []).map(t => ({
        id: t.id || ('t-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
        title: (t.title || '').trim(),
        priority: parseInt(t.priority) || 2,
        dueDate: t.dueDate || dueDate || '',
        done: Boolean(t.done),
        todoistTaskId: t.todoistTaskId || null,
        notes: t.notes || ''
      })).filter(t => t.title.length > 0)
    };
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  }

  static updateProject(projectId, updates) {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;
    projects[idx] = { ...projects[idx], ...updates };
    this.saveProjects(projects);
    return true;
  }

  static deleteProject(projectId) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== projectId);
    this.saveProjects(projects);
  }

  static addTask(projectId, { title, priority = 2, dueDate = '', notes = '' }) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    if (!project.tasks) project.tasks = [];

    const newTask = {
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: (title || '').trim(),
      priority: parseInt(priority) || 2,
      dueDate: dueDate || '',
      done: false,
      todoistTaskId: null,
      notes: (notes || '').trim()
    };
    project.tasks.push(newTask);
    this.saveProjects(projects);
    return newTask;
  }

  static toggleTask(projectId, taskId) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return false;
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return false;
    task.done = !task.done;
    this.saveProjects(projects);
    return task.done;
  }

  static deleteTask(projectId, taskId) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return;
    project.tasks = project.tasks.filter(t => t.id !== taskId);
    this.saveProjects(projects);
  }

  static updateTask(projectId, taskId, updates) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return false;
    const idx = project.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return false;
    project.tasks[idx] = { ...project.tasks[idx], ...updates };
    this.saveProjects(projects);
    return true;
  }

  static getStats() {
    const projects = this.getProjects();
    let totalTasks = 0;
    let doneTasks = 0;
    let overdueTasks = 0;
    const today = new Date().toISOString().slice(0, 10);

    projects.forEach(p => {
      (p.tasks || []).forEach(t => {
        totalTasks++;
        if (t.done) doneTasks++;
        else if (t.dueDate && t.dueDate < today) overdueTasks++;
      });
    });

    return { totalProjects: projects.length, totalTasks, doneTasks, overdueTasks };
  }
}

// Attach globally
window.ProjectManager = ProjectManager;
