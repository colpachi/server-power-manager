const cron = require('node-cron');
const exec = require('child_process').exec;
const db = require('./db');

function ipmiCommand(server_ip, username, password, command) {
  const cmd = `ipmitool -I lanplus -H ${server_ip} -U ${username} -P ${password} ${command}`;
  
  console.log(`Preparando para executar comando: ${command}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro na execução do comando: ${error.message}`);
      return;
    }
    console.log(`Comando executado com sucesso: ${command}`);
    console.log(`Saída: ${stdout}`);
    if (stderr) {
      console.error(`Erro padrão: ${stderr}`);
    }
  });
}

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
