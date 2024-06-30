document.addEventListener("DOMContentLoaded", function () {
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
    const moreInfoText = document.getElementById("more-info-text");
    const taskInputOverlay = document.getElementById("task-input-overlay");
    const taskTextInput = document.getElementById("task-text");
    const addTaskButton = document.getElementById("add-task");
    const saveTaskButton = document.getElementById("save-task");
    const cancelTaskButton = document.getElementById("cancel-task");
    const sortableList = document.getElementById("sortable");
    let selectedDate = "";
    let tasks = {};
    let tareasPendientes = [];
    function getMonthName(monthIndex) {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return months[monthIndex];
    }
    async function fetchNotesForDate(date) {
        const response = await fetch(`http://localhost:3000/notes/${date}`);
        const data = await response.json();
        return Array.isArray(data.notes) ? data.notes : [];
    }
    async function saveNotesForDate(date, newNote) {
        const notes = await fetchNotesForDate(date);
        notes.push(newNote);
        await fetch('http://localhost:3000/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, notes }),
        });
    }
    async function deleteNoteForDate(date, noteId) {
        let notes = await fetchNotesForDate(date);
        notes = notes.filter(note => note.id !== noteId);
        await fetch('http://localhost:3000/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, notes }),
        });
    }
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
            noteItem.textContent = `${note.hour}: ${note.text},`;
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
            showNotification("El campo de texto no puede estar vacío.");
            return;
        }
        const newNote = {
            id: Date.now(),
            hour: hour || "00:00",
            text: noteText,
            moreInfo: "",
            date: selectedDate,
        };
        if (!tasks[selectedDate]) {
            tasks[selectedDate] = [];
        }
        tasks[selectedDate].push(newNote);
        await saveNotesForDate(selectedDate, newNote);
        document.getElementById("hour").value = "";
        document.getElementById("note-text").value = "";
        displayDayNotes(selectedDate);
        updateCalendar();
    });
    addTaskButton.addEventListener("click", function () {
        taskTextInput.value = "";
        taskInputOverlay.classList.add("visible");
    });
    saveTaskButton.addEventListener("click", async function () {
        const taskText = taskTextInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                moreInfo: "",
                completed: false
            };
            await saveNotesForDate("tareasPendientes", newTask);
            tareasPendientes.push(newTask);
            updatePendingTasks();
            taskInputOverlay.classList.remove("visible");
        } else {
            showNotification("El campo de texto no puede estar vacío.");
        }
    });
    cancelTaskButton.addEventListener("click", function () {
        taskInputOverlay.classList.remove("visible");
    });
    function showNotification(message) {
        const notification = document.getElementById("notification");
        notification.textContent = message;
        notification.classList.remove("hidden");
        setTimeout(() => {
            notification.classList.add("hidden");
        }, 3000);
    }
    function updatePendingTasks() {
        pendingTasksContainer.innerHTML = "";
        tareasPendientes.forEach(task => {
            if (!task.completed) {
                const li = document.createElement("li");
                li.classList.add("ui-state-default");
                li.textContent = task.text;
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
                        // campoMoreInfo.innerHTML = task.moreInfo.replace(/\n/g, '<br>');
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
                                    saveNotesForDate("tareasPendientes", task);
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
                sortableList.appendChild(li);
                $(function () {
                    $("#sortable").sortable();
                    $("#sortable").disableSelection();
                });
            }
        });
    }
    async function loadAllPendingTasks() {
        tareasPendientes = [];
        const notes = await fetchNotesForDate("tareasPendientes");
        notes.forEach(note => {
            const pendingTask = {
                id: note.id,
                text: note.text,
                moreInfo: note.moreInfo,
                completed: note.completado
            };
            if (!note.completado) {
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
