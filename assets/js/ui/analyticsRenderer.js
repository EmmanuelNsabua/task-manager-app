import { getStats, getWeeklyData, getPriorityDistribution, getAllTasks, getAllProjects, getTasksByProject } from '../data/taskManager.js'

let completionChart = null
let weeklyChart = null
let priorityChart = null

// --- Theme-aware colors ---
function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark')
    return {
        text: isDark ? '#e5e7eb' : '#374151',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        green: '#22c55e',
        greenBg: isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)',
        gray: isDark ? '#4b5563' : '#d1d5db',
        grayBg: isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.4)',
        blue: '#3b82f6',
        blueBg: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
        red: '#ef4444',
        yellow: '#eab308',
        orange: '#f97316',
    }
}

function defaultOptions(title = '') {
    const c = getChartColors()
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: c.text, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
            },
            ...(title ? { title: { display: false, text: title } } : {}),
        },
    }
}

// ==========================================================================
// CHART BUILDERS
// ==========================================================================

function buildCompletionChart() {
    const ctx = document.getElementById('chart-completion')
    if (!ctx) return
    const stats = getStats()
    const c = getChartColors()
    if (completionChart) completionChart.destroy()
    completionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{ data: [stats.completed, stats.pending], backgroundColor: [c.green, c.gray], borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
            ...defaultOptions(), cutout: '70%',
            plugins: { ...defaultOptions().plugins, legend: { position: 'bottom', labels: { color: c.text, padding: 16, usePointStyle: true, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } } } }
        }
    })
}

function buildWeeklyChart() {
    const ctx = document.getElementById('chart-weekly')
    if (!ctx) return
    const weekData = getWeeklyData()
    const c = getChartColors()
    if (weeklyChart) weeklyChart.destroy()
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekData.map(d => d.label),
            datasets: [
                { label: 'Created', data: weekData.map(d => d.created), backgroundColor: c.blueBg, borderColor: c.blue, borderWidth: 1.5, borderRadius: 6 },
                { label: 'Completed', data: weekData.map(d => d.completed), backgroundColor: c.greenBg, borderColor: c.green, borderWidth: 1.5, borderRadius: 6 }
            ]
        },
        options: {
            ...defaultOptions(),
            scales: {
                x: { ticks: { color: c.text, font: { family: "'Plus Jakarta Sans', sans-serif" } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: c.text, stepSize: 1, font: { family: "'Plus Jakarta Sans', sans-serif" } }, grid: { color: c.grid } }
            },
            plugins: { ...defaultOptions().plugins, legend: { position: 'top', align: 'end', labels: { color: c.text, usePointStyle: true, padding: 12, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } } }
        }
    })
}

function buildPriorityChart() {
    const ctx = document.getElementById('chart-priority')
    if (!ctx) return
    const dist = getPriorityDistribution()
    const c = getChartColors()
    if (priorityChart) priorityChart.destroy()
    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tasks',
                data: [dist.high, dist.medium, dist.low],
                backgroundColor: ['rgba(239,68,68,0.2)', 'rgba(234,179,8,0.2)', 'rgba(34,197,94,0.2)'],
                borderColor: [c.red, c.yellow, c.green],
                borderWidth: 1.5, borderRadius: 8,
            }]
        },
        options: {
            ...defaultOptions(), indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { color: c.text, stepSize: 1, font: { family: "'Plus Jakarta Sans', sans-serif" } }, grid: { color: c.grid } },
                y: { ticks: { color: c.text, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } }, grid: { display: false } }
            },
            plugins: { ...defaultOptions().plugins, legend: { display: false } }
        }
    })
}

// ==========================================================================
// PROJECT LIST
// ==========================================================================

const PROJECT_COLOR_MAP = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', pink: 'bg-pink-500',
}

function renderProjectsList() {
    const container = document.getElementById('analytics-projects-list')
    if (!container) return

    const projects = getAllProjects()
    container.innerHTML = ''

    if (projects.length === 0) {
        container.innerHTML = '<p class="text-sm text-text-themed-muted text-center py-4">No projects yet.</p>'
        return
    }

    projects.forEach(project => {
        const tasks = getTasksByProject(project.id)
        const completed = tasks.filter(t => t.completed).length
        const total = tasks.length
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        const colorClass = PROJECT_COLOR_MAP[project.color] || 'bg-blue-500'

        const el = document.createElement('div')
        el.className = 'flex items-center gap-4 p-3 bg-themed-card-alt rounded-xl'
        el.innerHTML = `
            <span class="w-3 h-3 rounded-full ${colorClass} flex-shrink-0"></span>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <p class="text-sm font-semibold text-text-themed truncate">${project.name}</p>
                    <span class="text-xs text-text-themed-muted ml-2">${completed}/${total}</span>
                </div>
                <div class="w-full h-1.5 bg-themed-panel rounded-full overflow-hidden">
                    <div class="${colorClass} h-full rounded-full transition-all" style="width: ${pct}%"></div>
                </div>
            </div>
        `
        container.appendChild(el)
    })
}

// ==========================================================================
// RENDER
// ==========================================================================

export function renderAnalytics() {
    const stats = getStats()
    const allTasks = getAllTasks()
    const emptyEl = document.getElementById('analytics-empty')
    const contentEl = document.getElementById('analytics-content')

    if (!emptyEl || !contentEl) return

    if (allTasks.length === 0) {
        emptyEl.classList.remove('hidden')
        contentEl.classList.add('hidden')
        return
    }

    emptyEl.classList.add('hidden')
    contentEl.classList.remove('hidden')

    document.getElementById('analytics-total').textContent = stats.total
    document.getElementById('analytics-completed').textContent = stats.completed
    document.getElementById('analytics-pending').textContent = stats.pending
    document.getElementById('analytics-overdue').textContent = stats.overdue

    buildCompletionChart()
    buildWeeklyChart()
    buildPriorityChart()
    renderProjectsList()
}
