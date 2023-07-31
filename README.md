## EXCLUIR BRANCH
git checkout development
git branch -d main
git push origin --delete main

--teste
## para atualizar e não está atualizando
git fetch --all
git reset --hard origin/<nome-do-branch>


# sobrepoe as alterações de uma branch em outra
git merge --squash feature-branch
