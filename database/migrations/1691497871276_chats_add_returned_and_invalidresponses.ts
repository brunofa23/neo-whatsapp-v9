import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('returned').defaultTo('false')
<<<<<<< HEAD
      table.string('invalidresponse', 600)
=======
      table.string('invalidresponse', 350)
>>>>>>> development

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('returned')
      table.dropColumn('invalidresponse')
    })
  }
}
