const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, server_name TEXT, server_ip TEXT, username TEXT, password TEXT, power_on_time TEXT, power_off_time TEXT)');
});

exports.insertSchedule = (server_name, server_ip, username, password, power_on_time, power_off_time) => {
  const stmt = db.prepare('INSERT INTO schedule (server_name, server_ip, username, password, power_on_time, power_off_time) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(server_name, server_ip, username, password, power_on_time, power_off_time);
  stmt.finalize();
};
