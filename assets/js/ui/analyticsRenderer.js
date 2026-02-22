// ==========================================================================
// ANALYTICS RENDERER — Chart.js Powered Analytics
// ==========================================================================

import { getStats, getWeeklyData, getPriorityDistribution, getAllTasks } from '../data/taskManager.js'

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

// --- Default chart options ---
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
            datasets: [{
                data: [stats.completed, stats.pending],
                backgroundColor: [c.green, c.gray],
                borderWidth: 0,
                hoverOffset: 8,
            }]
        },
        options: {
            ...defaultOptions(),
            cutout: '70%',
            plugins: {
                ...defaultOptions().plugins,
                legend: {
                    position: 'bottom',
                    labels: { color: c.text, padding: 16, usePointStyle: true, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
                }
            }
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
                {
                    label: 'Created',
                    data: weekData.map(d => d.created),
                    backgroundColor: c.blueBg,
                    borderColor: c.blue,
                    borderWidth: 1.5,
                    borderRadius: 6,
                },
                {
                    label: 'Completed',
                    data: weekData.map(d => d.completed),
                    backgroundColor: c.greenBg,
                    borderColor: c.green,
                    borderWidth: 1.5,
                    borderRadius: 6,
                }
            ]
        },
        options: {
            ...defaultOptions(),
            scales: {
                x: {
                    ticks: { color: c.text, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: c.text, stepSize: 1, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                    grid: { color: c.grid },
                }
            },
            plugins: {
                ...defaultOptions().plugins,
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { color: c.text, usePointStyle: true, padding: 12, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
                }
            }
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
                backgroundColor: [
                    'rgba(239,68,68,0.2)',
                    'rgba(234,179,8,0.2)',
                    'rgba(34,197,94,0.2)',
                ],
                borderColor: [c.red, c.yellow, c.green],
                borderWidth: 1.5,
                borderRadius: 8,
            }]
        },
        options: {
            ...defaultOptions(),
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: c.text, stepSize: 1, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                    grid: { color: c.grid },
                },
                y: {
                    ticks: { color: c.text, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } },
                    grid: { display: false },
                }
            },
            plugins: {
                ...defaultOptions().plugins,
                legend: { display: false }
            }
        }
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

    // Update stat cards
    document.getElementById('analytics-total').textContent = stats.total
    document.getElementById('analytics-completed').textContent = stats.completed
    document.getElementById('analytics-pending').textContent = stats.pending
    document.getElementById('analytics-overdue').textContent = stats.overdue

    // Build charts
    buildCompletionChart()
    buildWeeklyChart()
    buildPriorityChart()
}
