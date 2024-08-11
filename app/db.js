const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'schedule.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criar ou alterar a tabela para incluir a coluna status
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY,
    server_name TEXT,
    server_ip TEXT,
    username TEXT,
    password TEXT,
    power_on_time TEXT,
    power_off_time TEXT,
    status TEXT DEFAULT 'active'  -- Adiciona coluna status com valor padrão 'active'
  )`);
});

// Inserir ou atualizar um agendamento
exports.insertSchedule = async (id, server_name, server_ip, username, password, power_on_time, power_off_time) => {
  db.get("SELECT id FROM schedule WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao verificar agendamento existente:", err.message);
      return;
    }

    if (row) {
      const updateStmt = db.prepare('UPDATE schedule SET server_name = ?, server_ip = ?, username = ?, password = ?, power_on_time = ?, power_off_time = ?, status = ? WHERE id = ?');
      updateStmt.run(server_name, server_ip, username, password, power_on_time, power_off_time, 'active', id, function(err) {
        if (err) {
          console.error('Erro ao atualizar agendamento:', err.message);
        } else {
          console.log('Agendamento atualizado com sucesso.');
        }
        updateStmt.finalize();
      });
    } else {
      const insertStmt = db.prepare('INSERT INTO schedule (id, server_name, server_ip, username, password, power_on_time, power_off_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insertStmt.run(id, server_name, server_ip, username, password, power_on_time, power_off_time, 'active', function(err) {
        if (err) {
          console.error('Erro ao inserir agendamento:', err.message);
        } else {
          console.log('Agendamento inserido com sucesso.');
        }
        insertStmt.finalize();
      });
    }
  });
};

// Obter todos os agendamentos
exports.getSchedules = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM schedule ORDER BY id', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Deletar um agendamento
exports.deleteSchedule = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM schedule WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0); // Retorna true se algum registro foi deletado
      }
    });
  });
};
