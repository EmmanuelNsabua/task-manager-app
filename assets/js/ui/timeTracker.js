// ==========================================================================
// TIME TRACKER — Stopwatch + Session Log
// ==========================================================================

import { getPendingTasks, updateTask, getTaskById } from '../data/taskManager.js'

let timerInterval = null
let seconds = 0
let isRunning = false
let selectedTaskId = null
let sessions = [] // { taskId, taskTitle, duration, timestamp }

// --- Elements ---
function el(id) { return document.getElementById(id) }

// --- Format ---
function formatTimer(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
}

function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${totalSeconds % 60}s`
}

// --- UI Updates ---
function updateDisplay() {
    const display = el('timer-display')
    if (display) display.textContent = formatTimer(seconds)
}

function updateButtons() {
    const startBtn = el('timer-start')
    const pauseBtn = el('timer-pause')
    const stopBtn = el('timer-stop')
    const resetBtn = el('timer-reset')

    if (isRunning) {
        startBtn?.classList.add('hidden')
        pauseBtn?.classList.remove('hidden')
        stopBtn?.classList.remove('hidden')
        resetBtn?.classList.add('hidden')
    } else if (seconds > 0) {
        startBtn?.classList.remove('hidden')
        pauseBtn?.classList.add('hidden')
        stopBtn?.classList.remove('hidden')
        resetBtn?.classList.remove('hidden')
    } else {
        startBtn?.classList.remove('hidden')
        pauseBtn?.classList.add('hidden')
        stopBtn?.classList.add('hidden')
        resetBtn?.classList.add('hidden')
    }
}

function renderSessionLog() {
    const log = el('session-log')
    const totalEl = el('total-today')
    if (!log) return

    if (sessions.length === 0) {
        log.innerHTML = '<p class="text-sm text-text-themed-muted text-center py-4">No sessions yet today.</p>'
    } else {
        log.innerHTML = sessions.map(s => `
            <div class="flex items-center justify-between p-3 bg-themed-panel rounded-xl">
                <div>
                    <p class="text-sm font-medium text-text-themed truncate">${escapeHtml(s.taskTitle)}</p>
                    <p class="text-xs text-text-themed-muted">${new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span class="text-sm font-semibold text-accent-primary">${formatDuration(s.duration)}</span>
            </div>
        `).join('')
    }

    // Total
    const total = sessions.reduce((acc, s) => acc + s.duration, 0)
    if (totalEl) {
        const h = Math.floor(total / 3600)
        const m = Math.floor((total % 3600) / 60)
        totalEl.textContent = `${h}h ${m}m`
    }
}

function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

// --- Populate task dropdown ---
function populateTaskSelect() {
    const select = el('timer-task-select')
    if (!select) return

    const pending = getPendingTasks()
    const currentVal = select.value

    // Keep only the default option
    select.innerHTML = '<option value="">— Choose a task to track —</option>'

    pending.forEach(task => {
        const opt = document.createElement('option')
        opt.value = task.id
        opt.textContent = task.title
        select.appendChild(opt)
    })

    // Restore selection if still valid
    if (currentVal && pending.some(t => t.id === currentVal)) {
        select.value = currentVal
    }
}

// ==========================================================================
// TIMER CONTROLS
// ==========================================================================

function start() {
    const select = el('timer-task-select')
    if (!select?.value) {
        select?.focus()
        return
    }
    selectedTaskId = select.value
    const task = getTaskById(selectedTaskId)
    const nameEl = el('timer-task-name')
    if (nameEl && task) nameEl.textContent = `Tracking: ${task.title}`

    isRunning = true
    timerInterval = setInterval(() => {
        seconds++
        updateDisplay()
    }, 1000)
    updateButtons()
}

function pause() {
    isRunning = false
    clearInterval(timerInterval)
    updateButtons()
}

async function stop() {
    isRunning = false
    clearInterval(timerInterval)

    if (seconds > 0 && selectedTaskId) {
        const task = getTaskById(selectedTaskId)
        // Save session
        sessions.unshift({
            taskId: selectedTaskId,
            taskTitle: task?.title || 'Unknown',
            duration: seconds,
            timestamp: new Date().toISOString(),
        })
        renderSessionLog()

        // Update task's tracked time
        if (task) {
            const newTracked = (task.trackedTime || 0) + seconds
            await updateTask(selectedTaskId, { trackedTime: newTracked })
        }
    }

    seconds = 0
    selectedTaskId = null
    updateDisplay()
    updateButtons()
    const nameEl = el('timer-task-name')
    if (nameEl) nameEl.textContent = 'No task selected'
}

function reset() {
    isRunning = false
    clearInterval(timerInterval)
    seconds = 0
    updateDisplay()
    updateButtons()
}

// ==========================================================================
// INIT
// ==========================================================================

export function initTimeTracker() {
    populateTaskSelect()
    renderSessionLog()

    el('timer-start')?.addEventListener('click', start)
    el('timer-pause')?.addEventListener('click', pause)
    el('timer-stop')?.addEventListener('click', stop)
    el('timer-reset')?.addEventListener('click', reset)

    // Refresh task list when tracking view becomes visible
    const observer = new MutationObserver(() => {
        const section = el('view-tracking')
        if (section && !section.classList.contains('hidden')) {
            populateTaskSelect()
        }
    })
    const section = el('view-tracking')
    if (section) {
        observer.observe(section, { attributes: true, attributeFilter: ['class'] })
    }
}
