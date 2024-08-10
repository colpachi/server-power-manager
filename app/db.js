const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Certifique-se de que o caminho está correto e o diretório 'data' existe
const dbPath = path.join(__dirname, 'data', 'schedule.db');

// Abre o banco de dados a partir de um arquivo
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, server_name TEXT, server_ip TEXT, username TEXT, password TEXT, power_on_time TEXT, power_off_time TEXT)');
});

exports.insertSchedule = (server_name, server_ip, username, password, power_on_time, power_off_time) => {
  const stmt = db.prepare('INSERT INTO schedule (server_name, server_ip, username, password, power_on_time, power_off_time) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(server_name, server_ip, username, password, power_on_time, power_off_time);
  stmt.finalize();
};