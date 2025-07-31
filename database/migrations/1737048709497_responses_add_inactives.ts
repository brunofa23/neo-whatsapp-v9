import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'responses'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('inactive').defaultTo(false).after('interaction_id')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
