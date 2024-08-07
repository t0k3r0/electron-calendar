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
    const proximasContainer = document.getElementById("proximas");
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
        notes.sort((a, b) => {
            if (a.hour < b.hour) return -1;
            if (a.hour > b.hour) return 1;
            return 0;
        });
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

    function closePopup() {
        popupOverlay.classList.remove("visible");
    }

    closePopupButton.addEventListener("click", function () {
        closePopup();
    });

    saveTimeButton.addEventListener("click", async function () {
        const hour = document.getElementById("hour").value;
        const noteText = document.getElementById("note-text").value;
        if (!hour) {
            showNotification("El campo de hora no puede estar vacío.");
            return;
        }
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
                const li = createTaskElement(task);
                sortableList.appendChild(li);
            }
        });

        initializeSortable();
    }

    function createTaskElement(task) {
        const li = document.createElement("li");
        li.classList.add("ui-state-default");
        li.textContent = task.text;
        li.id = task.id;

        const moreInfoSpan = createMoreInfoSpan(task, li);
        li.appendChild(moreInfoSpan);

        return li;
    }

    function createMoreInfoSpan(task, li) {
        const moreInfoSpan = document.createElement("span");
        moreInfoSpan.textContent = " + ";
        moreInfoSpan.classList.add("more-info-span");
        moreInfoSpan.style.cursor = "pointer";
        moreInfoSpan.id = "moreInfoSpan_" + task.id;
    
        moreInfoSpan.addEventListener("click", () => {
            const moreInfoDivId = "moreInfo_" + task.id;
            const editCampoMoreInfoId = "editCampo_" + task.id;
            const saveButtonId = "saveButton_" + task.id;
            const editMoreInfoLinkId = "editMoreInfoLink_" + task.id;
    
            const moreInfoDiv = document.getElementById(moreInfoDivId);
            const editMoreInfoLink = document.getElementById(editMoreInfoLinkId);
            
            if (moreInfoDiv && li.contains(moreInfoDiv)) {
                li.removeChild(moreInfoDiv);
                if (editMoreInfoLink) {
                    li.removeChild(editMoreInfoLink);
                }
                removeEditField(li, editCampoMoreInfoId, saveButtonId);
            } else {
                const newMoreInfoDiv = createMoreInfoDiv(task, moreInfoDivId);
                li.appendChild(newMoreInfoDiv);
    
                const newEditMoreInfoLink = document.createElement("span");
                newEditMoreInfoLink.textContent = "editar";
                newEditMoreInfoLink.classList.add("edit-more-info-span");
                newEditMoreInfoLink.style.cursor = "pointer";
                newEditMoreInfoLink.id = editMoreInfoLinkId;
                newEditMoreInfoLink.addEventListener("click", () => {
                    displayEditField(task, li, editCampoMoreInfoId, saveButtonId);
                    li.removeChild(newEditMoreInfoLink);
                });
                li.appendChild(newEditMoreInfoLink);
            }
        });
    
        return moreInfoSpan;
    }
    
    function createMoreInfoDiv(task, moreInfoDivId) {
        const moreInfoDiv = document.createElement("div");
        moreInfoDiv.textContent = task.moreInfo;
        moreInfoDiv.id = moreInfoDivId;
        moreInfoDiv.style.display = "block";
        return moreInfoDiv;
    }
    
    function displayEditField(task, li, editCampoMoreInfoId, saveButtonId) {
        const moreInfoDiv = document.getElementById("moreInfo_" + task.id);
        if (moreInfoDiv && li.contains(moreInfoDiv)) {
            li.removeChild(moreInfoDiv);
        }
    
        const editCampoMoreInfo = document.createElement("textarea");
        editCampoMoreInfo.value = task.moreInfo;
        editCampoMoreInfo.id = editCampoMoreInfoId;
        editCampoMoreInfo.style.width = "100%";
        editCampoMoreInfo.style.height = "100px";
        editCampoMoreInfo.style.display = "block";
        li.appendChild(editCampoMoreInfo);
    
        const saveButton = createSaveButton(task, li, editCampoMoreInfo, saveButtonId);
        li.appendChild(saveButton);
    }
    
    function createSaveButton(task, li, editCampoMoreInfo, saveButtonId) {
        const saveButton = document.createElement("button");
        saveButton.textContent = "Guardar";
        saveButton.id = saveButtonId;
        saveButton.style.display = "block";
    
        saveButton.addEventListener("click", () => {
            task.moreInfo = editCampoMoreInfo.value;
    
            const updatedMoreInfoDiv = document.createElement("div");
            updatedMoreInfoDiv.textContent = task.moreInfo;
            updatedMoreInfoDiv.id = "moreInfo_" + task.id;
            updatedMoreInfoDiv.style.display = "block";
    
            const existingMoreInfoDiv = document.getElementById("moreInfo_" + task.id);
            if (existingMoreInfoDiv) {
                li.replaceChild(updatedMoreInfoDiv, existingMoreInfoDiv);
            } else {
                li.appendChild(updatedMoreInfoDiv);
            }
    
            removeEditField(li, editCampoMoreInfo.id, saveButton.id);
            saveNotesForDate("tareasPendientes", tareasPendientes);
        });
    
        return saveButton;
    }
    
    function removeEditField(li, editCampoMoreInfoId, saveButtonId) {
        const editCampoMoreInfo = document.getElementById(editCampoMoreInfoId);
        if (editCampoMoreInfo && li.contains(editCampoMoreInfo)) {
            li.removeChild(editCampoMoreInfo);
        }
        const saveButton = document.getElementById(saveButtonId);
        if (saveButton && li.contains(saveButton)) {
            li.removeChild(saveButton);
        }
    }
    
    function initializeSortable() {
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

    async function getNextEvents() {
        const futureEvents = [];
        const today = new Date();
        let currentDate = new Date();
        
        while (futureEvents.length < 5) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const notes = await fetchNotesForDate(dateStr);
            notes.forEach(note => {
                futureEvents.push({
                    date: dateStr,
                    hour: note.hour,
                    text: note.text
                });
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return futureEvents.slice(0, 5);
    }

    async function updateNextEvents() {
        const events = await getNextEvents();
        proximasContainer.innerHTML = "";
        events.forEach(event => {
            const eventItem = document.createElement("div");
            eventItem.classList.add("event-item");
            eventItem.textContent = `${event.date} ${event.hour}: ${event.text}`;
            proximasContainer.appendChild(eventItem);
        });
    }

    async function initialize() {
        await generateMonthDays(currentMonth, currentYear);
        monthYearElement.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
        await loadAllPendingTasks();
        await updateNextEvents();
    }

    initialize();

    document.getElementById("prev-month").addEventListener("click", function () {
        changeMonth(-1);
    });
    document.getElementById("next-month").addEventListener("click", function () {
        changeMonth(1);
    });
    document.getElementById("prev-year").addEventListener("click", function () {
        changeMonth(-12);
    });
    document.getElementById("next-year").addEventListener("click", function () {
        changeMonth(12);
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
        await updateNextEvents();
    }
});
