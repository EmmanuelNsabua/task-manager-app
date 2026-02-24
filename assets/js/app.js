import { switchView } from "./ui/switchView.js"
import { themeHandler } from "./ui/themeHandler.js"
import { modalHandler } from "./ui/modalHandler.js"
import { renderAll, initSearch } from "./ui/taskRenderer.js"
import { renderAnalytics } from "./ui/analyticsRenderer.js"
import { initTimeTracker } from "./ui/timeTracker.js"
import { onAuthChange, logOut } from "./firebase/authService.js"
import { syncFromFirestore, clearAllUserData, getAllTasks } from "./data/taskManager.js"
import { deleteUser, updateProfile } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"
import { auth } from "./firebase/firebaseConfig.js"

document.addEventListener("DOMContentLoaded", () => {
    let initialized = false

    // 1. Auth guard
    onAuthChange(async (user) => {
        if (!user) {
            window.location.href = 'auth.html'
            return
        }

        if (initialized) return
        initialized = true

        // 2. Load data
        await syncFromFirestore()

        // 3. Init UI modules
        switchView()
        themeHandler()
        modalHandler()

        // 4. Render
        renderAll()
        renderAnalytics()

        // 5. Timer
        initTimeTracker()

        // 6. Search
        initSearch()

        // 7. User display
        updateUserDisplay(user)

        // 8. Notifications
        updateNotifications()

        // 9. Name editor
        initNameEditor()

        // 10. Dropdown toggles
        initDropdowns()

        // 11. Refresh icons
        if (window.lucide) lucide.createIcons()

        // 12. Restore view
        const lastView = localStorage.getItem('activeView')
        if (lastView) {
            const savedButton = document.querySelector(`[data-link="${lastView}"]`)
            if (savedButton) savedButton.click()
        }
    })

    // --- Logout (all buttons) ---
    document.addEventListener('click', async (e) => {
        const logoutBtn = e.target.closest('[data-action="logout"]')
        if (logoutBtn) {
            e.preventDefault()
            await logOut()
        }
    })

    // --- Delete Account ---
    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('[data-action="delete-account"]')
        if (!deleteBtn) return

        if (!confirm('Are you sure you want to permanently delete your account and all data? This cannot be undone.')) return

        try {
            await clearAllUserData()
            const user = auth.currentUser
            if (user) await deleteUser(user)
            localStorage.clear()
            window.location.href = 'auth.html'
        } catch (err) {
            alert('Could not delete account. Please sign out, sign back in, and try again.')
            console.error('Delete account error:', err)
        }
    })

    // --- Re-render analytics on view switch ---
    document.addEventListener('click', (e) => {
        const navBtn = e.target.closest('[data-link="view-analytics"]')
        if (navBtn) {
            setTimeout(() => renderAnalytics(), 100)
        }
    })
})

// ==========================================================================
// USER DISPLAY — Uses first name only
// ==========================================================================

function updateUserDisplay(user) {
    const fullName = user.displayName || ''
    const firstName = fullName.split(' ')[0] || user.email?.split('@')[0] || 'User'

    // Dashboard greeting
    const greeting = document.querySelector('#view-dashboard h1')
    if (greeting) greeting.textContent = `Hello, ${firstName}!`

    // Settings profile
    const profileName = document.getElementById('settings-user-name')
    if (profileName) profileName.textContent = fullName || firstName

    const profileEmail = document.getElementById('settings-user-email')
    if (profileEmail) profileEmail.textContent = user.email || ''

    // Profile dropdown
    const dropdownName = document.getElementById('dropdown-user-name')
    if (dropdownName) dropdownName.textContent = fullName || firstName

    const dropdownEmail = document.getElementById('dropdown-user-email')
    if (dropdownEmail) dropdownEmail.textContent = user.email || ''

    // Avatar initials (all instances)
    document.querySelectorAll('.user-avatar-initial').forEach(el => {
        el.textContent = firstName.charAt(0).toUpperCase()
    })
}

// ==========================================================================
// NOTIFICATIONS — Read/Unread System
// ==========================================================================

// Notification state: array of { id, icon, text, type, read, createdAt }
let _notifications = []
let _notifExpanded = false
const NOTIF_VISIBLE = 4

function buildNotifications() {
    const allTasks = getAllTasks()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const fresh = []

    // Overdue tasks (newest first by due date descending)
    allTasks
        .filter(t => !t.completed && t.date && (() => { const d = new Date(t.date); d.setHours(0, 0, 0, 0); return d < today })())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(t => fresh.push({ id: `overdue-${t.id}`, icon: '⚠️', text: `"${t.title}" is overdue`, type: 'overdue', read: false, createdAt: Date.now() }))

    // Today's tasks
    allTasks
        .filter(t => !t.completed && t.date && (() => { const d = new Date(t.date); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime() })())
        .forEach(t => fresh.push({ id: `today-${t.id}`, icon: '📋', text: `"${t.title}" is due today`, type: 'today', read: false, createdAt: Date.now() }))

    // Merge: keep existing read states, add new notifications at the front
    const existingIds = new Set(_notifications.map(n => n.id))
    const brandNew = fresh.filter(n => !existingIds.has(n.id))
    // Remove stale (task no longer matches)
    const freshIds = new Set(fresh.map(n => n.id))
    _notifications = _notifications.filter(n => freshIds.has(n.id))
    // Prepend new ones (newest first)
    _notifications = [...brandNew, ..._notifications]
}

function updateNotifications() {
    buildNotifications()
    _refreshNotificationUI()
}

