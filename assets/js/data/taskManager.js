// ==========================================================================
// TASK MANAGER — Data Layer (localStorage per user)
// ==========================================================================

const STORAGE_KEY = 'taskflow_tasks'
const PROJECT_KEY = 'taskflow_projects'

// --- Default Projects ---
const DEFAULT_PROJECTS = [
    { id: 'personal', name: 'Personal', color: 'blue' },
    { id: 'work', name: 'Work', color: 'green' },
    { id: 'school', name: 'School', color: 'purple' },
]

// --- Helpers ---
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function loadCache(key, fallback = []) {
    try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : fallback
    } catch { return fallback }
}

function saveCache(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
}

// --- State ---
let tasks = loadCache(STORAGE_KEY)
let projects = loadCache(PROJECT_KEY, DEFAULT_PROJECTS)

// Ensure default projects exist on first load
if (projects.length === 0) {
    projects = [...DEFAULT_PROJECTS]
    saveCache(PROJECT_KEY, projects)
}

// ==========================================================================
// DATA SYNC (no-op without Firestore, keeps API compatible)
// ==========================================================================

export async function syncFromFirestore() {
    // Data is already loaded from localStorage — nothing to sync
    tasks = loadCache(STORAGE_KEY)
    projects = loadCache(PROJECT_KEY, DEFAULT_PROJECTS)
}

// ==========================================================================
// TASKS CRUD
// ==========================================================================

export async function createTask({ title, description = '', date, time = '', priority = 'medium', project = 'personal' }) {
    const task = {
        id: generateId(),
        title,
        description,
        date,
        time,
        priority,
        project,
        completed: false,
        createdAt: new Date().toISOString(),
        trackedTime: 0,
    }
    tasks.unshift(task)
    saveCache(STORAGE_KEY, tasks)
    return task
}

export function getAllTasks() {
    return [...tasks]
}

export function getTaskById(id) {
    return tasks.find(t => t.id === id) || null
}

export async function updateTask(id, updates) {
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) return null
    tasks[index] = { ...tasks[index], ...updates }
    saveCache(STORAGE_KEY, tasks)
    return tasks[index]
}

export async function toggleComplete(id) {
    const task = tasks.find(t => t.id === id)
    if (!task) return null
    task.completed = !task.completed
    saveCache(STORAGE_KEY, tasks)
    return task
}

export async function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) return false
    tasks.splice(index, 1)
    saveCache(STORAGE_KEY, tasks)
    return true
}

// ==========================================================================
// PROJECTS CRUD
// ==========================================================================

export function getAllProjects() {
    return [...projects]
}

export async function createProject(name, color = 'blue') {
    const project = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        color,
    }
    projects.push(project)
    saveCache(PROJECT_KEY, projects)
    return project
}

// ==========================================================================
// STATISTICS
// ==========================================================================

export function getStats() {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const pending = total - completed
    const overdue = tasks.filter(t => {
        if (t.completed) return false
        const due = new Date(t.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return due < today
    }).length
    const totalTrackedSeconds = tasks.reduce((acc, t) => acc + (t.trackedTime || 0), 0)
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, pending, overdue, totalTrackedSeconds, productivity }
}

// ==========================================================================
// FILTERS
// ==========================================================================

export function getTasksByProject(projectId) {
    return tasks.filter(t => t.project === projectId)
}

export function getCompletedTasks() {
    return tasks.filter(t => t.completed)
}

export function getPendingTasks() {
    return tasks.filter(t => !t.completed)
}

export function searchTasks(queryStr) {
    const q = queryStr.toLowerCase()
    return tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    )
}

// ==========================================================================
// WEEKLY DATA (for charts)
// ==========================================================================

export function getWeeklyData() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const now = new Date()
    const weekData = []

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dayTasks = tasks.filter(t => {
            const created = new Date(t.createdAt)
            return created >= date && created < nextDate
        })
        const dayCompleted = dayTasks.filter(t => t.completed).length

        weekData.push({
            label: days[date.getDay()],
            created: dayTasks.length,
            completed: dayCompleted,
        })
    }
    return weekData
}

export function getPriorityDistribution() {
    return {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
    }
}

// ==========================================================================
// ACCOUNT DELETION
// ==========================================================================

export async function clearAllUserData() {
    tasks = []
    projects = [...DEFAULT_PROJECTS]
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PROJECT_KEY)
}
