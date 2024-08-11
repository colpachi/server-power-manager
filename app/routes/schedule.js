const express = require('express');
const router = express.Router();
const db = require('../db');
const { schedulePowerOn, schedulePowerOff } = require('../scheduler');
const ping = require('ping');

router.post('/', async (req, res) => {
  const { id , server_name, server_ip, username, password, power_on_time, power_off_time } = req.body;

  if (!server_ip || !username || !password) {
    console.error('Dados faltando na requisição:', req.body);
    return res.status(400).json({ error: "Please fill all fields." });
  }

  try {
    const isAlive = await ping.promise.probe(server_ip);
    if (!isAlive.alive) {
      console.log(`Não foi possível alcançar o host ${server_ip}`);
      return res.status(500).json({ success: false, message: "Unrecheable host" });
    }

    console.log(`Host ${server_ip} alcançado`);

    db.insertSchedule(id , server_name, server_ip, username, password, power_on_time, power_off_time);

    if (power_on_time) {
      console.log(`Agendando power on para ${server_ip} às ${power_on_time}`);
      schedulePowerOn(server_ip, username, password, power_on_time);
    }
    if (power_off_time) {
      console.log(`Agendando power off para ${server_ip} às ${power_off_time}`);
      schedulePowerOff(server_ip, username, password, power_off_time);
    }

    res.json({ success: true, message: "Host connected" });
  } catch (err) {
    console.error("Erro durante o ping:", err);
    res.status(500).json({ success: false, message: "Erro interno" });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const scheduleId = req.params.id;

  try {
    const result = await db.deleteSchedule(scheduleId);

    if (result) {
      res.json({ success: true, message: "Agendamento deletado com sucesso." });
    } else {
      res.status(404).json({ success: false, message: "Agendamento não encontrado." });
    }
  } catch (err) {
    console.error("Erro ao deletar agendamento:", err);
    res.status(500).json({ success: false, message: "Erro interno ao deletar agendamento." });
  }
});

module.exports = router;
