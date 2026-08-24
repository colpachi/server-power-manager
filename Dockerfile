# Especifica a imagem base do Node.js
FROM node:16-alpine

# Define o diretório de trabalho no contêiner
WORKDIR /app

# Instala o ipmitool (runtime) e o toolchain para os módulos nativos do npm.
#
# O CDN padrão do Alpine (dl-cdn.alpinelinux.org, Fastly) NÃO é alcançável de
# forma confiável a partir do build worker do NAS e o `apk` pendura no fetch do
# APKINDEX. Então tentamos uma lista de mirrors alternativos em ordem, cada um
# com timeout, e usamos o primeiro que responder; o dl-cdn fica por último como
# último recurso. Se todos falharem, o build encerra com erro (não trava eterno).
# A versão do Alpine é derivada de /etc/alpine-release para não quebrar se a
# imagem base mudar. `timeout` vem do busybox, já presente na imagem.
RUN set -eu; \
    ALPINE_VER="$(cut -d. -f1,2 /etc/alpine-release)"; \
    MIRRORS="https://mirrors.edge.kernel.org/alpine \
             https://mirror.leaseweb.com/alpine \
             https://uk.alpinelinux.org/alpine \
             https://dl-cdn.alpinelinux.org/alpine"; \
    ok=""; \
    for m in $MIRRORS; do \
      echo ">> tentando mirror $m (Alpine v$ALPINE_VER)"; \
      printf '%s/v%s/main\n%s/v%s/community\n' "$m" "$ALPINE_VER" "$m" "$ALPINE_VER" > /etc/apk/repositories; \
      if timeout 120 apk add --no-cache ipmitool python3 make g++ sqlite-dev; then ok=1; break; fi; \
      echo ">> mirror $m falhou/travou, tentando o proximo..."; \
    done; \
    [ -n "$ok" ] || { echo ">> todos os mirrors do Alpine falharam"; exit 1; }

# Copia o arquivo package.json e package-lock.json (se disponível) para o contêiner
COPY app/package*.json ./

# Instala as dependências do projeto. Há package-lock.json, então usamos `npm ci`
# (mais rápido e determinístico que `npm install`) com audit/fund desligados.
#
# `sqlite3` (5.1.7 no lockfile) é módulo nativo. Por padrão a 5.1.7 baixa um
# binário pré-compilado do GitHub Releases (via prebuild-install) — mas o egress
# do worker é problemático e isso pendura o download. Então FORÇAMOS build local
# (`npm_config_build_from_source`, pula o GitHub) e linkamos contra o libsqlite
# do sistema (`npm_config_sqlite=/usr`, do sqlite-dev): compila só o binding em
# segundos, sem baixar do GitHub e sem recompilar o SQLite inteiro. A única rede
# necessária são os headers do Node (nodejs.org, mesma CDN do registry que já
# funciona). `timeout` garante que nunca pendure pra sempre.
ENV npm_config_build_from_source=true
ENV npm_config_sqlite=/usr
RUN timeout 400 npm ci --no-audit --no-fund

# Copia o restante dos arquivos do aplicativo para o diretório de trabalho no contêiner
COPY app/ .
COPY views/ ../views

# Expõe a porta que a aplicação vai usar
EXPOSE 7050

# Comando para rodar a aplicação
CMD ["node", "server.js"]