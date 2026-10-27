/* =========================================
   STUDYMATE - JAVASCRIPT
   ========================================= */

"use strict";

/* =========================================
   1. ELEMEN TUGAS
========================================= */

const taskForm = document.getElementById("taskForm");
const taskModalElement = document.getElementById("taskModal");
const taskModalTitle = document.getElementById("taskModalTitle");

const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskSubjectInput = document.getElementById("taskSubject");
const taskDeadlineInput = document.getElementById("taskDeadline");
const taskPriorityInput = document.getElementById("taskPriority");

const taskList = document.getElementById("taskList");
const searchTaskInput = document.getElementById("searchTask");
const filterStatusInput = document.getElementById("filterStatus");
const filterPriorityInput = document.getElementById("filterPriority");

const saveTaskButton = document.getElementById("saveTaskButton");


/* =========================================
   2. PENYIMPANAN TUGAS
========================================= */

const STORAGE_KEY = "studymate_tasks_v1";

let tasks = loadTasks();

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter((task) => {
            return (
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.subject === "string" &&
                typeof task.deadline === "string" &&
                ["high", "medium", "low"].includes(task.priority) &&
                typeof task.completed === "boolean"
            );
        });

    } catch (error) {
        console.error("Gagal membaca data tugas:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;

    } catch (error) {
        console.error("Gagal menyimpan data tugas:", error);

        alert(
            "Data gagal disimpan di browser. Periksa penyimpanan browser."
        );

        return false;
    }
}


/* =========================================
   3. FUNGSI BANTUAN
========================================= */

function createId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
    const parts = dateString.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}

