# MCP MySQL do projeto

Este MCP conecta no MySQL configurado no `.env` do projeto.

Variáveis usadas:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DB_NAME`

## Como executar

```bash
npm run mcp:mysql
```

Ou diretamente:

```bash
node mcp/mysql-server.js
```

## Configuração em um cliente MCP

Use o comando abaixo no cliente MCP:

```json
{
  "mcpServers": {
    "neo-whatsapp-v9-mysql": {
      "command": "node",
      "args": [
        "/home/bruno/projetos/easytalk/neo-whatsapp-v9/mcp/mysql-server.js"
      ],
      "cwd": "/home/bruno/projetos/easytalk/neo-whatsapp-v9"
    }
  }
}
```

## Tools disponíveis

- `mysql_list_tables`: lista tabelas e views.
- `mysql_describe_table`: mostra as colunas de uma tabela.
- `mysql_select`: faz um `SELECT` simples com limite automático.
- `mysql_query_readonly`: executa apenas queries de leitura (`SELECT`, `SHOW`, `DESCRIBE`, `DESC`, `EXPLAIN`).

Por segurança, comandos de escrita como `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE` e similares são bloqueados.
