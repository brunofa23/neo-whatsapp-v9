@echo off
echo Iniciando o processo de build...

rem Execute o comando do Ace CLI para build com produção e ignorando erros do TypeScript
node ace build --production --ignore-ts-errors
&& comando 1 executado...

rem Navegue para a pasta "build"
cd build
&& entrou na pasta...

rem Execute o npm ci para instalar apenas as dependências de produção
npm ci --production
&& atualizado...

rem Copie o arquivo .env da pasta raiz para dentro da pasta "build"
copy ..\.env .\.env
&& comando 2 executado...

rem Execute o arquivo server.js
node server.js

echo Processo de build concluído.
