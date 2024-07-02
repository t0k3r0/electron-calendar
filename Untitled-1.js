document.addEventListener("DOMContentLoaded", function () {
    // Variables globales y inicialización
    const weekdays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    const daysContainer = document.getElementById("days-container");
    const monthYearElement = document.getElementById("month-year");
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    const popupOverlay = document.getElementById("popup-overlay");
    const closePopupButton = document.getElementById("close-popup");
    const saveTimeButton = document.getElementById("save-time");
    const pendingTasksContainer = document.getElementById("pendientes");
    const taskInputOverlay = document.getElementById("task-input-overlay");
    const taskTextInput = document.getElementById("task-text");
    const addTaskButton = document.getElementById("add-task");
    const saveTaskButton = document.getElementById("save-task");
    const cancelTaskButton = document.getElementById("cancel-task");
    const sortableList = document.getElementById("sortable");
    let selectedDate = "";
    let tasks = {};
    let tareasPendientes = [];

    // Funciones auxiliares
    function getMonthName(monthIndex) {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return months[monthIndex];
    }

    async function fetchNotesForDate(date) {
        const notes = await window.electronAPI.fetchNotesForDate(date);
        return Array.isArray(notes) ? notes : [];
    }

    async function saveNotesForDate(date, notes) {
        await window.electronAPI.saveNotesForDate(date, notes);
    }

    async function deleteNoteForDate(date, noteId) {
        await window.electronAPI.deleteNoteForDate(date, noteId);
    }

    // Generación de los días del mes en el calendario
    async function generateMonthDays(month, year) {
        daysContainer.innerHTML = "";
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let dayOfMonth = 1;

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < startingDay) {
                    const emptyDay = document.createElement("div");
                    emptyDay.classList.add("empty");
                    daysContainer.appendChild(emptyDay);
                } else if (dayOfMonth > daysInMonth) {
                    const emptyDay = document.createElement("div");
                    emptyDay.classList.add("empty");
                    daysContainer.appendChild(emptyDay);
                } else {
                    const dayElement = document.createElement("div");
                    dayElement.classList.add("day");
                    dayElement.textContent = dayOfMonth;
                    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
                    const notes = await fetchNotesForDate(date);
                    const notesCount = notes.length;
                    const notesButton = document.createElement("button");
                    notesButton.classList.add("notes-button");
                    notesButton.textContent = notesCount;
                    dayElement.appendChild(notesButton);
                    dayElement.addEventListener("click", async function (e) {
                        e.stopPropagation();
                        selectedDate = date;
                        document.getElementById("hour").value = "";
                        document.getElementById("note-text").value = "";
                        displayDayNotes(date);
                        popupOverlay.classList.add("visible");
                    });

                    if (year === today.getFullYear() && month === today.getMonth() && dayOfMonth === today.getDate()) {
                        dayElement.classList.add("today");
                    }

                    daysContainer.appendChild(dayElement);
                    dayOfMonth++;
                }
            }
        }
    }

    async function displayDayNotes(date) {
        const notesList = document.getElementById("notes-ul");
        notesList.innerHTML = "";
        const notes = await fetchNotesForDate(date);
        notes.forEach(note => {
            const noteItem = document.createElement("li");
            noteItem.textContent = `${note.hour}: ${note.text}`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", async function () {
                await deleteNoteForDate(date, note.id);
                notesList.removeChild(noteItem);
                updateCalendar();
            });
            const moreInfoButton = document.createElement("button");
            moreInfoButton.textContent = "+";
            moreInfoButton.classList.add("more-info-button");
            moreInfoButton.addEventListener("click", function () {
                alert(note.moreInfo);
            });
            noteItem.appendChild(deleteButton);
            noteItem.appendChild(moreInfoButton);
            notesList.appendChild(noteItem);
        });
    }

    // Cerrar el popup
    function closePopup() {
        popupOverlay.classList.remove("visible");
    }

    closePopupButton.addEventListener("click", function () {
        closePopup();
    });

    saveTimeButton.addEventListener("click", async function () {
        const hour = document.getElementById("hour").value;
        const noteText = document.getElementById("note-text").value;
        if (!noteText) {
            showNotification("El campo de texto no puede estar vacío");
            return;
        }
        const note = {
            id: Date.now(),
            hour,
            text: noteText,
            moreInfo: ""
        };
        const notes = await fetchNotesForDate(selectedDate);
        notes.push(note);
        await saveNotesForDate(selectedDate, notes);
        displayDayNotes(selectedDate);
        updateCalendar();
    });

    function showNotification(message) {
        const notification = document.getElementById("notification");
        notification.textContent = message;
        notification.classList.remove("hidden");
        setTimeout(() => {
            notification.classList.add("hidden");
        }, 3000);
    }

    addTaskButton.addEventListener("click", function () {
        taskInputOverlay.classList.add("visible");
    });

    cancelTaskButton.addEventListener("click", function () {
        taskInputOverlay.classList.remove("visible");
    });

    saveTaskButton.addEventListener("click", async function () {
        const taskText = taskTextInput.value;
        if (!taskText) {
            alert("La descripción de la tarea no puede estar vacía.");
            return;
        }
        const task = {
            id: Date.now(),
            text: taskText,
            moreInfo: "",
            completed: false
        };
        tareasPendientes.push(task);
        taskTextInput.value = "";
        taskInputOverlay.classList.remove("visible");
        await saveNotesForDate("tareasPendientes", tareasPendientes);
        updatePendingTasks();
    });

    function updatePendingTasks() {
        sortableList.innerHTML = "";
        tareasPendientes.forEach(task => {
            const li = document.createElement("li");
            li.id = task.id;
            li.textContent = task.text;
            const moreInfoSpan = document.createElement("span");
            moreInfoSpan.textContent = " +";
            moreInfoSpan.style.cursor = "pointer";
            moreInfoSpan.addEventListener("click", function () {
                const moreInfo = document.createElement("div");
                moreInfo.textContent = task.moreInfo;
                moreInfo.id = "moreInfo";
                moreInfo.style.display = "block";
                const editMoreInfoSpan = document.createElement("span");
                editMoreInfoSpan.textContent = "editar";
                editMoreInfoSpan.style.cursor = "pointer";
                editMoreInfoSpan.addEventListener("click", function () {
                    const editCampoMoreInfo = document.createElement("textarea");
                    editCampoMoreInfo.value = task.moreInfo;
                    const saveButton = document.createElement("button");
                    saveButton.textContent = "Guardar";
                    saveButton.addEventListener("click", function () {
                        task.moreInfo = editCampoMoreInfo.value;
                        moreInfo.textContent = task.moreInfo;
                        saveNotesForDate("tareasPendientes", tareasPendientes);
                    });
                    moreInfo.appendChild(editCampoMoreInfo);
                    moreInfo.appendChild(saveButton);
                });
                li.appendChild(moreInfo);
                li.appendChild(editMoreInfoSpan);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", async function () {
                tareasPendientes = tareasPendientes.filter(item => item.id !== task.id);
                await saveNotesForDate("tareasPendientes", tareasPendientes);
                updatePendingTasks();
            });

            li.appendChild(moreInfoSpan);
            li.appendChild(deleteButton);
            sortableList.appendChild(li);
        });

        $("#sortable").sortable({
            update: function (event, ui) {
                updateTaskOrder();
            }
        });
        $("#sortable").disableSelection();
    }

    async function updateTaskOrder() {
        const orderedTasks = [];
        const lis = sortableList.getElementsByTagName("li");
        for (let i = 0; i < lis.length; i++) {
            const taskId = lis[i].id;
            const task = tareasPendientes.find(item => item.id === parseInt(taskId));
            if (task) {
                orderedTasks.push(task);
            }
        }
        tareasPendientes = orderedTasks;
        await saveNotesForDate("tareasPendientes", tareasPendientes);
    }

    async function loadAllPendingTasks() {
        tareasPendientes = [];
        const notes = await fetchNotesForDate("tareasPendientes");
        notes.forEach(note => {
            const pendingTask = {
                id: note.id,
                text: note.text,
                moreInfo: note.moreInfo,
                completed: note.completed
            };
            if (!note.completed) {
                tareasPendientes.push(pendingTask);
            }
        });
        updatePendingTasks();
    }

    async function initialize() {
        await generateMonthDays(currentMonth, currentYear);
        monthYearElement.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
        await loadAllPendingTasks();
    }

    initialize();

    document.getElementById("prev-month").addEventListener("click", function () {
        changeMonth(-1);
    });
    document.getElementById("next-month").addEventListener("click", function () {
        changeMonth(1);
    });

    function changeMonth(direction) {
        currentMonth += direction;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        initialize();
    }

    async function updateCalendar() {
        await generateMonthDays(currentMonth, currentYear);
        monthYearElement.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
    }
});
