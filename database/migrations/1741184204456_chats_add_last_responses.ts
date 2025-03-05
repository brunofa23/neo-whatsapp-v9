import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('last_response')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_response') // Remove a coluna 'ack'
      // Remove o índice composto
    })
  }
}