function formatDate(dateString) {
    const date = parseLocalDate(dateString);

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getDaysUntilDeadline(deadline) {
    const today = parseLocalDate(
        getLocalDateString()
    );

    const target = parseLocalDate(deadline);

    return Math.round(
        (target - today) / 86400000
    );
}

function getDeadlineLabel(deadline) {
    const difference = getDaysUntilDeadline(deadline);

    if (difference < 0) {
        return `Terlambat ${Math.abs(difference)} hari`;
    }

    if (difference === 0) {
        return "Deadline hari ini";
    }

    if (difference === 1) {
        return "Deadline besok";
    }

    return formatDate(deadline);
}


/* =========================================
   4. PRIORITAS TUGAS
========================================= */

function getPriorityLabel(priority) {
    const labels = {
        high: "Tinggi",
        medium: "Sedang",
        low: "Rendah"
    };

    return labels[priority] || "Sedang";
}


/* =========================================
   5. MENAMPILKAN TUGAS
========================================= */

function renderTasks() {

    const keyword =
        searchTaskInput.value.trim().toLowerCase();

    const statusFilter =
        filterStatusInput.value;

    const priorityFilter =
        filterPriorityInput.value;

    const filteredTasks = tasks
        .filter((task) => {

            const matchesSearch =
                task.title.toLowerCase().includes(keyword) ||
                task.subject.toLowerCase().includes(keyword);

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "completed" && task.completed) ||
                (statusFilter === "pending" && !task.completed);

            const matchesPriority =
                priorityFilter === "all" ||
                task.priority === priorityFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        })

        .sort((a, b) => {

            if (a.completed !== b.completed) {
                return Number(a.completed) - Number(b.completed);
            }

            return a.deadline.localeCompare(b.deadline);
        });


    if (filteredTasks.length === 0) {

        const hasTasks = tasks.length > 0;

        taskList.innerHTML = `
            <div class="empty-state">
                <i class="bi ${
                    hasTasks
                        ? "bi-search"
                        : "bi-journal-plus"
                }"></i>

                <h3>
                    ${
                        hasTasks
                            ? "Tugas tidak ditemukan"
                            : "Siap memulai?"
                    }
                </h3>

                <p>
                    ${
                        hasTasks
                            ? "Coba ubah kata kunci atau filter pencarianmu."
                            : "Tambahkan tugas pertamamu untuk mengisi daftar ini."
                    }
                </p>
            </div>
        `;

    } else {

        taskList.innerHTML = filteredTasks
            .map((task) => {

                const completedClass =
                    task.completed
                        ? "is-completed"
                        : "";

                const statusClass =
                    task.completed
                        ? "status-completed"
                        : "status-pending";

                const statusLabel =
                    task.completed
                        ? "Selesai"
                        : "Belum selesai";

                const deadlineDifference =
                    getDaysUntilDeadline(task.deadline);

                const deadlineClass =
                    !task.completed &&
                    deadlineDifference < 0
                        ? "text-danger"
                        : "";

                return `
                    <article class="task-card ${completedClass}">

                        <input
                            type="checkbox"
                            class="task-checkbox"
                            data-action="toggle"
                            data-id="${escapeHTML(task.id)}"
                            aria-label="Tandai ${escapeHTML(task.title)} selesai"
                            ${task.completed ? "checked" : ""}
                        >

                        <div class="task-main">

                            <h3 class="task-title">
                                ${escapeHTML(task.title)}
                            </h3>

                            <p class="task-subject">
                                <i class="bi bi-book me-1"></i>
                                ${escapeHTML(task.subject)}
                            </p>

                            <div class="task-meta">

                                <span class="${deadlineClass}">
                                    <i class="bi bi-calendar-event"></i>
                                    ${escapeHTML(
                                        getDeadlineLabel(task.deadline)
                                    )}
                                </span>

                                <span class="priority-badge priority-${task.priority}">
                                    ${getPriorityLabel(task.priority)}
                                </span>

                                <span class="status-badge ${statusClass}">
                                    ${statusLabel}
                                </span>

                            </div>

                        </div>

                        <div class="task-actions">

                            <button
                                type="button"
                                class="task-action-btn"
                                data-action="edit"
                                data-id="${escapeHTML(task.id)}"
                                title="Edit tugas"
                            >
                                <i class="bi bi-pencil"></i>
                            </button>

                            <button
                                type="button"
                                class="task-action-btn delete-btn"
                                data-action="delete"
                                data-id="${escapeHTML(task.id)}"
                                title="Hapus tugas"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");
    }


    document.getElementById("taskResultCount").textContent =
        `Menampilkan ${filteredTasks.length} dari ${tasks.length} tugas.`;

    updateDashboard();

    function updateDeadlineAlert() {

    const alertBox =
        document.getElementById("deadlineAlert");

    const alertTitle =
        document.getElementById("deadlineAlertTitle");

    const alertMessage =
        document.getElementById("deadlineAlertMessage");

    if (!alertBox || !alertTitle || !alertMessage) {
        return;
    }

    const upcomingTasks =
        tasks.filter((task) => {

            if (task.completed) {
                return false;
            }

            const difference =
                getDaysUntilDeadline(task.deadline);

            return difference >= 0 && difference <= 3;
        });

    const overdueTasks =
        tasks.filter((task) => {

            if (task.completed) {
                return false;
            }

            return getDaysUntilDeadline(task.deadline) < 0;
        });


    if (overdueTasks.length > 0) {

        alertBox.classList.add("danger");

        alertTitle.textContent =
            `${overdueTasks.length} tugas terlambat`;

        alertMessage.textContent =
            "Segera periksa dan selesaikan tugas yang melewati deadline.";

    } else if (upcomingTasks.length > 0) {

        alertBox.classList.remove("danger");

        alertTitle.textContent =
            `${upcomingTasks.length} tugas memiliki deadline terdekat`;

        alertMessage.textContent =
            "Yuk prioritaskan tugas yang harus segera diselesaikan.";

    } else {

        alertBox.classList.remove("danger");

        alertTitle.textContent =
            "Tidak ada deadline terdekat";

        alertMessage.textContent =
            "Semua tugasmu masih aman. Tetap pertahankan progresmu!";
    }
}
}


/* =========================================
   6. DASHBOARD
========================================= */

function updateDashboard() {

    const total = tasks.length;

    const completed =
        tasks.filter((task) => task.completed).length;

    const pending = total - completed;

    const upcoming =
        tasks.filter((task) => {

            if (task.completed) {
                return false;
            }

            const difference =
                getDaysUntilDeadline(task.deadline);

            return (
                difference >= 0 &&
                difference <= 3
            );

        }).length;


    document.getElementById("totalTasks").textContent =
        total;

    document.getElementById("pendingTasks").textContent =
        pending;

    document.getElementById("completedTasks").textContent =
        completed;

    document.getElementById("upcomingTasks").textContent =
        upcoming;

    updateDeadlineAlert();

    document.getElementById("sidebarTaskCount").textContent =
        pending;


    const percentage =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);


    document.getElementById("progressPercentage").textContent =
        `${percentage}%`;

    document.getElementById("taskProgressFill").style.width =
        `${percentage}%`;

    const progressBar =
        document.getElementById("taskProgressBar");

    progressBar.setAttribute(
        "aria-valuenow",
        percentage
    );

    progressBar.setAttribute(
        "aria-valuetext",
        `${percentage}% tugas telah selesai`
    );


    document.getElementById("progressCompleted").textContent =
        `${completed} tugas selesai`;

    document.getElementById("progressRemaining").textContent =
        `${pending} tugas tersisa`;


    let message =
        "Mulai dari satu tugas kecil hari ini.";

    if (total > 0 && percentage === 100) {

        message =
            "Hebat! Semua tugasmu sudah selesai. Pertahankan!";

    } else if (percentage >= 75) {

        message =
            "Sedikit lagi! Kamu sudah hampir menyelesaikan semuanya.";

    } else if (percentage >= 40) {

        message =
            "Kerja bagus! Teruskan progres belajarmu.";

    } else if (completed > 0) {

        message =
            "Satu per satu tugas terselesaikan. Terus semangat!";
    }


    document.getElementById("progressMessage").innerHTML = `
        <i class="bi bi-stars me-2"></i>
        ${escapeHTML(message)}
    `;
}


/* =========================================
   7. FORM TUGAS
========================================= */

function resetTaskForm() {

    taskForm.reset();

    taskIdInput.value = "";

    taskPriorityInput.value =
        "medium";

    taskDeadlineInput.value = "";

    taskTitleInput.classList.remove(
        "is-invalid"
    );

    taskSubjectInput.classList.remove(
        "is-invalid"
    );

    taskDeadlineInput.classList.remove(
        "is-invalid"
    );

    taskModalTitle.textContent =
        "Tambah Tugas Baru";

    saveTaskButton.innerHTML = `
        <i class="bi bi-check-lg me-1"></i>
        Simpan Tugas
    `;
}


taskForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const title =
            taskTitleInput.value.trim();

        const subject =
            taskSubjectInput.value.trim();

        const deadline =
            taskDeadlineInput.value;

        const priority =
            taskPriorityInput.value;

        const id =
            taskIdInput.value;


        taskTitleInput.classList.toggle(
            "is-invalid",
            !title
        );

        taskSubjectInput.classList.toggle(
            "is-invalid",
            !subject
        );

        taskDeadlineInput.classList.toggle(
            "is-invalid",
            !deadline
        );


        if (!title || !subject || !deadline) {
            return;
        }


        if (
            !["high", "medium", "low"]
                .includes(priority)
        ) {
            alert("Pilih prioritas yang valid.");
            return;
        }


        if (id) {

            const taskIndex =
                tasks.findIndex(
                    (task) => task.id === id
                );

            if (taskIndex === -1) {
                alert("Tugas tidak ditemukan.");
                return;
            }


            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                subject,
                deadline,
                priority
            };

        } else {

            tasks.push({
                id: createId(),
                title,
                subject,
                deadline,
                priority,
                completed: false,
                createdAt: new Date().toISOString()
            });
        }


        if (!saveTasks()) {
            return;
        }

        renderTasks();

        bootstrap.Modal
            .getOrCreateInstance(taskModalElement)
            .hide();
    }
);


/* =========================================
   8. TOMBOL TAMBAH TUGAS
========================================= */

function openAddTaskModal() {
    resetTaskForm();
}

document
    .getElementById("headerAddTask")
    .addEventListener(
        "click",
        openAddTaskModal
    );

document
    .getElementById("sectionAddTask")
    .addEventListener(
        "click",
        openAddTaskModal
    );


taskModalElement.addEventListener(
    "hidden.bs.modal",
    function () {
        resetTaskForm();
    }
);


/* =========================================
   9. EDIT / HAPUS / SELESAI TUGAS
========================================= */

taskList.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;


        if (action === "edit") {
            editTask(id);
        }

        if (action === "delete") {
            deleteTask(id);
        }
    }
);


taskList.addEventListener(
    "change",
    function (event) {

        const checkbox =
            event.target.closest(
                'input[data-action="toggle"]'
            );

        if (!checkbox) {
            return;
        }

        toggleTaskStatus(
            checkbox.dataset.id,
            checkbox.checked
        );
    }
);


function toggleTaskStatus(id, completed) {

    const task =
        tasks.find(
            (item) => item.id === id
        );

    if (!task) {
        return;
    }

    task.completed = completed;

    saveTasks();

    renderTasks();
}


function editTask(id) {

    const task =
        tasks.find(
            (item) => item.id === id
        );

    if (!task) {
        alert("Tugas tidak ditemukan.");
        return;
    }


    resetTaskForm();

    taskIdInput.value =
        task.id;

    taskTitleInput.value =
        task.title;

    taskSubjectInput.value =
        task.subject;

    taskDeadlineInput.value =
        task.deadline;

    taskPriorityInput.value =
        task.priority;


    taskModalTitle.textContent =
        "Edit Tugas";

    saveTaskButton.innerHTML = `
        <i class="bi bi-check-lg me-1"></i>
        Simpan Perubahan
    `;


    bootstrap.Modal
        .getOrCreateInstance(taskModalElement)
        .show();
}


function deleteTask(id) {

    const task =
        tasks.find(
            (item) => item.id === id
        );

    if (!task) {
        return;
    }


    const confirmed =
        window.confirm(
            `Yakin ingin menghapus tugas "${task.title}"?`
        );

    if (!confirmed) {
        return;
    }


    tasks =
        tasks.filter(
            (item) => item.id !== id
        );

    saveTasks();

    renderTasks();
}


/* =========================================
   10. SEARCH & FILTER
========================================= */

searchTaskInput.addEventListener(
    "input",
    renderTasks
);

filterStatusInput.addEventListener(
    "change",
    renderTasks
);

filterPriorityInput.addEventListener(
    "change",
    renderTasks
);


/* =========================================
   11. NAVIGASI
========================================= */

document
    .querySelectorAll(".sidebar-nav .nav-link")
    .forEach((link) => {

        link.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".sidebar-nav .nav-link"
                    )
                    .forEach((item) => {
                        item.classList.remove(
                            "active"
                        );
                    });


                document
                    .querySelectorAll(
                        `.sidebar-nav .nav-link[href="${this.getAttribute("href")}"]`
                    )
                    .forEach((item) => {
                        item.classList.add(
                            "active"
                        );
                    });


                const mobileMenu =
                    document.getElementById(
                        "mobileMenu"
                    );

                if (
                    mobileMenu &&
                    mobileMenu.classList.contains("show")
                ) {
                    bootstrap.Offcanvas
                        .getOrCreateInstance(
                            mobileMenu
                        )
                        .hide();
                }
            }
        );
    });


/* =========================================
   12. TANGGAL & TAHUN
========================================= */

function updateDateDisplay() {

    const now = new Date();

    document.getElementById(
        "currentDate"
    ).textContent =
        now.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    document.getElementById(
        "currentYear"
    ).textContent =
        now.getFullYear();
}


/* =========================================
   13. AGENDA MINGGUAN
========================================= */

const scheduleForm =
    document.getElementById(
        "scheduleForm"
    );

const scheduleModalElement =
    document.getElementById(
        "scheduleModal"
    );

const scheduleModalTitle =
    document.getElementById(
        "scheduleModalTitle"
    );

const scheduleIdInput =
    document.getElementById(
        "scheduleId"
    );

const scheduleDayInput =
    document.getElementById(
        "scheduleDay"
    );

const scheduleStartInput =
    document.getElementById(
        "scheduleStart"
    );

const scheduleEndInput =
    document.getElementById(
        "scheduleEnd"
    );

const scheduleTitleInput =
    document.getElementById(
        "scheduleTitleInput"
    );

const scheduleDescriptionInput =
    document.getElementById(
        "scheduleDescription"
    );

const scheduleList =
    document.getElementById(
        "scheduleList"
    );

const scheduleEmpty =
    document.getElementById(
        "scheduleEmpty"
    );

const saveScheduleButton =
    document.getElementById(
        "saveScheduleButton"
    );

const SCHEDULE_STORAGE_KEY =
    "studymate_schedule_v1";

let schedules =
    loadSchedules();


/* =========================================
   14. PENYIMPANAN AGENDA
========================================= */

function loadSchedules() {

    try {

        const saved =
            localStorage.getItem(
                SCHEDULE_STORAGE_KEY
            );

        if (!saved) {
            return [];
        }

        const parsed =
            JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed;

    } catch (error) {

        console.error(
            "Gagal membaca agenda:",
            error
        );

        return [];
    }
}


function saveSchedules() {

    try {

        localStorage.setItem(
            SCHEDULE_STORAGE_KEY,
            JSON.stringify(schedules)
        );

        return true;

    } catch (error) {

        console.error(
            "Gagal menyimpan agenda:",
            error
        );

        alert(
            "Agenda gagal disimpan di browser."
        );

        return false;
    }
}


/* =========================================
   15. URUTAN HARI
========================================= */

const dayOrder = {
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
    minggu: 7
};


/* =========================================
   16. MENAMPILKAN AGENDA
========================================= */

function renderSchedules() {

    if (!scheduleList) {
        return;
    }


    if (schedules.length === 0) {

        scheduleList.innerHTML = "";

        if (scheduleEmpty) {
            scheduleEmpty.style.display = "block";
        }

        return;
    }


    if (scheduleEmpty) {
        scheduleEmpty.style.display = "none";
    }


    const sortedSchedules =
        [...schedules].sort((a, b) => {

            const dayDifference =
                dayOrder[a.day] -
                dayOrder[b.day];

            if (dayDifference !== 0) {
                return dayDifference;
            }

            return a.start.localeCompare(
                b.start
            );
        });


    scheduleList.innerHTML =
        sortedSchedules
            .map((schedule) => {

                return `
                    <article class="schedule-item">

                        <div class="schedule-detail">

                            <div>
                                <strong>
                                    ${escapeHTML(schedule.day)}
                                </strong>

                                <span>
                                    ${escapeHTML(schedule.start)}
                                    -
                                    ${escapeHTML(schedule.end)}
                                </span>
                            </div>

                            <h4>
                                ${escapeHTML(schedule.title)}
                            </h4>

                            ${
                                schedule.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                schedule.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="schedule-actions">

                            <button
                                type="button"
                                class="schedule-action-btn"
                                data-schedule-action="edit"
                                data-id="${escapeHTML(schedule.id)}"
                                title="Edit agenda"
                                aria-label="Edit agenda"
                            >
                                <i class="bi bi-pencil"></i>
                            </button>

                            <button
                                type="button"
                                class="schedule-action-btn delete"
                                data-schedule-action="delete"
                                data-id="${escapeHTML(schedule.id)}"
                                title="Hapus agenda"
                                aria-label="Hapus agenda"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");
}


/* =========================================
   17. RESET FORM AGENDA
========================================= */

function resetScheduleForm() {

    scheduleForm.reset();

    scheduleIdInput.value = "";

    scheduleModalTitle.textContent =
        "Tambah Agenda";

    saveScheduleButton.innerHTML = `
        <i class="bi bi-check-lg me-1"></i>
        Simpan Agenda
    `;

    scheduleStartInput.value = "";
    scheduleEndInput.value = "";
}


/* =========================================
   18. TOMBOL TAMBAH AGENDA
========================================= */

document
    .getElementById("addScheduleButton")
    .addEventListener(
        "click",
        function () {

            resetScheduleForm();

            bootstrap.Modal
                .getOrCreateInstance(
                    scheduleModalElement
                )
                .show();
        }
    );


/* =========================================
   19. SIMPAN AGENDA
========================================= */

scheduleForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const id =
            scheduleIdInput.value;

        const day =
            scheduleDayInput.value;

        const start =
            scheduleStartInput.value;

        const end =
            scheduleEndInput.value;

        const title =
            scheduleTitleInput.value.trim();

        const description =
            scheduleDescriptionInput.value.trim();


        if (
            !day ||
            !start ||
            !end ||
            !title
        ) {

            alert(
                "Silakan lengkapi data agenda."
            );

            return;
        }


        if (start >= end) {

            alert(
                "Jam selesai harus lebih besar dari jam mulai."
            );

            return;
        }


        if (id) {

            const index =
                schedules.findIndex(
                    (schedule) =>
                        schedule.id === id
                );

            if (index === -1) {

                alert(
                    "Agenda tidak ditemukan."
                );

                return;
            }


            schedules[index] = {
                ...schedules[index],
                day,
                start,
                end,
                title,
                description
            };

        } else {

            schedules.push({

                id: createId(),

                day,

                start,

                end,

                title,

                description,

                createdAt:
                    new Date().toISOString()
            });
        }


        if (!saveSchedules()) {
            return;
        }


        renderSchedules();


        bootstrap.Modal
            .getOrCreateInstance(
                scheduleModalElement
            )
            .hide();
    }
);


/* =========================================
   20. EDIT & HAPUS AGENDA
========================================= */

scheduleList.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "button[data-schedule-action]"
            );

        if (!button) {
            return;
        }


        const action =
            button.dataset.scheduleAction;

        const id =
            button.dataset.id;


        if (action === "edit") {
            editSchedule(id);
        }


        if (action === "delete") {
            deleteSchedule(id);
        }
    }
);


