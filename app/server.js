const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/schedule');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cron = require('./cron');

const app = express();
const PORT = process.env.PORT || 5000;

const dbPath = path.join(__dirname, 'data', 'schedule.db');
const db = new sqlite3.Database(dbPath);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../views')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/schedules', (req, res) => {
  db.all('SELECT * FROM schedule', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ schedules: rows });
  });
});

app.use('/schedule', scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  cron.rescheduleTasks();
});