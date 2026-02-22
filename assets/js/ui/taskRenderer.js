// ==========================================================================
// TASK RENDERER — UI Rendering Layer
// ==========================================================================
import {
    getAllTasks, toggleComplete, deleteTask,
    getStats, getAllProjects, getPendingTasks, getCompletedTasks
} from '../data/taskManager.js'
import { renderAnalytics } from './analyticsRenderer.js'

// --- Priority Config ---
const PRIORITY_CONFIG = {
    high: { label: 'High', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    medium: { label: 'Medium', dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    low: { label: 'Low', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

const PROJECT_COLORS = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', pink: 'bg-pink-500',
}

// ==========================================================================
// FORMAT HELPERS
// ==========================================================================

function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === today.getTime()) return 'Today'
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(task) {
    if (task.completed) return false
    const due = new Date(task.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return due < today
}

function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

// ==========================================================================
// RENDER A SINGLE TASK CARD
// ==========================================================================

function createTaskCard(task) {
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
    const projects = getAllProjects()
    const project = projects.find(p => p.id === task.project)
    const projectColor = PROJECT_COLORS[project?.color] || 'bg-blue-500'
    const overdue = isOverdue(task)

    const card = document.createElement('div')
    card.className = `task-card group bg-themed-card rounded-2xl border border-border-themed p-5 transition-all hover:shadow-md hover:border-border-themed-focus ${task.completed ? 'opacity-60' : ''}`
    card.dataset.taskId = task.id

    card.innerHTML = `
        <div class="flex items-start gap-4">
            <button class="task-toggle mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 ${task.completed
            ? 'bg-accent-primary border-accent-primary'
            : 'border-gray-300 dark:border-gray-600 hover:border-accent-primary'
        } transition-colors flex items-center justify-center" data-action="toggle" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                ${task.completed ? '<svg class="w-3 h-3 text-text-themed-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-text-themed ${task.completed ? 'line-through' : ''} truncate">${escapeHtml(task.title)}</h4>
                </div>
                ${task.description ? `<p class="text-sm text-text-themed-secondary mb-2 line-clamp-2">${escapeHtml(task.description)}</p>` : ''}
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${priority.badge}">
                        <span class="w-1.5 h-1.5 rounded-full ${priority.dot}"></span>
                        ${priority.label}
                    </span>
                    ${task.date ? `
                    <span class="inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-text-themed-muted'}">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        ${overdue ? 'Overdue · ' : ''}${formatDate(task.date)}${task.time ? ' · ' + formatTime(task.time) : ''}
                    </span>` : ''}
                    ${project ? `
                    <span class="inline-flex items-center gap-1.5 text-xs text-text-themed-muted">
                        <span class="w-2 h-2 rounded-full ${projectColor}"></span>
                        ${escapeHtml(project.name)}
                    </span>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1.5 hover:bg-themed-card-alt rounded-lg transition-colors text-text-themed-muted hover:text-text-themed" data-action="edit" title="Edit">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-text-themed-muted hover:text-red-500" data-action="delete" title="Delete">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        </div>
    `

    // --- Event Delegation (async handlers) ---
    card.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]')
        if (!btn) return
        const action = btn.dataset.action
        if (action === 'toggle') {
            await toggleComplete(task.id)
            renderAll()
        } else if (action === 'delete') {
            if (confirm('Delete this task?')) {
                await deleteTask(task.id)
                renderAll()
            }
        } else if (action === 'edit') {
            openEditModal(task)
        }
    })

    return card
}

// ==========================================================================
// EMPTY STATE
// ==========================================================================

function createEmptyState(message = 'No tasks yet', showButton = true) {
    const div = document.createElement('div')
    div.className = 'bg-themed-card rounded-2xl border border-border-themed p-10 text-center transition-colors'
    div.innerHTML = `
        <div class="w-32 h-32 mx-auto mb-6 opacity-60">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                <circle cx="100" cy="100" r="80" class="fill-gray-50 dark:fill-gray-900"/>
                <rect x="60" y="50" width="80" height="100" rx="8" class="fill-white dark:fill-gray-700 stroke-gray-200 dark:stroke-gray-600" stroke-width="2"/>
                <rect x="75" y="70" width="50" height="4" rx="2" class="fill-gray-200 dark:fill-gray-600"/>
                <rect x="75" y="85" width="40" height="4" rx="2" class="fill-gray-200 dark:fill-gray-600"/>
                <rect x="75" y="100" width="45" height="4" rx="2" class="fill-gray-200 dark:fill-gray-600"/>
                <circle cx="68" cy="72" r="4" class="fill-gray-800 dark:fill-gray-400"/>
                <circle cx="68" cy="87" r="4" class="fill-gray-800 dark:fill-gray-400"/>
            </svg>
        </div>
        <h3 class="text-xl font-bold text-text-themed mb-2">${message}</h3>
        <p class="text-text-themed-secondary mb-6 max-w-md mx-auto">Create a new task to get started with your day.</p>
        ${showButton ? `
        <button class="create-task-trigger inline-flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary-hover text-text-themed-inverse rounded-full font-semibold transition-all">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Create New Task
        </button>` : ''}
    `
    return div
}

// ==========================================================================
// RENDER SECTIONS
// ==========================================================================

function renderDashboard() {
    const section = document.getElementById('view-dashboard')
    if (!section) return

    const allTasks = getAllTasks()
    const stats = getStats()
    let container = section.querySelector('#dashboard-task-container')
    const emptyState = document.getElementById('dashboard-empty-state')
    const statsGrid = document.getElementById('dashboard-stats-grid')

    // Update user greeting
    const greeting = section.querySelector('h1')
    const cachedUser = JSON.parse(localStorage.getItem('taskflow_user') || 'null')
    if (greeting && cachedUser?.displayName) {
        greeting.textContent = `Hello, ${cachedUser.displayName}!`
    }

    if (allTasks.length === 0) {
        if (emptyState) emptyState.style.display = ''
        if (statsGrid) statsGrid.classList.add('hidden')
        if (container) container.remove()
    } else {
        if (emptyState) emptyState.style.display = 'none'
        if (statsGrid) statsGrid.classList.remove('hidden')

        const statTotal = document.getElementById('stat-total')
        const statCompleted = document.getElementById('stat-completed')
        if (statTotal) statTotal.textContent = stats.total
        if (statCompleted) statCompleted.textContent = stats.completed

        const trackedEl = statsGrid?.querySelectorAll('.text-3xl')?.[2]
        if (trackedEl) trackedEl.textContent = `${Math.floor(stats.totalTrackedSeconds / 3600)}h`

        const prodEl = statsGrid?.querySelectorAll('.text-3xl')?.[3]
        if (prodEl) prodEl.textContent = `${stats.productivity}%`

        if (!container) {
            container = document.createElement('div')
            container.id = 'dashboard-task-container'
            container.className = 'space-y-3 mt-6'
            const insertAfter = statsGrid || emptyState
            if (insertAfter) insertAfter.after(container)
            else section.appendChild(container)
        }
        container.innerHTML = ''

        const recentTasks = allTasks.slice(0, 5)
        recentTasks.forEach(task => container.appendChild(createTaskCard(task)))

        if (allTasks.length > 5) {
            const moreLink = document.createElement('button')
            moreLink.className = 'w-full text-center py-3 text-sm font-medium text-text-themed-secondary hover:text-text-themed transition-colors'
            moreLink.textContent = `View all ${allTasks.length} tasks →`
            moreLink.addEventListener('click', () => {
                document.querySelector('[data-link="view-tasks"]')?.click()
            })
            container.appendChild(moreLink)
        }
    }
}

function renderTaskList() {
    const container = document.getElementById('task-list-container')
    if (!container) return

    const allTasks = getAllTasks()
    container.innerHTML = ''

    if (allTasks.length === 0) {
        container.appendChild(createEmptyState('Your task list is empty'))
        return
    }

    const pending = getPendingTasks()
    const completed = getCompletedTasks()

    if (pending.length > 0) {
        const header = document.createElement('h3')
        header.className = 'text-sm font-bold text-text-themed-secondary uppercase tracking-wider mb-3'
        header.textContent = `Pending (${pending.length})`
        container.appendChild(header)
        pending.forEach(task => container.appendChild(createTaskCard(task)))
    }

    if (completed.length > 0) {
        const header = document.createElement('h3')
        header.className = 'text-sm font-bold text-text-themed-secondary uppercase tracking-wider mb-3 mt-8'
        header.textContent = `Completed (${completed.length})`
        container.appendChild(header)
        completed.forEach(task => container.appendChild(createTaskCard(task)))
    }
}

function renderRightSidebar() {
    const stats = getStats()
    const projects = getAllProjects()
    const tasksCount = document.getElementById('sidebar-tasks-count')
    const projectsCount = document.getElementById('sidebar-projects-count')
    if (tasksCount) tasksCount.textContent = `${stats.completed} Tasks`
    if (projectsCount) projectsCount.textContent = `${projects.length} Projects`
}

// ==========================================================================
// EDIT MODAL
// ==========================================================================

let editingTaskId = null

function openEditModal(task) {
    const dialog = document.getElementById('create-task-dialog')
    const form = document.getElementById('create-task-form')
    const title = dialog.querySelector('h3')

    editingTaskId = task.id
    if (title) title.textContent = 'Edit Task'

    form.querySelector('#task-title').value = task.title
    form.querySelector('#task-desc').value = task.description || ''
    form.querySelector('#task-date').value = task.date || ''
    form.querySelector('#task-time').value = task.time || ''
    form.querySelector('#task-priority').value = task.priority || 'medium'
    form.querySelector('#task-project').value = task.project || 'personal'

    const submitBtn = form.querySelector('button[type="submit"]')
    if (submitBtn) submitBtn.textContent = 'Save Changes'

    dialog.showModal()
}

export function resetEditState() {
    editingTaskId = null
    const dialog = document.getElementById('create-task-dialog')
    const title = dialog?.querySelector('h3')
    if (title) title.textContent = 'Create New Task'
    const submitBtn = dialog?.querySelector('button[type="submit"]')
    if (submitBtn) submitBtn.textContent = 'Create Task'
}

export function getEditingTaskId() {
    return editingTaskId
}

// ==========================================================================
// RENDER ALL
// ==========================================================================

export function renderAll() {
    renderDashboard()
    renderTaskList()
    renderRightSidebar()
    renderAnalytics()
}
