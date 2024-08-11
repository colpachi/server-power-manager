const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/schedule');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Abre o banco de dados
const dbPath = path.join(__dirname, 'data', 'schedule.db');
const db = new sqlite3.Database(dbPath);

app.use(bodyParser.json());

// Middleware para servir arquivos estáticos na pasta "views"
app.use(express.static(path.join(__dirname, '../views')));

// Rota para renderizar o arquivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Rota para buscar os agendamentos
app.get('/schedules', (req, res) => {
  db.all('SELECT * FROM schedule', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ schedules: rows });
  });
});

// Rota para agendar operações
app.use('/schedule', scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});