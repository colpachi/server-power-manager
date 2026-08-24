const express = require('express');
const router = express.Router();
const db = require('../db');
const { runIpmiCommand, parsePowerStatus } = require('../ipmi');

function requireAuth(req, res, next) {
  const token = process.env.SPM_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'SPM_API_TOKEN not configured on the server' });
  }
  if (req.header('X-SPM-Token') !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function resolveCredentials(source) {
  if (source.server_ip && source.username && source.password) {
    return { server_ip: source.server_ip, username: source.username, password: source.password };
  }
  if (source.server) {
    const row = await db.getServerByName(source.server);
    if (!row) return null;
    return { server_ip: row.server_ip, username: row.username, password: row.password };
  }
  return null;
}

// Erro de resolução, dizendo QUAL nome foi pedido e QUAIS existem.
//
// A mensagem antiga era sempre a mesma ("Provide server...") tanto para "não
// mandou nada" quanto para "esse nome não está cadastrado". O chamador via um
// 400 genérico que parecia parâmetro faltando, e o diagnóstico real (nome não
// registrado) só aparecia lendo o banco do SPM à mão.
async function respondUnresolved(res, requested) {
  let registered = [];
  try {
    registered = await db.listServerNames();
  } catch (_) {
    // best-effort: sem a lista, ainda devolvemos o nome pedido
  }

  if (!requested) {
    return res.status(400).json({
      error: 'Provide "server" (registered name) or server_ip/username/password',
      registered_servers: registered,
    });
  }

  return res.status(400).json({
    error: `Unknown server "${requested}": not registered in SPM`,
    requested_server: requested,
    registered_servers: registered,
    hint: 'Register it in the schedule list, or send server_ip/username/password explicitly.',
  });
}

router.get('/status', requireAuth, async (req, res) => {
  const creds = await resolveCredentials(req.query);
  if (!creds) {
    return respondUnresolved(res, req.query.server);
  }
  try {
    const { stdout } = await runIpmiCommand(creds.server_ip, creds.username, creds.password, [
      'chassis', 'power', 'status',
    ]);
    res.json({ status: parsePowerStatus(stdout) });
  } catch (err) {
    res.status(502).json({ error: 'ipmitool command failed', details: err.message });
  }
});

router.post('/on', requireAuth, async (req, res) => {
  const creds = await resolveCredentials(req.body);
  if (!creds) {
    return respondUnresolved(res, req.body && req.body.server);
  }
  try {
    const { stdout: statusOut } = await runIpmiCommand(creds.server_ip, creds.username, creds.password, [
      'chassis', 'power', 'status',
    ]);
    if (parsePowerStatus(statusOut) === 'on') {
      return res.json({ already_on: true });
    }
    await runIpmiCommand(creds.server_ip, creds.username, creds.password, ['chassis', 'power', 'on']);
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: 'ipmitool command failed', details: err.message });
  }
});

router.post('/off', requireAuth, async (req, res) => {
  const creds = await resolveCredentials(req.body);
  if (!creds) {
    return respondUnresolved(res, req.body && req.body.server);
  }
  try {
    await runIpmiCommand(creds.server_ip, creds.username, creds.password, ['chassis', 'power', 'soft']);
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: 'ipmitool command failed', details: err.message });
  }
});

module.exports = router;
