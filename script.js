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
    // async function fetchNotesForTasks() {
    //     const response = await fetch(`http://localhost:3000/notes/tareasPendientes`);
    //     const data = await response.json();
    //     return Array.isArray(data.notes) ? data.notes : [];
    // }
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
    // async function saveNotesForTask(newTask) {
    //     const tasks = await fetchNotesForTasks();
    //     tasks.push(newTask);
    //     await fetch('http://localhost:3000/notes', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ tasks }),
    //     });
    // }
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
    // async function deleteNoteForTask(noteId) {
    //     let notes = await fetchNotesForTasks();
    //     notes = notes.filter(note => note.id !== noteId);
    //     await fetch('http://localhost:3000/notes', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ notes }),
    //     });
    // }
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
                        // moreInfoText.value = "";
                        // moreInfoText.style.display = "block";
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
        // const moreInfo = moreInfoText.value;
        if (!noteText) {
            showNotification("El campo de texto no puede estar vacío.");
            return;
        }
        const newNote = {
            id: Date.now(),
            hour: hour || "00:00",
            text: noteText,
            moreInfo: moreInfo,
            date: selectedDate,
            // completed: false
        };
        if (!tasks[selectedDate]) {
            tasks[selectedDate] = [];
        }
        tasks[selectedDate].push(newNote);
        await saveNotesForDate(selectedDate, newNote);
        document.getElementById("hour").value = "";
        document.getElementById("note-text").value = "";
        // moreInfoText.value = "";
        displayDayNotes(selectedDate);
        updateCalendar();
    });

    addTaskButton.addEventListener("click", function () {
        taskTextInput.value = "";
        taskInputOverlay.classList.add("visible");
    });

    saveTaskButton.addEventListener("click", function () {
        const taskText = taskTextInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                // hour: "00:00",
                text: taskText,
                moreInfo: "",
                // date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                completed: false
            };
            saveNotesForDate("tareasPendientes", newTask);
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
                // Agregar la clase ui-state-default
                li.classList.add("ui-state-default");
                // Establecer el texto del li
                li.textContent = task.text;
                // Agregar el li a la lista
                const moreInfoSpan = document.createElement("span");
                moreInfoSpan.textContent = " + ";
                moreInfoSpan.classList.add("more-info-span");
                moreInfoSpan.style.cursor = "pointer";
                let moreInfoSpanVisible = false; // Bandera para controlar la visibilidad del campo de edición
                moreInfoSpan.addEventListener("click", function () {
                    if (!moreInfoSpanVisible) {
                        moreInfoSpan.style.display = 'block';
                        const campoMoreInfo = document.createElement("div");
                        campoMoreInfo.textContent = task.moreInfo;
                        li.appendChild(campoMoreInfo);
                        moreInfoSpanVisible = true;
                    } else {
                        moreInfoSpan.style.display = 'none';
                        li.removeChild(li.lastChild);
                        moreInfoSpanVisible = false;
                    }
                    const editMoreInfoSpan = document.createElement("span");
                    editMoreInfoSpan.textContent = "editar ";
                    editMoreInfoSpan.classList.add("edit-more-info-span");
                    editMoreInfoSpan.style.cursor = "pointer";
                    editMoreInfoSpan.addEventListener("click", function () {

                        const editCampoMoreInfo = document.createElement("textarea");
                        editCampoMoreInfo.value = task.moreInfo;
                        li.appendChild(editCampoMoreInfo);
                    });
                    li.appendChild(editMoreInfoSpan);
                });
                li.appendChild(moreInfoSpan);
                sortableList.appendChild(li);
                $(function () {
                    $("#sortable").sortable();
                    $("#sortable").disableSelection();
                });
                // const taskItem = document.createElement("div");
                // taskItem.classList.add("task-item");
                // const taskText = document.createElement("span");
                // taskText.textContent = `${task.date} - ${task.hour}: ${task.text}`;
                // taskItem.appendChild(taskText);

                // const deleteButton = document.createElement("button");
                // deleteButton.textContent = "X";
                // deleteButton.classList.add("delete-button");
                // deleteButton.addEventListener("click", function () {
                //     tareasPendientes = tareasPendientes.filter(t => t.id !== task.id);
                //     updatePendingTasks();
                // });
                // taskItem.appendChild(deleteButton);

                // const moreInfoButton = document.createElement("button");
                // moreInfoButton.textContent = "+";
                // moreInfoButton.classList.add("more-info-button");
                // moreInfoButton.addEventListener("click", function () {
                //     const moreInfoTextarea = document.createElement("textarea");
                //     moreInfoTextarea.value = task.moreInfo;
                //     moreInfoTextarea.classList.add("more-info-textarea");

                //     const saveInfoButton = document.createElement("button");
                //     saveInfoButton.textContent = "Guardar";
                //     saveInfoButton.classList.add("save-info-button");
                //     saveInfoButton.addEventListener("click", function () {
                //         task.moreInfo = moreInfoTextarea.value;
                //         taskItem.removeChild(moreInfoTextarea);
                //         taskItem.removeChild(saveInfoButton);
                //     });

                //     taskItem.appendChild(moreInfoTextarea);
                //     taskItem.appendChild(saveInfoButton);
                // });
                // const completedCheckbox = document.createElement("input");
                // completedCheckbox.type = "checkbox";
                // completedCheckbox.classList.add("completed-checkbox");
                // completedCheckbox.checked = task.completed;
                // completedCheckbox.addEventListener("change", function () {
                //     task.completed = completedCheckbox.checked;
                //     updatePendingTasks();
                // });
                // task.appendChild(completedCheckbox);
                // task.appendChild(moreInfoButton);
                // pendingTasksContainer.appendChild(task);
            }
        });
    }

    async function loadAllPendingTasks() {
        tareasPendientes = []; // Reiniciamos el array de tareas pendientes

        const notes = await fetchNotesForDate("tareasPendientes"); // Obtenemos todas las notas de tareas pendientes

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

        updatePendingTasks(); // Actualizamos la interfaz con las tareas pendientes cargadas
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
