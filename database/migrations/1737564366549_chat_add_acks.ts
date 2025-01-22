import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('ack').after('returned') // Adiciona a coluna 'ack'
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ack') // Remove a coluna 'ack'
      // Remove o índice composto
    })
  }
}
