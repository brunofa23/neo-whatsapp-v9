import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'mainsubjects'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary().unsigned().notNullable()
      table.string('description', 100).notNullable()
      table.boolean('excluded').defaultTo('false')
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
