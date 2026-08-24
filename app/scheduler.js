const cron = require('node-cron');
const db = require('./db');
const { ipmiCommand } = require('./ipmi');

async function executeIfNotPaused(server_ip, username, password, command) {
  const paused = await db.isSchedulePaused(server_ip);
  if (paused) {
    console.log(`Schedule pausado para ${server_ip}, pulando comando: ${command}`);
    return;
  }
  ipmiCommand(server_ip, username, password, command);
}

exports.schedulePowerOn = (server_ip, username, password, time, days_of_week) => {
  console.log(`Agendando power on para ${server_ip} às ${time}`);
  const [hour, minute] = time.split(':');
  const dayExpr = days_of_week ? days_of_week : '*';
  cron.schedule(`${minute} ${hour} * * ${dayExpr}`, () => {
    console.log(`Executando power on agendado para ${server_ip} às ${time}`);
    executeIfNotPaused(server_ip, username, password, 'chassis power on');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};

exports.schedulePowerOff = (server_ip, username, password, time, days_of_week) => {
  console.log(`Agendando power off para ${server_ip} às ${time}`);
  const [hour, minute] = time.split(':');
  const dayExpr = days_of_week ? days_of_week : '*';
  cron.schedule(`${minute} ${hour} * * ${dayExpr}`, () => {
    console.log(`Executando power off agendado para ${server_ip} às ${time}`);
    executeIfNotPaused(server_ip, username, password, 'chassis power soft');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};
