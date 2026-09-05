/**
 * ProjectManager — Proyek & Tugas untuk GoalGetten
 * Data Model: { id, title, color, icon, todoistProjectId, tasks: [{id, title, priority, dueDate, done, todoistTaskId, notes}] }
 */

const PROJECTS_STORAGE_KEY = 'goalgetten_projects';

const DEFAULT_PROJECTS = [
  {
    id: 'p-1',
    title: 'GoalGetten App Development',
    color: '#f59e0b',
    icon: '💻',
    todoistProjectId: null,
    tasks: [
      { id: 't-1', title: 'Buat wireframe UI dashboard', priority: 1, dueDate: '2026-09-05', done: true, todoistTaskId: null, notes: '' },
      { id: 't-2', title: 'Implementasi fitur habit tracker', priority: 1, dueDate: '2026-09-10', done: true, todoistTaskId: null, notes: '' },
      { id: 't-3', title: 'Integrasi Google Calendar API', priority: 2, dueDate: '2026-09-15', done: false, todoistTaskId: null, notes: 'Perlu setup Google Cloud Console' },
      { id: 't-4', title: 'Deploy ke Vercel & PWA setup', priority: 2, dueDate: '2026-09-20', done: true, todoistTaskId: null, notes: '' },
      { id: 't-5', title: 'Tulis dokumentasi penggunaan', priority: 3, dueDate: '2026-09-25', done: false, todoistTaskId: null, notes: '' }
    ]
  },
  {
    id: 'p-2',
    title: 'Konten & Media Sosial',
    color: '#d946ef',
    icon: '🎬',
    todoistProjectId: null,
    tasks: [
      { id: 't-6', title: 'Buat script video YouTube: Habit Tracker AI', priority: 1, dueDate: '2026-09-08', done: false, todoistTaskId: null, notes: '' },
      { id: 't-7', title: 'Desain thumbnail video', priority: 2, dueDate: '2026-09-09', done: false, todoistTaskId: null, notes: '' },
      { id: 't-8', title: 'Upload dan jadwalkan posting', priority: 2, dueDate: '2026-09-12', done: false, todoistTaskId: null, notes: '' }
    ]
  }
];

class ProjectManager {
  static getProjects() {
    const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!data) {
      this.saveProjects(DEFAULT_PROJECTS);
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(data);
  }

  static saveProjects(projects) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }

  static getProject(projectId) {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  static addProject({ title, category = 'Intellectual / Career', priority = 1, dueDate = '', description = '', color = '#8b5cf6', icon = '📋', tasks = [] }) {
    const projects = this.getProjects();
    const newProject = {
      id: 'p-' + Date.now(),
      title: title.trim(),
      category: category || 'Intellectual / Career',
      priority: parseInt(priority) || 1,
      dueDate: dueDate || '',
      description: description || '',
      color: color || '#8b5cf6',
      icon: icon || '📋',
      todoistProjectId: null,
      tasks: tasks.map(t => ({
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

    const newTask = {
      id: 't-' + Date.now(),
      title: title.trim(),
      priority: parseInt(priority),
      dueDate: dueDate || '',
      done: false,
      todoistTaskId: null,
      notes: notes || ''
    };
    project.tasks.push(newTask);
    this.saveProjects(projects);
    return newTask;
  }

  static toggleTask(projectId, taskId) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return false;
    task.done = !task.done;
    this.saveProjects(projects);
    return task.done;
  }

  static deleteTask(projectId, taskId) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    project.tasks = project.tasks.filter(t => t.id !== taskId);
    this.saveProjects(projects);
  }

  static updateTask(projectId, taskId, updates) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
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
      p.tasks.forEach(t => {
        totalTasks++;
        if (t.done) doneTasks++;
        else if (t.dueDate && t.dueDate < today) overdueTasks++;
      });
    });

    return { totalProjects: projects.length, totalTasks, doneTasks, overdueTasks };
  }
}
