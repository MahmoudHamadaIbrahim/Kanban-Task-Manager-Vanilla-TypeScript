class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditIndex = null;
        this.loadTasks();
        this.render();
    }
    get todoTasks() {
        return this.tasks.filter((t) => t.status === "todo");
    }
    get inProgressTasks() {
        return this.tasks.filter((t) => t.status === "in-progress");
    }
    get completedTasks() {
        return this.tasks.filter((t) => t.status === "completed");
    }
    getDueStatus(dateStr) {
        if (!dateStr)
            return "normal";
        const target = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (target < today)
            return "overdue";
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 ? "soon" : "normal";
    }
    formatDate(dateStr) {
        if (!dateStr)
            return "";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }
    saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
        this.render();
    }
    loadTasks() {
        this.tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    }
    addTask(task) {
        if (this.currentEditIndex !== null) {
            this.tasks[this.currentEditIndex] = task;
            this.currentEditIndex = null;
        }
        else {
            this.tasks.push(task);
        }
        this.saveTasks();
    }
    deleteTask(index) {
        this.tasks.splice(index, 1);
        this.saveTasks();
    }
    updateStatus(index, status) {
        if (this.tasks[index]) {
            this.tasks[index].status = status;
            this.saveTasks();
        }
    }
    getTasksByStatus(status) {
        return this.tasks.filter((t) => t.status === status);
    }
    render() {
        const todoCountEl = document.getElementById("todo-count");
        const progressCountEl = document.getElementById("progress-count");
        const completedCountEl = document.getElementById("completed-count");
        if (todoCountEl) {
            todoCountEl.innerText = `${this.todoTasks.length} tasks`;
        }
        if (progressCountEl) {
            progressCountEl.innerText = `${this.inProgressTasks.length} tasks`;
        }
        if (completedCountEl) {
            completedCountEl.innerText = `${this.completedTasks.length} tasks`;
        }
        this.renderColumn("todo", "todoTasks");
        this.renderColumn("in-progress", "progressTasks");
        this.renderColumn("completed", "completedTasks");
    }
    renderColumn(status, containerId) {
        const container = document.getElementById(containerId);
        if (!container)
            return;
        container.innerHTML = "";
        const filteredTasks = this.tasks.filter((t) => t.status === status);
        if (filteredTasks.length === 0) {
            return;
        }
        filteredTasks.forEach((task) => {
            const actualIndex = this.tasks.findIndex((t) => t.createdAt === task.createdAt);
            const dueStatus = this.getDueStatus(task.dueDate);
            const div = document.createElement("div");
            const isCompleted = task.status === "completed";
            const isInProgress = task.status === "in-progress";
            div.innerHTML = `
        <div class="bg-white p-3 task mb-3 border-light shadow-sm">
    <div class="top-par d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle circle" style="background-color: ${isInProgress ? "oklch(0.769 0.188 70.08)" : isCompleted ? "#10b981" : "oklch(0.869 0.022 252.894)"};"}"></span>
            <span class="index">#00${actualIndex + 1}</span>
        </div>

        <div class="d-flex align-items-center gap-1 btns">
            <button onclick="taskManager.openEditModal(${actualIndex})" class="btn edit-btn d-flex justify-content-center align-items-center">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="taskManager.deleteTask(${actualIndex})" class="btn delete-btn d-flex justify-content-center align-items-center">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    </div>

    <h5 class="task-title ${isCompleted ? "text-decoration-line-through text-muted opacity-100" : ""}">
        ${task.title}
    </h5>

    ${task.description ? `<p class="task-description ${isCompleted ? "opacity-100" : ""}">${task.description}</p>` : ""}

    <div class="tags d-flex flex-wrap align-items-center gap-2">
        <span class="d-flex align-items-center priority ${task.priority} ${isCompleted ? "opacity-100" : ""}">
            <span class="rounded-circle me-1 bg-${task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "success"}" style="width:8px; height:8px;"></span>
            ${task.priority.toUpperCase()}
        </span>

        ${isCompleted
                ? `
        <span class="badge d-flex align-items-center gap-1 rounded-pill px-2 py-2" style="background-color: #d1fae5; color: #065f46; font-size: 10px;">
            <i class="fa-solid fa-check"></i> DONE
        </span>`
                : ""}

        ${task.dueDate && dueStatus === "overdue" && !isCompleted ? `<span class="d-flex align-items-center priority overdue">OVERDUE</span>` : ""}
        ${task.dueDate && dueStatus === "soon" && !isCompleted ? `<span class="d-flex align-items-center priority due-soon">DUE SOON</span>` : ""}
    </div>

    <div class="meta-info d-flex align-items-center border-bottom gap-3 ${isCompleted ? "opacity-100" : ""}">
        ${task.dueDate
                ? `
        <div class="d-flex align-items-center gap-1 date">
            <i class="fa-regular fa-calendar"></i>
            <span>${this.formatDate(task.dueDate)}</span>
        </div>`
                : ""}
        <div class="d-flex align-items-center gap-1 createdat">
            <i class="fa-regular fa-clock"></i>
            <span>${this.timeAgo(task.createdAt)}</span>
        </div>
    </div>

    <div class="action-btns d-flex flex-wrap gap-3">
        ${task.status !== "todo"
                ? `
        <button onclick="taskManager.updateStatus(${actualIndex}, 'todo')" class="status-btn btn bgtodo d-flex align-items-baseline gap-1">
            <i class="fa-solid fa-rotate-left"></i> <span>To Do</span>
        </button>`
                : ""}

        ${task.status === "todo" || task.status === "completed"
                ? `
        <button onclick="taskManager.updateStatus(${actualIndex}, 'in-progress')" class="status-btn btn bgstart d-flex align-items-baseline gap-1">
            <i class="fa-solid fa-play"></i> <span>Start</span>
        </button>`
                : ""}

        ${task.status !== "completed"
                ? `
        <button onclick="taskManager.updateStatus(${actualIndex}, 'completed')" class="status-btn btn bgcomplete d-flex align-items-baseline gap-1">
            <i class="fa-solid fa-check"></i> <span>Complete</span>
        </button>`
                : ""}
    </div>
</div>
      `;
            container.appendChild(div);
        });
    }
    getPriorityClass(priority) {
        switch (priority) {
            case "high":
                return "text-danger";
            case "medium":
                return " text-primary ";
            case "low":
                return " text-success";
            default:
                return "text-secondary";
        }
    }
    timeAgo(date) {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return "Just now";
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }
    openEditModal(index) {
        const task = this.tasks[index];
        this.currentEditIndex = index;
        if (task) {
            document.getElementById("title").value = task.title;
            document.getElementById("description").value =
                task.description;
            document.getElementById("priority").value =
                task.priority;
            document.getElementById("dueDate").value =
                task.dueDate;
            const submitBtn = document.querySelector("#task-form button[type='submit']");
            if (submitBtn) {
                submitBtn.innerText = "Update";
                submitBtn.classList.remove("btn-primary");
                submitBtn.classList.add("btn-success");
            }
            const modalElement = document.getElementById("taskModal");
            if (modalElement) {
                const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        }
    }
    prepareForAdd() {
        this.currentEditIndex = null;
        const submitBtn = document.querySelector("#task-form button[type='submit']");
        if (submitBtn)
            submitBtn.innerText = "Add Task";
        document.getElementById("task-form").reset();
    }
}
const taskManager = new TaskManager();
const form = document.getElementById("task-form");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById("title").value,
        description: document.getElementById("description")
            .value,
        priority: document.getElementById("priority")
            .value,
        dueDate: document.getElementById("dueDate").value,
        createdAt: taskManager.currentEditIndex !== null
            ? taskManager.tasks[taskManager.currentEditIndex].createdAt
            : new Date().toISOString(),
        status: taskManager.currentEditIndex !== null
            ? taskManager.tasks[taskManager.currentEditIndex].status
            : "todo",
    };
    taskManager.addTask(taskData);
    form.reset();
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn)
        submitBtn.innerText = "Add Task";
    const modalElement = document.getElementById("taskModal");
    if (modalElement) {
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal)
            modal.hide();
    }
});
