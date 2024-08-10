const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/schedule');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para analisar o corpo das requisições em formato JSON
app.use(bodyParser.json());

// Middleware para servir arquivos estáticos na pasta "views"
app.use(express.static(path.join(__dirname, '../views')));

// Rota para renderizar o arquivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Rota para agendar operações
app.use('/schedule', scheduleRoutes);

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
