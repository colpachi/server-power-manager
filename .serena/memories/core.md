# server-power-manager (SPM)

Webapp para agendar power on/off de servidores via **IPMI** (em servidores Dell, usa IP/usuario/senha do **iDRAC**). Node.js + Express + SQLite. Porta 7050.

- Frontend classico: HTML + CSS + jQuery (sem framework SPA). Backend Node.js. Persistencia: **SQLite** (`app/data`).
- Layout: `app/{data,routes}`, `views/`.
- Requer acesso de rede as maquinas alvo (inclusive atras de VPN, desde que o host do SPM alcance).

## Invariantes
- **E o SPM referenciado por `devserver-automation` e `cmd-flow-backend`** para ligar a VM Linux de automacao noturna via iDRAC - mudanca de contrato aqui (API de agendamento) pode quebrar esse fluxo de automacao.
- Dados (schedules, credenciais de servidor) ficam em **SQLite local**, nao em banco compartilhado - backup/migracao e responsabilidade deste repo, nao ha replicacao.
- Guarda credenciais de acesso (usuario/senha iDRAC) no banco - tratar como dado sensivel ao inspecionar/exportar `app/data`.
