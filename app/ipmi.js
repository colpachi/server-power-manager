const { execFile } = require('child_process');

// execFile passes args as argv (no shell), avoiding injection via server_ip/
// username/password — unlike the original exec()-based template string, this
// path is now reachable from a public HTTP body (POST /power/on|off).
function runIpmiCommand(serverIp, username, password, args) {
  const fullArgs = ['-I', 'lanplus', '-H', serverIp, '-U', username, '-P', password, ...args];
  return new Promise((resolve, reject) => {
    execFile('ipmitool', fullArgs, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

// Fire-and-forget wrapper preserving app/scheduler.js's original behavior/logging.
function ipmiCommand(serverIp, username, password, command) {
  const args = command.split(' ').filter(Boolean);
  console.log(`Preparando para executar comando: ${command}`);
  runIpmiCommand(serverIp, username, password, args)
    .then(({ stdout, stderr }) => {
      console.log(`Comando executado com sucesso: ${command}`);
      console.log(`Saída: ${stdout}`);
      if (stderr) {
        console.error(`Erro padrão: ${stderr}`);
      }
    })
    .catch((error) => {
      console.error(`Erro na execução do comando: ${error.message}`);
    });
}

function parsePowerStatus(stdout) {
  const normalized = (stdout || '').toLowerCase();
  if (normalized.includes('chassis power is on')) return 'on';
  if (normalized.includes('chassis power is off')) return 'off';
  return 'unknown';
}

module.exports = { runIpmiCommand, ipmiCommand, parsePowerStatus };
