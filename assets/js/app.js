import { switchView } from "./ui/switchView.js"
import { themeHandler } from "./ui/themeHandler.js"
import { modalHandler } from "./ui/modalHandler.js"
import { renderAll } from "./ui/taskRenderer.js"
import { renderAnalytics } from "./ui/analyticsRenderer.js"
import { initTimeTracker } from "./ui/timeTracker.js"
import { onAuthChange, logOut } from "./firebase/authService.js"
import { syncFromFirestore, clearAllUserData } from "./data/taskManager.js"
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"
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

        // 2. Load data from localStorage
        await syncFromFirestore()

        // 3. Initialize UI modules
        switchView()
        themeHandler()
        modalHandler()

        // 4. Render all content
        renderAll()
        renderAnalytics()

        // 5. Initialize time tracker
        initTimeTracker()

        // 6. Set user display
        updateUserDisplay(user)

        // 7. Refresh icons for new elements
        if (window.lucide) lucide.createIcons()

        // 8. Restore last active view
        const lastView = localStorage.getItem('activeView')
        if (lastView) {
            const savedButton = document.querySelector(`[data-link="${lastView}"]`)
            if (savedButton) savedButton.click()
        }
    })

    // --- Logout ---
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault()
            await logOut()
        })
    })

    // --- Delete Account ---
    document.querySelectorAll('[data-action="delete-account"]').forEach(btn => {
        btn.addEventListener('click', async () => {
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
    })

    // --- Re-render analytics on view switch ---
    document.addEventListener('click', (e) => {
        const navBtn = e.target.closest('[data-link="view-analytics"]')
        if (navBtn) {
            setTimeout(() => renderAnalytics(), 100)
        }
    })
})

function updateUserDisplay(user) {
    const displayName = user.displayName || user.email?.split('@')[0] || 'User'

    const greeting = document.querySelector('#view-dashboard h1')
    if (greeting) greeting.textContent = `Hello, ${displayName}!`

    const profileName = document.getElementById('settings-user-name')
    if (profileName) profileName.textContent = displayName

    const profileEmail = document.getElementById('settings-user-email')
    if (profileEmail) profileEmail.textContent = user.email || ''

    document.querySelectorAll('.user-avatar-initial').forEach(el => {
        el.textContent = displayName.charAt(0).toUpperCase()
    })
}
