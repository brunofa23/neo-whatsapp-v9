import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('response', 600).alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('response').alter()
    })
  }
}
