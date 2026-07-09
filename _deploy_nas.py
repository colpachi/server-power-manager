"""Deploy do server-power-manager no NAS.

Estrategia primaria: registry (registry.comanndo.com)
Fallback: build local -> tar -> SFTP -> docker load no NAS
"""

import os
import paramiko
import subprocess
import sys
import time

# ── Config ──────────────────────────────────────────────
NAS_HOST = '192.168.2.6'
NAS_PORT = 220
NAS_USER = 'admin'
NAS_PASS = 'apolinho@!@xA12'
REGISTRY = 'registry.comanndo.com'
IMAGE_NAME = 'server-power-manager'
REGISTRY_IMAGE = f'{REGISTRY}/comanndo/{IMAGE_NAME}'
VERSION = 'latest'
CONTAINER_NAME = 'server-power-manager'
PORT = '7050'
DATA_VOLUME_HOST = '/volume1/server-power-manager-data'
NAS_TMP = '/volume1/tmp'
TAR_FILE = f'{IMAGE_NAME}.tar'
TAR_PATH_LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), TAR_FILE)
# ────────────────────────────────────────────────────────

DOCKER = '/usr/local/bin/docker'


def run_local(cmd: str) -> int:
    print(f'[LOCAL] $ {cmd}')
    proc = subprocess.run(cmd, shell=True)
    return proc.returncode


def run_remote(ssh: paramiko.SSHClient, cmd: str, timeout: int = 300) -> int:
    sudo_cmd = f'sudo -S {cmd}'
    stdin, stdout, stderr = ssh.exec_command(sudo_cmd, get_pty=True, timeout=timeout)
    time.sleep(0.5)
    stdin.write(NAS_PASS + '\n')
    stdin.flush()
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    lines = [l for l in out.splitlines() if NAS_PASS not in l and 'Password:' not in l]
    print('\n'.join(lines))
    if exit_code != 0:
        err = stderr.read().decode()
        if err.strip():
            print(f'[STDERR] {err}', file=sys.stderr)
        print(f'[EXIT {exit_code}]')
    return exit_code


def deploy_via_registry(ssh: paramiko.SSHClient):
    """Tenta pull do registry e deploy."""
    print('\n=== Pull da imagem (registry) ===')
    if run_remote(ssh, f'{DOCKER} pull {REGISTRY_IMAGE}:{VERSION}') != 0:
        print('[FALLBACK] Registry inacessivel, usando transferencia via SFTP...')
        return False

    # Stop + remove antigo
    print('\n=== Parando container antigo ===')
    run_remote(ssh, f'{DOCKER} stop {CONTAINER_NAME}')
    run_remote(ssh, f'{DOCKER} rm {CONTAINER_NAME}')

    # Run
    print('\n=== Iniciando novo container ===')
    run_remote(ssh,
        f'{DOCKER} run -d --name {CONTAINER_NAME} '
        f'--restart unless-stopped '
        f'-p {PORT}:{PORT} '
        f'-v {DATA_VOLUME_HOST}:/app/data '
        f'{REGISTRY_IMAGE}:{VERSION}'
    )
    return True


def _connect_nas():
    """Cria uma nova conexao SSH com o NAS."""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(NAS_HOST, port=NAS_PORT, username=NAS_USER, password=NAS_PASS)
    return ssh


def deploy_via_stdin(ssh: paramiko.SSHClient):
    """Build local, envia imagem via stdin SSH com docker load no NAS."""
    # Build local
    print('\n=== Build local ===')
    if run_local(f'docker build -t {IMAGE_NAME}:{VERSION} .') != 0:
        print('[ERRO] Falha no build local', file=sys.stderr)
        sys.exit(1)

    # Salvar como tar
    print('\n=== Salvando imagem como tar ===')
    if os.path.exists(TAR_PATH_LOCAL):
        os.remove(TAR_PATH_LOCAL)
    if run_local(f'docker save -o {TAR_PATH_LOCAL} {IMAGE_NAME}:{VERSION}') != 0:
        print('[ERRO] Falha ao salvar tar', file=sys.stderr)
        sys.exit(1)

    size_mb = os.path.getsize(TAR_PATH_LOCAL) / (1024 * 1024)
    print(f'[OK] Tar criado: {size_mb:.1f} MB')

    # Enviar via stdin SSH -> docker load
    print('\n=== Enviando imagem para o NAS (stdin) ===')
    cmd = f'sudo -S {DOCKER} load'
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=False, timeout=600)
    time.sleep(0.3)
    stdin.write(NAS_PASS + '\n')
    stdin.flush()
    time.sleep(0.3)

    with open(TAR_PATH_LOCAL, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            stdin.write(chunk)
    stdin.channel.shutdown_write()

    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    # Filtrar "Password:" da saida
    for line in out.splitlines():
        if 'Password:' not in line:
            print(line)
    if err.strip():
        err_clean = '\n'.join(l for l in err.splitlines() if 'Password:' not in l)
        if err_clean.strip():
            print(f'[STDERR] {err_clean}', file=sys.stderr)

    # Limpar tar local
    os.remove(TAR_PATH_LOCAL)

    if exit_code != 0:
        print(f'[ERRO] docker load falhou (exit {exit_code})', file=sys.stderr)
        sys.exit(1)

    print('[OK] Imagem carregada no NAS')

    # Stop + remove antigo
    print('\n=== Parando container antigo ===')
    run_remote(ssh, f'{DOCKER} stop {CONTAINER_NAME}')
    run_remote(ssh, f'{DOCKER} rm {CONTAINER_NAME}')

    # Run
    print('\n=== Iniciando novo container ===')
    run_remote(ssh,
        f'{DOCKER} run -d --name {CONTAINER_NAME} '
        f'--restart unless-stopped '
        f'-p {PORT}:{PORT} '
        f'-v {DATA_VOLUME_HOST}:/app/data '
        f'{IMAGE_NAME}:{VERSION}'
    )


def main():
    # ── Conectar ao NAS ─────────────────────────────────
    print('=== Conectando ao NAS ===')
    try:
        ssh = _connect_nas()
        print('[OK] Conectado ao NAS')
    except Exception as e:
        print(f'[ERRO] Falha ao conectar no NAS: {e}', file=sys.stderr)
        sys.exit(1)

    # ── Garantir diretorio de dados ─────────────────────
    print('\n=== Garantindo diretorio de dados ===')
    run_remote(ssh, f'mkdir -p {DATA_VOLUME_HOST}')

    # ── Tentar registry, fallback SFTP ──────────────────
    if not deploy_via_registry(ssh):
        deploy_via_stdin(ssh)

    # ── Verificar ───────────────────────────────────────
    print('\n=== Verificando ===')
    time.sleep(4)
    run_remote(ssh, f'{DOCKER} ps --filter name={CONTAINER_NAME} --format "table {{{{.Names}}}}\\t{{{{.Image}}}}\\t{{{{.Status}}}}"')
    run_remote(ssh, f'{DOCKER} logs --tail 10 {CONTAINER_NAME}')

    ssh.close()
    print(f'\n[OK] Deploy concluido. Acesse http://{NAS_HOST}:{PORT}')


if __name__ == '__main__':
    main()


if __name__ == '__main__':
    main()
