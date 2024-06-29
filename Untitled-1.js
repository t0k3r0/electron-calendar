const express = require('express');
const fs = require('fs');
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

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
