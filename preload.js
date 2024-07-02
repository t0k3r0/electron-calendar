const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    fetchNotesForDate: (date) => ipcRenderer.invoke('fetch-notes-for-date', date),
    saveNotesForDate: (date, notes) => ipcRenderer.invoke('save-notes-for-date', date, notes),
    deleteNoteForDate: (date, noteId) => ipcRenderer.invoke('delete-note-for-date', date, noteId),
});
