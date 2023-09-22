import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary().notNullable()
      table.string('name').notNullable()
      table.string('number_phone')
      table.integer('interval_init_query').notNullable()
      table.integer('interval_final_query').notNullable()
      table.integer('interval_init_message').notNullable()
      table.integer('interval_final_message').notNullable()
      table.integer('max_limit_message').notNullable()
      table.string('status')
      table.boolean('active').defaultTo('true')
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
