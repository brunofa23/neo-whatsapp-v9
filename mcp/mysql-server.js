#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const ENV_PATH = path.join(PROJECT_ROOT, '.env')
const SERVER_NAME = 'neo-whatsapp-v9-mysql'
const SERVER_VERSION = '1.0.0'
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) return env

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      env[key] = value
      return env
    }, {})
}

const env = {
  ...loadEnv(ENV_PATH),
  ...process.env,
}

const pool = mysql.createPool({
  host: env.MYSQL_HOST || '127.0.0.1',
  port: Number(env.MYSQL_PORT || 3306),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD || '',
  database: env.MYSQL_DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(env.MCP_MYSQL_CONNECTION_LIMIT || 3),
  multipleStatements: false,
})

function getLimit(limit) {
  const parsed = Number(limit || DEFAULT_LIMIT)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(parsed), MAX_LIMIT)
}

function quoteIdentifier(identifier) {
  const value = String(identifier || '').trim()
  if (!value) throw new Error('Identificador vazio.')

  return value
    .split('.')
    .map((part) => {
      if (!/^[A-Za-z0-9_$]+$/.test(part)) {
        throw new Error(`Identificador inválido: ${identifier}`)
      }
      return `\`${part}\``
    })
    .join('.')
}

function assertReadOnlyQuery(query) {
  const sql = String(query || '').trim().replace(/;+\s*$/, '')
  if (!sql) throw new Error('Informe uma query.')

  if (!/^(select|show|describe|desc|explain)\b/i.test(sql)) {
    throw new Error('Somente queries de leitura são permitidas.')
  }

  if (
    /\b(insert|update|delete|drop|alter|create|truncate|replace|grant|revoke|call|load|set)\b/i.test(sql) ||
    /\binto\s+(out|dump)?file\b/i.test(sql) ||
    /\/\*|\*\/|--|#/g.test(sql)
  ) {
    throw new Error('A query contém comando ou trecho bloqueado para segurança.')
  }

  return sql
}

function addLimitWhenSelect(sql, limit) {
  if (!/^select\b/i.test(sql)) return sql
  if (/\blimit\s+\d+/i.test(sql)) return sql
  return `${sql} LIMIT ${getLimit(limit)}`
}

function textContent(value) {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  }
}

function toolError(error) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  }
}

async function listTables() {
  const [rows] = await pool.query('SHOW FULL TABLES')
  return textContent({
    database: env.MYSQL_DB_NAME || null,
    tables: rows,
  })
}

async function describeTable(args) {
  const table = quoteIdentifier(args.table)
  const [columns] = await pool.query(`DESCRIBE ${table}`)
  return textContent({
    table: args.table,
    columns,
  })
}

async function selectRows(args) {
  const table = quoteIdentifier(args.table)
  const columns = Array.isArray(args.columns) && args.columns.length > 0
    ? args.columns.map(quoteIdentifier).join(', ')
    : '*'

  const limit = getLimit(args.limit)
  const offset = Math.max(0, Number(args.offset || 0) || 0)
  const orderBy = args.orderBy ? ` ORDER BY ${quoteIdentifier(args.orderBy)}` : ''
  const sql = `SELECT ${columns} FROM ${table}${orderBy} LIMIT ? OFFSET ?`
  const [rows] = await pool.query(sql, [limit, offset])

  return textContent({
    sql,
    limit,
    offset,
    rows,
  })
}

async function readonlyQuery(args) {
  const sql = addLimitWhenSelect(assertReadOnlyQuery(args.query), args.limit)
  const params = Array.isArray(args.params) ? args.params : []
  const [rows, fields] = await pool.query(sql, params)

  return textContent({
    sql,
    rows,
    fields: Array.isArray(fields)
      ? fields.map((field) => ({
          name: field.name,
          table: field.table,
          type: field.type,
        }))
      : [],
  })
}

async function callTool(name, args = {}) {
  try {
    if (name === 'mysql_list_tables') return await listTables()
    if (name === 'mysql_describe_table') return await describeTable(args)
    if (name === 'mysql_select') return await selectRows(args)
    if (name === 'mysql_query_readonly') return await readonlyQuery(args)

    return toolError(`Tool desconhecida: ${name}`)
  } catch (error) {
    return toolError(error)
  }
}

async function getSchemaResource() {
  const [tables] = await pool.query('SHOW FULL TABLES')
  const tableNames = tables
    .map((row) => Object.values(row)[0])
    .filter(Boolean)

  const schema = []
  for (const tableName of tableNames) {
    const [columns] = await pool.query(`DESCRIBE ${quoteIdentifier(tableName)}`)
    schema.push({ table: tableName, columns })
  }

  return schema
}

