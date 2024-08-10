const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/schedule');
const path = require('path');
const { getSchedules } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../views')));

// Rota para buscar agendamentos na inicialização
app.get('/schedules', (req, res) => {
  console.log('Solicitação recebida para buscar agendamentos.');
  getSchedules((err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados do banco de dados:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Agendamentos encontrados: ${rows.length} registros.`);
    res.json({ schedules: rows });
  });
});

// Rota para agendar operações
app.use('/schedule', scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
