## EXCLUIR BRANCH
git checkout development
git branch -d development-test
git push origin --delete development-test

--teste
## para atualizar e não está atualizando
git fetch --all
git reset --hard origin/<nome-do-branch>


# sobrepoe as alterações de uma branch em outra
git merge --squash feature-branch


# passos para atualizar uma branch no git
git status
git add .
git commit -m 'nome'
git push origin <branch>

## TRABALHANDO COM HORAS
  const hourSend = await DateFormat("HH:mm", DateTime.local())
  const hourSend1 = await DateFormat("HH:mm", DateTime.local().plus({ minutes: 5 }))
  console.log("HORA:::", hourSend, hourSend1)
  if (hourSend > "16:20") {
    console.log("HORA É MAIOR")
  } else if (hourSend < "16:35") {
    console.log("HORA É MENOR")
  }

## CASO API DÊ BUG
NO PACKAGE.JSON
trocar: "whatsapp-web.js": "^1.23.0"
"whatsapp-web.js": "https://github.com/Julzk/whatsapp-web.js/tarball/jkr_hotfix_8"

Ou tente esse 
"whatsapp-web.js": "github:pedroslopez/whatsapp-web.js#webpack-exodus"

## DATAS
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00') = '2023-12-21'
const endOfDay = await DateFormat("yyyy-MM-dd 23:59", dateNow) = '2023-12-21' (função DateFormat construida)

# CODIGO PARA FAZER BACKUP MYSQL DENTRO DO NODE
npm install mysqldump

const mysqldump = require('mysqldump');

// Configurações de conexão com o banco de dados MySQL
const connectionOptions = {
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'seu_banco_de_dados'
};

// Opções para o mysqldump
const dumpOptions = {
  dest: 'caminho_para_o_arquivo_backup.sql', // Caminho onde o arquivo de backup será salvo
  // Outras opções aqui, como gzip: true, para comprimir o backup
};

// Executar o backup
mysqldump(connectionOptions, dumpOptions)
  .then(() => {
    console.log('Backup do MySQL concluído com sucesso!');
  })
  .catch(error => {
    console.error('Erro ao fazer o backup:', error);
  });

  # ###########################################################################

colocar dentro Constants.js da pasta util em node_modules -> whattsapp
 
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2403.2.html
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2409.0.html
https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2402.5-beta.html


# Nome do servidor PM2 na web
PM2 start server.js --name easytalk
nome do docker: easytalk

.
# EXECUTAR SEED
node ace db:seed -i


# CÓDIGO BATH
@echo off
:: Navegar para o diretório do projeto
cd c:\EasyTalk\neo-whatsapp-v9\build
pm2 start server.js --name easytalk
pm2 monit


# CHAT PARA RESPOSTAS DOS PACIENTES
https://chatgpt.com/share/0fc3fddf-4535-4161-bae2-b30e0fde26bb

teste...1111
