import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'


test('display welcome page', async ({ client }) => {
  try {
    const teste = await extractCellphone('')
    console.log('*******TESTES', teste)

})
