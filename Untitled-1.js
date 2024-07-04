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
