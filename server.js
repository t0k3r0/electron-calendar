const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());

// Inicializar la base de datos SQLite
const db = new sqlite3.Database('notes.db', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS notes (
                date TEXT PRIMARY KEY,
                content TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla:', err);
            }
        });
    }
});

// Endpoint para obtener notas por fecha
app.get('/notes/:date', (req, res) => {
    const date = req.params.date;
    console.log(`Fetching notes for date: ${date}`);
    db.get('SELECT content FROM notes WHERE date = ?', [date], (err, row) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            res.status(500).send(err);
        } else {
            res.json({ notes: row ? JSON.parse(row.content) : [] });
        }
    });
});

// Endpoint para guardar notas
app.post('/notes', (req, res) => {
    const { date, notes } = req.body;
    console.log(`Saving notes for date: ${date}`);
    const content = JSON.stringify(notes);
    db.run('REPLACE INTO notes (date, content) VALUES (?, ?)', [date, content], (err) => {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            res.status(500).send(err);
        } else {
            res.status(200).send('Notas guardadas!');
        }
    });
});

// Endpoint para listar todas las fechas de las notas
app.get('/notes', (req, res) => {
    console.log('Listing all notes');
    db.all('SELECT date FROM notes', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            res.status(500).send(err);
        } else {
            res.json({ dates: rows.map(row => row.date) });
        }
    });
});

// Endpoint para listar todas las copias de seguridad
app.get('/backups', (req, res) => {
    console.log('Listing all backups');
    fs.readdir('./backups', (err, files) => {
        if (err) {
            console.error('Error al leer el directorio:', err);
            res.status(500).send(err);
            return;
        }
        const backups = files.filter(file => file.startsWith('notes_backup_'));
        res.json({ backups });
    });
});

// Endpoint para restaurar una copia de seguridad
app.post('/restore', (req, res) => {
    const { backup } = req.body;
    const backupPath = path.join('./backups', backup);

    console.log(`Restoring backup: ${backup}`);
    fs.copyFile(backupPath, 'notes.json', (err) => {
        if (err) {
            console.error('Error al restaurar la copia de seguridad:', err);
            res.status(500).send(err);
            return;
        }
        res.status(200).send('Copia de seguridad restaurada!');
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
