## EXCLUIR BRANCH
git checkout development
git branch -d development-test
git push origin --delete development-test

--teste
## para atualizar e não está atualizando
git fetch --all
git reset --hard origin/<nome-do-branch>