function editSchedule(id) {

    const schedule =
        schedules.find(
            (item) => item.id === id
        );

    if (!schedule) {

        alert(
            "Agenda tidak ditemukan."
        );

        return;
    }


    scheduleIdInput.value =
        schedule.id;

    scheduleDayInput.value =
        schedule.day;

    scheduleStartInput.value =
        schedule.start;

    scheduleEndInput.value =
        schedule.end;

    scheduleTitleInput.value =
        schedule.title;

    scheduleDescriptionInput.value =
        schedule.description || "";


    scheduleModalTitle.textContent =
        "Edit Agenda";

    saveScheduleButton.innerHTML = `
        <i class="bi bi-check-lg me-1"></i>
        Simpan Perubahan
    `;


    bootstrap.Modal
        .getOrCreateInstance(
            scheduleModalElement
        )
        .show();
}


function deleteSchedule(id) {

    const schedule =
        schedules.find(
            (item) => item.id === id
        );

    if (!schedule) {
        return;
    }


    const confirmed =
        window.confirm(
            `Yakin ingin menghapus agenda "${schedule.title}"?`
        );

    if (!confirmed) {
        return;
    }


    schedules =
        schedules.filter(
            (item) => item.id !== id
        );


    saveSchedules();

    renderSchedules();
}


