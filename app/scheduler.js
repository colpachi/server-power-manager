const cron = require('node-cron');
const exec = require('child_process').exec;

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

exports.schedulePowerOn = (server_ip, username, password, time) => {
  console.log(`Agendando power on para ${server_ip} às ${time}`);
  const [hour, minute] = time.split(':');
  cron.schedule(`${minute} ${hour} * * *`, () => {
    console.log(`Executando power on agendado para ${server_ip} às ${time}`);
    ipmiCommand(server_ip, username, password, 'chassis power on');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};

exports.schedulePowerOff = (server_ip, username, password, time) => {
  console.log(`Agendando power off para ${server_ip} às ${time}`);
  const [hour, minute] = time.split(':');
  cron.schedule(`${minute} ${hour} * * *`, () => {
    console.log(`Executando power off agendado para ${server_ip} às ${time}`);
    ipmiCommand(server_ip, username, password, 'chassis power soft');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};
