const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('notes.db', (err) => {
    if (err) {
        console.error('Could not open database', err);
    } else {
        console.log('Connected to database');
        db.run(`CREATE TABLE IF NOT EXISTS notes (
            date TEXT PRIMARY KEY,
            content TEXT
        )`);
    }
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

ipcMain.handle('fetch-notes-for-date', async (event, date) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT content FROM notes WHERE date = ?`, [date], (err, row) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const data = JSON.parse(row.content);
                    resolve(Array.isArray(data) ? data : []);
                } catch (error) {
                    resolve([]);
                }
            }
        });
    });
});

ipcMain.handle('save-notes-for-date', async (event, date, notes) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO notes (date, content) VALUES (?, ?)`, [date, JSON.stringify(notes)], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

ipcMain.handle('delete-note-for-date', async (event, date, noteId) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT content FROM notes WHERE date = ?`, [date], (err, row) => {
            if (err) {
                reject(err);
            } else {
                try {
                    let notes = JSON.parse(row.content);
                    notes = notes.filter(note => note.id !== noteId);
                    db.run(`INSERT OR REPLACE INTO notes (date, content) VALUES (?, ?)`, [date, JSON.stringify(notes)], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            }
        });
    });
});
