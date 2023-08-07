import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'interactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary().notNullable
      table.integer('seq')
      table.string('name')
      table.text('query').notNullable()
      table.text('querydev')
      table.boolean('status').notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
