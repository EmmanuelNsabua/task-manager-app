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
// NOTIFICATIONS — Overdue task alerts
// ==========================================================================

function updateNotifications() {
    const allTasks = getAllTasks()
    const badge = document.getElementById('notification-badge')
    const list = document.getElementById('notification-list')

    // Find overdue tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = allTasks.filter(t => {
        if (t.completed || !t.date) return false
        const due = new Date(t.date)
        due.setHours(0, 0, 0, 0)
        return due < today
    })

    // Today's due tasks
    const todayDue = allTasks.filter(t => {
        if (t.completed || !t.date) return false
        const due = new Date(t.date)
        due.setHours(0, 0, 0, 0)
        return due.getTime() === today.getTime()
    })

    const notifications = []

    overdue.forEach(t => {
        notifications.push({
            icon: '⚠️',
            text: `"${t.title}" is overdue`,
            type: 'overdue'
        })
    })

    todayDue.forEach(t => {
        notifications.push({
            icon: '📋',
            text: `"${t.title}" is due today`,
            type: 'today'
        })
    })

    // Update badge
    if (badge) {
        if (notifications.length > 0) {
            badge.classList.remove('hidden')
            badge.textContent = notifications.length
        } else {
            badge.classList.add('hidden')
        }
    }

    // Update list
    if (list) {
        if (notifications.length === 0) {
            list.innerHTML = '<p class="text-sm text-text-themed-muted text-center py-6">No notifications</p>'
        } else {
            list.innerHTML = notifications.map(n => `
                <div class="flex items-start gap-3 p-3 rounded-xl hover:bg-themed-card-alt transition-colors">
                    <span class="text-lg">${n.icon}</span>
                    <p class="text-sm text-text-themed">${escapeHtml(n.text)}</p>
                </div>
            `).join('')
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

    // Notification toggle
    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        notifDropdown?.classList.toggle('hidden')
        profileDropdown?.classList.add('hidden')
    })

    // Profile toggle
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        profileDropdown?.classList.toggle('hidden')
        notifDropdown?.classList.add('hidden')
    })

    // Close on outside click
    document.addEventListener('click', () => {
        notifDropdown?.classList.add('hidden')
        profileDropdown?.classList.add('hidden')
    })

    // Prevent closing when clicking inside dropdown
    notifDropdown?.addEventListener('click', (e) => e.stopPropagation())
    profileDropdown?.addEventListener('click', (e) => e.stopPropagation())
}
