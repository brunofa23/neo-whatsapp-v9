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
 webVersion: '2.2346.52',
    // webVersionCache: {
    //     type: 'local',
    // },
    webVersionCache: {
      type: 'remote',
        remotePath:"https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },

# Nome do servidor PM2 na web
PM2 start server.js --name easytalk

