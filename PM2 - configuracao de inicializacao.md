## CONFIGURAÇÃO PARA INICIAR AUTOMATICAMENTE PM2
1 - Instalação PM2
  npm install -g pm2

2 -Iniciar sua aplicação com PM2
  pm2 start app.js --name easytalk
  pm2 start app.js --name easytalkcob

3 - pm2 save
4 - pm2 startup
## 5 - copiar o retorno do comando, colar e executar no prompt
sudo env "PATH=$PATH:/home/seu_usuario/.nvm/versions/node/vXX.X.X/bin" /home/seu_usuario/.nvm/versions/node/vXX.X.X/lib/node_modules/pm2/bin/pm2 startup systemd -u seu_usuario --hp /home/seu_usuario
## OBS: COLOQUE ENTRE ASPAS O COMANDO PATH

## Execute esse comando retornado 
6 - pm2 save

## Para remover a inicialização automática
pm2 unstartup

## (Opcional) Remover o symlink manualmente (caso necessário)
## Se quiser garantir que nada mais está chamando o PM2 no boot, você pode erificar o serviço diretamente:
sudo systemctl disable pm2-<usuário>







