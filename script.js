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
        pendingTasksContainer.innerHTML = "";
        tareasPendientes.forEach(task => {
            if (!task.completed) {
                const li = document.createElement("li");
                li.classList.add("ui-state-default");
                li.textContent = task.text;
                li.id = task.id; // Añadir id para identificar la tarea

                const moreInfoSpan = document.createElement("span");
                moreInfoSpan.textContent = " + ";
                moreInfoSpan.classList.add("more-info-span");
                moreInfoSpan.style.cursor = "pointer";
                moreInfoSpan.id = "moreInfoId";
                let moreInfoVisible = false;
                let editVisible = false;
                moreInfoSpan.addEventListener("click", function () {
                    if (editVisible) {
                        const editCampoMoreInfo = document.getElementById("editCampoId");
                        if (editCampoMoreInfo) {
                            li.removeChild(editCampoMoreInfo);
                        }
                        const saveButton = document.getElementById("saveButton");
                        if (saveButton) {
                            li.removeChild(saveButton);
                        }
                        const updatedMoreInfo = document.createElement("div");
                        updatedMoreInfo.textContent = task.moreInfo;
                        updatedMoreInfo.id = "moreInfo";
                        updatedMoreInfo.style.display = "block";
                        li.appendChild(updatedMoreInfo);
                        const editMoreInfoSpan = document.createElement("span");
                        editMoreInfoSpan.textContent = "editar";
                        editMoreInfoSpan.classList.add("edit-more-info-span");
                        editMoreInfoSpan.style.cursor = "pointer";
                        editMoreInfoSpan.id = "editMoreInfoSpan";
                        editMoreInfoSpan.addEventListener("click", function () {
                            if (!editVisible) {
                                const campoMoreInfo = document.getElementById("moreInfo");
                                if (campoMoreInfo) {
                                    li.removeChild(campoMoreInfo);
                                }
                                const editCampoMoreInfo = document.createElement("textarea");
                                editCampoMoreInfo.value = task.moreInfo;
                                editCampoMoreInfo.id = "editCampoId";
                                editCampoMoreInfo.style.width = "100%";
                                editCampoMoreInfo.style.height = "100px";
                                editCampoMoreInfo.style.display = "block";
                                li.appendChild(editCampoMoreInfo);
                                const saveButton = document.createElement("button");
                                saveButton.textContent = "Guardar";
                                saveButton.id = "saveButton";
                                saveButton.style.display = "block";
                                saveButton.addEventListener("click", function () {
                                    task.moreInfo = editCampoMoreInfo.value;
                                    const updatedMoreInfo = document.createElement("div");
                                    updatedMoreInfo.textContent = task.moreInfo;
                                    updatedMoreInfo.id = "moreInfo";
                                    updatedMoreInfo.style.display = "block";
                                    li.appendChild(updatedMoreInfo);
                                    li.removeChild(editCampoMoreInfo);
                                    li.removeChild(saveButton);
                                    li.appendChild(editMoreInfoSpan);
                                    editVisible = false;
                                    moreInfoVisible = true;
                                    saveNotesForDate("tareasPendientes", tareasPendientes);

                                });
                                li.appendChild(saveButton);
                                editVisible = true;
                            }
                        });
                        li.appendChild(editMoreInfoSpan);
                        editVisible = false;
                        moreInfoVisible = true;
                    } else if (moreInfoVisible) {
                        const campoMoreInfo = document.getElementById("moreInfo");
                        if (campoMoreInfo) {
                            li.removeChild(campoMoreInfo);
                        }
                        const editMoreInfoSpan = document.getElementById("editMoreInfoSpan");
                        if (editMoreInfoSpan) {
                            li.removeChild(editMoreInfoSpan);
                        }
                        moreInfoVisible = false;
                    } else {
                        const campoMoreInfo = document.createElement("div");
                        campoMoreInfo.textContent = task.moreInfo;
                        campoMoreInfo.id = "moreInfo";
                        campoMoreInfo.style.display = "block";
                        li.appendChild(campoMoreInfo);
                        const editMoreInfoSpan = document.createElement("span");
                        editMoreInfoSpan.textContent = "editar";
                        editMoreInfoSpan.classList.add("edit-more-info-span");
                        editMoreInfoSpan.style.cursor = "pointer";
                        editMoreInfoSpan.id = "editMoreInfoSpan";
                        editMoreInfoSpan.addEventListener("click", function () {
                            if (!editVisible) {
                                const campoMoreInfo = document.getElementById("moreInfo");
                                if (campoMoreInfo) {
                                    li.removeChild(campoMoreInfo);
                                }
                                const editCampoMoreInfo = document.createElement("textarea");
                                editCampoMoreInfo.value = task.moreInfo;
                                editCampoMoreInfo.id = "editCampoId";
                                editCampoMoreInfo.style.width = "100%";
                                editCampoMoreInfo.style.height = "100px";
                                editCampoMoreInfo.style.display = "block";
                                li.appendChild(editCampoMoreInfo);
                                const editMoreInfoSpan = document.getElementById("editMoreInfoSpan");
                                if (editMoreInfoSpan) {
                                    li.removeChild(editMoreInfoSpan);
                                    moreInfoVisible = false;
                                }
                                const saveButton = document.createElement("button");
                                saveButton.textContent = "Guardar";
                                saveButton.id = "saveButton";
                                saveButton.style.display = "block";
                                saveButton.addEventListener("click", function () {
                                    task.moreInfo = editCampoMoreInfo.value;
                                    const updatedMoreInfo = document.createElement("div");
                                    updatedMoreInfo.textContent = task.moreInfo;
                                    updatedMoreInfo.id = "moreInfo";
                                    updatedMoreInfo.style.display = "block";
                                    li.appendChild(updatedMoreInfo);
                                    li.removeChild(editCampoMoreInfo);
                                    li.removeChild(saveButton);
                                    li.appendChild(editMoreInfoSpan);
                                    editVisible = false;
                                    moreInfoVisible = true;
                                    saveNotesForDate("tareasPendientes", tareasPendientes);

                                });
                                li.appendChild(saveButton);
                                editVisible = true;
                            }
                        });
                        li.appendChild(editMoreInfoSpan);
                        moreInfoVisible = true;
                    }
                });
                li.appendChild(moreInfoSpan);
                // li.appendChild(createDeleteButton(task));

                sortableList.appendChild(li);
            }
        });
        $(function () {
            $("#sortable").sortable({
                update: function (event, ui) {
                    updateTaskOrder();
                }
            });
            $("#sortable").disableSelection();
        });
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