/* =========================================
   21. RESET MODAL AGENDA
========================================= */

scheduleModalElement.addEventListener(
    "hidden.bs.modal",
    function () {
        resetScheduleForm();
    }
);

/* =========================================
   22. DARK MODE
========================================= */

const themeToggle =
    document.getElementById("themeToggle");

function updateThemeIcon() {

    if (!themeToggle) {
        return;
    }

    const icon =
        themeToggle.querySelector("i");

    if (document.body.classList.contains("dark-mode")) {

        icon.className =
            "bi bi-sun-fill";

        themeToggle.setAttribute(
            "aria-label",
            "Aktifkan mode terang"
        );

        themeToggle.setAttribute(
            "title",
            "Mode terang"
        );

    } else {

        icon.className =
            "bi bi-moon-stars-fill";

        themeToggle.setAttribute(
            "aria-label",
            "Aktifkan mode gelap"
        );

        themeToggle.setAttribute(
            "title",
            "Mode gelap"
        );
    }
}


function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDarkMode =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "studymate_theme",
        isDarkMode
            ? "dark"
            : "light"
    );

    updateThemeIcon();
}


function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "studymate_theme"
        );

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );
    }

    updateThemeIcon();
}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        toggleDarkMode
    );
}


/* =========================================
   23. INISIALISASI
========================================= */

function initStudyMate() {

    updateDateDisplay();

    renderTasks();

    renderSchedules();

    loadTheme();
}

initStudyMate();