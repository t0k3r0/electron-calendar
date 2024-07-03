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
    const anterioresContainer = document.getElementById("anteriores");
    let selectedDate = "";
    let events = [];

    // Funciones auxiliares
    function getMonthName(monthIndex) {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return months[monthIndex];
    }

    async function fetchEventsForDate(date) {
        const events = await window.electronAPI.fetchEventsForDate(date);
        return Array.isArray(events) ? events : [];
    }

    // Funciones para obtener las próximas y anteriores eventos del día
    function getNextEvents(events, limit = 5) {
        const currentDate = new Date();
        const sortedEvents = events.filter(event => new Date(event.date) >= currentDate).sort((a, b) => new Date(a.date) - new Date(b.date));
        return sortedEvents.slice(0, limit);
    }

    function getPreviousEvents(events, limit = 5) {
        const currentDate = new Date();
        const sortedEvents = events.filter(event => new Date(event.date) < currentDate).sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedEvents.slice(0, limit);
    }

    function updateNextPreviousEvents() {
        proximasContainer.innerHTML = "";
        anterioresContainer.innerHTML = "";
        const nextEvents = getNextEvents(events);
        const previousEvents = getPreviousEvents(events);

        nextEvents.forEach(event => {
            const li = document.createElement("li");
            li.textContent = `${event.title} - ${event.date}`;
            proximasContainer.appendChild(li);
        });

        previousEvents.forEach(event => {
            const li = document.createElement("li");
            li.textContent = `${event.title} - ${event.date}`;
            anterioresContainer.appendChild(li);
        });
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
                    const events = await fetchEventsForDate(date);
                    const eventsCount = events.length;
                    const eventsButton = document.createElement("button");
                    eventsButton.classList.add("events-button");
                    eventsButton.textContent = eventsCount;
                    dayElement.appendChild(eventsButton);
                    dayElement.addEventListener("click", async function (e) {
                        e.stopPropagation();
                        selectedDate = date;
                        document.getElementById("hour").value = "";
                        document.getElementById("event-title").value = "";
                        displayDayEvents(date);
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

    async function displayDayEvents(date) {
        const eventsList = document.getElementById("events-ul");
        eventsList.innerHTML = "";
        const events = await fetchEventsForDate(date);
        events.forEach(event => {
            const eventItem = document.createElement("li");
            eventItem.textContent = `${event.title} - ${event.date}`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", async function () {
                await deleteEventForDate(date, event.id);
                eventsList.removeChild(eventItem);
                updateCalendar();
            });
            const moreInfoButton = document.createElement("button");
            moreInfoButton.textContent = "+";
            moreInfoButton.classList.add("more-info-button");
            moreInfoButton.addEventListener("click", function () {
                alert(event.moreInfo);
            });
            eventItem.appendChild(deleteButton);
            eventItem.appendChild(moreInfoButton);
            eventsList.appendChild(eventItem);
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
        const eventTitle = document.getElementById("event-title").value;
        if (!eventTitle) {
            showNotification("El título del evento no puede estar vacío");
            return;
        }
        const event = {
            id: Date.now(),
            title: eventTitle,
            date: selectedDate,
            moreInfo: ""
        };
        const events = await fetchEventsForDate(selectedDate);
        events.push(event);
        await saveEventsForDate(selectedDate, events);
        displayDayEvents(selectedDate);
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
            completed: false,
            date: new Date().toISOString()
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
        updateNextPreviousTasks();
    }

    async function loadAllPendingTasks() {
        tareasPendientes = [];
        const notes = await fetchNotesForDate("tareasPendientes");
        notes.forEach(note => {
            const pendingTask = {
                id: note.id,
                text: note.text,
                moreInfo: note.moreInfo,
                completed: note.completed,
                date: note.date
            };
            if (!note.completed) {
                tareasPendientes.push(pendingTask);
            }
        });
        updatePendingTasks();
        updateNextPreviousTasks(); // Actualiza las tareas próximas y anteriores
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