const tools = [
  {
    name: 'mysql_list_tables',
    description: 'Lista tabelas e views do banco MySQL configurado no .env do projeto.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'mysql_describe_table',
    description: 'Mostra as colunas de uma tabela MySQL.',
    inputSchema: {
      type: 'object',
      required: ['table'],
      properties: {
        table: { type: 'string', description: 'Nome da tabela.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mysql_select',
    description: 'Executa um SELECT simples em uma tabela, com limite automático.',
    inputSchema: {
      type: 'object',
      required: ['table'],
      properties: {
        table: { type: 'string', description: 'Nome da tabela.' },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Colunas para retornar. Se omitido, usa *.',
        },
        orderBy: { type: 'string', description: 'Coluna opcional para ordenar.' },
        limit: { type: 'number', description: `Limite de linhas. Máximo: ${MAX_LIMIT}.` },
        offset: { type: 'number', description: 'Offset opcional.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mysql_query_readonly',
    description: 'Executa queries MySQL somente de leitura: SELECT, SHOW, DESCRIBE/DESC ou EXPLAIN.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Query de leitura.' },
        params: {
          type: 'array',
          items: {},
          description: 'Parâmetros posicionais opcionais para placeholders ?.',
        },
        limit: { type: 'number', description: `Limite automático para SELECT sem LIMIT. Máximo: ${MAX_LIMIT}.` },
      },
      additionalProperties: false,
    },
  },
]

async function handleRequest(message) {
  if (!message || typeof message !== 'object') return null

  const { id, method, params } = message
  const isNotification = id === undefined || id === null

  try {
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
          },
        },
      }
    }

    if (method === 'ping') {
      return { jsonrpc: '2.0', id, result: {} }
    }

    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id, result: { tools } }
    }

    if (method === 'tools/call') {
      const result = await callTool(params?.name, params?.arguments || {})
      return { jsonrpc: '2.0', id, result }
    }

    if (method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            {
              uri: 'mysql://schema',
              name: 'MySQL schema',
              description: 'Schema das tabelas do banco MySQL do projeto.',
              mimeType: 'application/json',
            },
          ],
        },
      }
    }

    if (method === 'resources/read') {
      if (params?.uri !== 'mysql://schema') {
        throw new Error(`Resource desconhecido: ${params?.uri}`)
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri: 'mysql://schema',
              mimeType: 'application/json',
              text: JSON.stringify(await getSchemaResource(), null, 2),
            },
          ],
        },
      }
    }

    if (method === 'prompts/list') {
      return { jsonrpc: '2.0', id, result: { prompts: [] } }
    }

    if (isNotification) return null

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Método não suportado: ${method}`,
      },
    }
  } catch (error) {
    if (isNotification) return null

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

function sendMessage(message) {
  const body = JSON.stringify(message)
  const length = Buffer.byteLength(body, 'utf8')
  process.stdout.write(`Content-Length: ${length}\r\n\r\n${body}`)
}

let inputBuffer = Buffer.alloc(0)

function tryReadFramedMessage() {
  const headerEnd = inputBuffer.indexOf('\r\n\r\n')
  if (headerEnd === -1) return null

  const headers = inputBuffer.slice(0, headerEnd).toString('utf8')
  const match = headers.match(/content-length:\s*(\d+)/i)
  if (!match) throw new Error('Cabeçalho Content-Length não encontrado.')

  const length = Number(match[1])
  const messageStart = headerEnd + 4
  const messageEnd = messageStart + length
  if (inputBuffer.length < messageEnd) return null

  const rawMessage = inputBuffer.slice(messageStart, messageEnd).toString('utf8')
  inputBuffer = inputBuffer.slice(messageEnd)
  return JSON.parse(rawMessage)
}

function tryReadLineMessage() {
  const lineEnd = inputBuffer.indexOf('\n')
  if (lineEnd === -1) return null

  const line = inputBuffer.slice(0, lineEnd).toString('utf8').trim()
  inputBuffer = inputBuffer.slice(lineEnd + 1)
  if (!line) return null
  if (!line.startsWith('{')) return null

  return JSON.parse(line)
}

async function processInput() {
  while (inputBuffer.length > 0) {
    let message = null
    const inputStart = inputBuffer.slice(0, Math.min(inputBuffer.length, 32)).toString('utf8')

    if (/^Content-Length:/i.test(inputStart)) {
      message = tryReadFramedMessage()
    } else {
      message = tryReadLineMessage()
    }

    if (!message) break

    const response = await handleRequest(message)
    if (response) sendMessage(response)
  }
}

process.stdin.on('data', async (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk])
  try {
    await processInput()
  } catch (error) {
    sendMessage({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
})

process.stdin.on('end', async () => {
  await pool.end()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})
