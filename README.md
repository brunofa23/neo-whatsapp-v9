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
"whatsapp-web.js": "https://github.com/Julzk/whatsapp-web.js/tarball/jkr_hotfix_8"

## DATAS
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00') = '2023-12-21'
const endOfDay = await DateFormat("yyyy-MM-dd 23:59", dateNow) = '2023-12-21' (função DateFormat construida)
