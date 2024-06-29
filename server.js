const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// Función para crear una copia de seguridad del archivo de notas
function crearCopiaDeSeguridad() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilename = `notes_backup_${timestamp}.json`;
    fs.copyFile('notes.json', backupFilename, (err) => {
        if (err) {
            console.error('Error al crear la copia de seguridad:', err);
        } else {
            console.log('Copia de seguridad creada:', backupFilename);
        }
    });
}

// Endpoint para obtener notas por fecha
app.get('/notes/:date', (req, res) => {
    const date = req.params.date;
    fs.readFile('notes.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const notes = JSON.parse(data);
        res.json({ notes: notes[date] || [] });
    });
});

// Endpoint para guardar notas
app.post('/notes', (req, res) => {
    const { date, notes } = req.body;
    fs.readFile('notes.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const allNotes = JSON.parse(data);

        // Crear una copia de seguridad antes de hacer cualquier cambio
        crearCopiaDeSeguridad();

        // Actualizar las notas y escribir en el archivo
        allNotes[date] = notes;
        fs.writeFile('notes.json', JSON.stringify(allNotes, null, 2), (err) => {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.status(200).send('Notas guardadas!');
        });
    });
});

// Endpoint para listar todas las copias de seguridad
app.get('/backups', (req, res) => {
    fs.readdir('.', (err, files) => {
        if (err) {
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
    const backupPath = path.join('.', backup);

    fs.copyFile(backupPath, 'notes.json', (err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.status(200).send('Copia de seguridad restaurada!');
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
