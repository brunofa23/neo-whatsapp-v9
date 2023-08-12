import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'configs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary().notNullable()
      table.string('name')
      table.string('valuetext')
      table.boolean('valuebool').defaultTo('false')
      table.integer('valueinteger')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