function _refreshNotificationUI() {
    const badge = document.getElementById('notification-badge')
    const list = document.getElementById('notification-list')
    const footer = document.getElementById('notification-footer')
    const markAllBtn = document.getElementById('mark-all-read-btn')

    const unread = _notifications.filter(n => !n.read).length
    const total = _notifications.length

    // Badge
    if (badge) {
        if (unread > 0) {
            badge.classList.remove('hidden')
            badge.textContent = unread > 9 ? '9+' : unread
        } else {
            badge.classList.add('hidden')
        }
    }

    // Mark all read button
    if (markAllBtn) {
        markAllBtn.classList.toggle('hidden', unread === 0)
    }

    if (!list) return

    if (total === 0) {
        list.innerHTML = '<p class="text-sm text-text-themed-muted text-center py-6">No notifications</p>'
        if (footer) footer.classList.add('hidden')
        return
    }

    const visible = _notifExpanded ? _notifications : _notifications.slice(0, NOTIF_VISIBLE)
    list.innerHTML = ''

    visible.forEach((n, idx) => {
        const el = document.createElement('div')
        el.className = `flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${n.read ? 'opacity-60' : 'bg-accent-primary/5'
            } hover:bg-themed-card-alt`
        el.dataset.notifId = n.id
        el.innerHTML = `
            <span class="text-base mt-0.5 flex-shrink-0">${n.icon}</span>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-text-themed leading-snug">${escapeHtml(n.text)}</p>
                ${!n.read ? '<span class="text-[10px] font-bold text-accent-primary uppercase tracking-wide">New</span>' : ''}
            </div>
            ${!n.read ? '<span class="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 mt-1.5"></span>' : ''}
        `
        el.addEventListener('click', () => {
            const notif = _notifications.find(x => x.id === n.id)
            if (notif) notif.read = true
            _refreshNotificationUI()
        })
        list.appendChild(el)
    })

    // Show/hide "See all" footer
    if (footer) {
        if (total > NOTIF_VISIBLE) {
            footer.classList.remove('hidden')
            const seeAllBtn = document.getElementById('see-all-notifications-btn')
            if (seeAllBtn) {
                seeAllBtn.textContent = _notifExpanded
                    ? 'Show less'
                    : `See all ${total} notifications`
            }
        } else {
            footer.classList.add('hidden')
        }
    }
}

function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

// ==========================================================================
// NAME EDITOR
// ==========================================================================

function initNameEditor() {
    const editBtn = document.getElementById('edit-name-btn')
    const saveBtn = document.getElementById('save-name-btn')
    const cancelBtn = document.getElementById('cancel-name-btn')
    const displayRow = document.getElementById('name-display-row')
    const editRow = document.getElementById('name-edit-row')
    const nameInput = document.getElementById('name-edit-input')
    const nameDisplay = document.getElementById('settings-user-name')

    if (!editBtn || !saveBtn) return

    // Show edit mode
    editBtn.addEventListener('click', () => {
        nameInput.value = nameDisplay?.textContent || ''
        displayRow?.classList.add('hidden')
        editRow?.classList.remove('hidden')
        nameInput?.focus()
    })

    // Cancel
    cancelBtn?.addEventListener('click', () => {
        displayRow?.classList.remove('hidden')
        editRow?.classList.add('hidden')
    })

    // Save
    saveBtn.addEventListener('click', async () => {
        const newName = nameInput?.value.trim()
        if (!newName) return

        saveBtn.textContent = 'Saving...'
        saveBtn.disabled = true

        try {
            const user = auth.currentUser
            if (user) {
                await updateProfile(user, { displayName: newName })

                // Update localStorage cache
                const cached = JSON.parse(localStorage.getItem('taskflow_user') || '{}')
                cached.displayName = newName
                localStorage.setItem('taskflow_user', JSON.stringify(cached))

                // Refresh all UI
                updateUserDisplay(user)
            }
        } catch (err) {
            console.error('Failed to update name:', err)
            alert('Could not update name. Please try again.')
        } finally {
            saveBtn.textContent = 'Save'
            saveBtn.disabled = false
            displayRow?.classList.remove('hidden')
            editRow?.classList.add('hidden')
        }
    })
}

// ==========================================================================
// DROPDOWN TOGGLES
// ==========================================================================

function initDropdowns() {
    const notifBtn = document.getElementById('notification-btn')
    const notifDropdown = document.getElementById('notification-dropdown')
    const profileBtn = document.getElementById('profile-btn')
    const profileDropdown = document.getElementById('profile-dropdown')
    const markAllBtn = document.getElementById('mark-all-read-btn')
    const seeAllBtn = document.getElementById('see-all-notifications-btn')

    // Notification toggle
    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = !notifDropdown?.classList.contains('hidden')
        notifDropdown?.classList.toggle('hidden')
        profileDropdown?.classList.add('hidden')
        // Refresh when opening
        if (!isOpen) _refreshNotificationUI()
    })

    // Profile toggle
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        profileDropdown?.classList.toggle('hidden')
        notifDropdown?.classList.add('hidden')
    })

    // Mark all as read
    markAllBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        _notifications.forEach(n => { n.read = true })
        _refreshNotificationUI()
    })

    // See all / Show less toggle
    seeAllBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        _notifExpanded = !_notifExpanded
        _refreshNotificationUI()
    })

    // Close on outside click — also reset expanded state
    document.addEventListener('click', () => {
        if (!notifDropdown?.classList.contains('hidden')) {
            _notifExpanded = false
        }
        notifDropdown?.classList.add('hidden')
        profileDropdown?.classList.add('hidden')
    })

    // Prevent closing when clicking inside dropdowns
    notifDropdown?.addEventListener('click', (e) => e.stopPropagation())
    profileDropdown?.addEventListener('click', (e) => e.stopPropagation())
}
