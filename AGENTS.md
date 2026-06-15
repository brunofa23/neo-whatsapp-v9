# Regras para o Codex neste projeto

## Comportamento obrigatório

- Nunca reescreva arquivos inteiros sem necessidade.
- Sempre prefira alterações pequenas e localizadas.
- Antes de implementar, explique o fluxo atual.
- Antes de alterar código, apresente um plano.
- Não crie novos componentes, services, helpers ou migrations sem justificar.
- Preserve os padrões existentes do projeto.
- Use os componentes DefaultTextField, DefaultSelect, DefaultButton, DefaultCheckbox e DefaultAlert quando existirem.
- Em Vue, manter o padrão atual de Composition API/script setup.
- Em requisições HTTP, manter o padrão atual com axios e getHeaders quando o projeto já usar.
- Em AdonisJS, seguir o padrão atual de controllers, validators, models e Lucid ORM.
- Não mudar nomes de variáveis, endpoints ou campos existentes sem necessidade.
- Não fazer refatorações fora do escopo solicitado.
- Tente gerar sempre o mínimo de código possível.

## Antes de alterar

Sempre responder:

1. Arquivos que serão analisados
2. Fluxo atual encontrado
3. Plano de alteração
4. Riscos
5. Como testar

## Depois de alterar

Sempre responder:

1. Arquivos alterados
2. Resumo do que mudou
3. Trechos principais
4. Como testar manualmente
5. Possíveis impactos