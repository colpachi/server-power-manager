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
    days_of_week TEXT DEFAULT '',
    status TEXT DEFAULT 'active'  -- Adiciona coluna status com valor padrão 'active'
  )`);
});

// Adiciona coluna days_of_week se não existir (migration)
db.run(`ALTER TABLE schedule ADD COLUMN days_of_week TEXT DEFAULT ''`, () => {});

// Inserir ou atualizar um agendamento
exports.insertSchedule = async (id, server_name, server_ip, username, password, power_on_time, power_off_time, days_of_week) => {
  db.get("SELECT id FROM schedule WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao verificar agendamento existente:", err.message);
      return;
    }

    if (row) {
      const updateStmt = db.prepare('UPDATE schedule SET server_name = ?, server_ip = ?, username = ?, password = ?, power_on_time = ?, power_off_time = ?, days_of_week = ?, status = ? WHERE id = ?');
      updateStmt.run(server_name, server_ip, username, password, power_on_time, power_off_time, days_of_week, 'active', id, function(err) {
        if (err) {
          console.error('Erro ao atualizar agendamento:', err.message);
        } else {
          console.log('Agendamento atualizado com sucesso.');
        }
        updateStmt.finalize();
      });
    } else {
      const insertStmt = db.prepare('INSERT INTO schedule (id, server_name, server_ip, username, password, power_on_time, power_off_time, days_of_week, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      insertStmt.run(id, server_name, server_ip, username, password, power_on_time, power_off_time, days_of_week, 'active', function(err) {
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

// Atualizar status (active/paused)
exports.setScheduleStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE schedule SET status = ? WHERE id = ?', [status, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

// Resolve credenciais de um servidor pelo nome (usado por /power/*)
//
// A comparação é case-insensitive e ignora espaços nas pontas. O nome é digitado
// à mão no cadastro de agendamento, mas é usado como CHAVE por serviços externos
// (o deploy gateway do cmd-flow pede "t630"; o cadastro gravou "T630"). Com o `=`
// cru do SQLite — case-sensitive, pois a coluna não tem COLLATE NOCASE — essa
// diferença de caixa fazia o /power/status devolver 400 "Provide server..." como
// se o parâmetro estivesse faltando, derrubando o deploy inteiro.
exports.getServerByName = (server_name) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT server_name, server_ip, username, password FROM schedule WHERE LOWER(TRIM(server_name)) = LOWER(TRIM(?))',
      [server_name],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
};

// Nomes de servidores registrados, para mensagens de erro acionáveis.
exports.listServerNames = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT DISTINCT server_name FROM schedule WHERE server_name IS NOT NULL AND TRIM(server_name) <> \'\'',
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map((r) => r.server_name));
        }
      }
    );
  });
};

// Verifica se o schedule está pausado pelo server_ip
exports.isSchedulePaused = (server_ip) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT status FROM schedule WHERE server_ip = ?', [server_ip], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row && row.status === 'paused');
      }
    });
  });
};
