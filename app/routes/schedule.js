const express = require('express');
const router = express.Router();
const db = require('../db');
const { schedulePowerOn, schedulePowerOff } = require('../scheduler');

router.post('/', (req, res) => {
  const servers = req.body.servers; // Espera um array de objetos servidor

  servers.forEach(server => {
    const { server_name, server_ip, username, password, power_on_time, power_off_time } = server;

    if (!server_ip || !username || !password) {
      console.error('Dados faltando:', server);
      return res.status(400).json({ error: "Dados incompletos para agendamento" });
    }

    db.insertSchedule(server_name, server_ip, username, password, power_on_time, power_off_time);
  
    if (power_on_time) {
      schedulePowerOn(server_name, server_ip, username, password, power_on_time);
    }
    if (power_off_time) {
      schedulePowerOff(server_name, server_ip, username, password, power_off_time);
    }
  });

  res.json({ message: "Agendamentos realizados com sucesso" });
});

module.exports = router;
