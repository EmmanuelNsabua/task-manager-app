import { createTask, updateTask, createProject, getAllProjects } from '../data/taskManager.js'
import { renderAll, getEditingTaskId, resetEditState } from './taskRenderer.js'

export function modalHandler() {
    const taskDialog = document.getElementById("create-task-dialog")
    const projectDialog = document.getElementById("create-project-dialog")
    const taskForm = document.getElementById("create-task-form")
    const projectForm = document.getElementById("create-project-form")
    const projectSelect = document.getElementById("task-project")

    function setDefaultDate() {
        const dateInput = document.getElementById("task-date")
        if (dateInput) dateInput.valueAsDate = new Date()
    }

    function syncProjectDropdown() {
        const projects = getAllProjects()
        projectSelect.innerHTML = ''
        projects.forEach(p => {
            const opt = document.createElement('option')
            opt.value = p.id
            opt.textContent = p.name
            projectSelect.appendChild(opt)
        })
        const hr = document.createElement('hr')
        projectSelect.appendChild(hr)
        const newOpt = document.createElement('option')
        newOpt.value = 'new_project'
        newOpt.textContent = '+ Create new project'
        projectSelect.appendChild(newOpt)
    }

    syncProjectDropdown()

    function openTaskModal() {
        resetEditState()
        taskForm.reset()
        setDefaultDate()
        syncProjectDropdown()
        taskDialog.showModal()
    }

    function closeTaskModal() {
        taskDialog.close()
        taskForm.reset()
        resetEditState()
    }

    // --- Open modal from any "create task" button ---
    document.body.addEventListener('click', (e) => {
        const trigger = e.target.closest('#create-task-btn, .create-task-trigger, [data-open-task-modal]')
        if (trigger && !trigger.closest('form')) {
            e.preventDefault()
            openTaskModal()
        }
    })

    // Close
    document.querySelectorAll("[data-close-task-modal]").forEach(btn =>
        btn.addEventListener("click", closeTaskModal))

    taskDialog.addEventListener("click", (e) => {
        const rect = taskDialog.getBoundingClientRect()
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top || e.clientY > rect.bottom) {
            closeTaskModal()
        }
    })

    // --- Project Modal ---
    projectSelect.addEventListener("change", (e) => {
        if (e.target.value === "new_project") projectDialog.showModal()
    })

    document.querySelectorAll("[data-close-project-modal]").forEach(btn =>
        btn.addEventListener("click", () => {
            projectDialog.close()
            projectForm.reset()
            projectSelect.value = "personal"
        }))

    projectForm.addEventListener("submit", async (e) => {
        const formData = new FormData(projectForm)
        const name = formData.get("projectName")
        const color = formData.get("projectColor")
        if (name) {
            const project = await createProject(name, color)
            syncProjectDropdown()
            projectSelect.value = project.id
            projectDialog.close()
            projectForm.reset()
        }
    })

    // --- Task Submission (CREATE or EDIT) ---
    taskForm.addEventListener("submit", async (e) => {
        const formData = new FormData(taskForm)
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description') || '',
            date: formData.get('date'),
            time: formData.get('time') || '',
            priority: formData.get('priority') || 'medium',
            project: formData.get('project') || 'personal',
        }

        const editId = getEditingTaskId()
        if (editId) {
            await updateTask(editId, taskData)
        } else {
            await createTask(taskData)
        }

        setTimeout(() => {
            taskForm.reset()
            resetEditState()
        }, 0)

        renderAll()
    })
}
