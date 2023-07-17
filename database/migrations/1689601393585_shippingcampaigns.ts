import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {

  static get connection() {
    return 'mssql2';
  }

  protected tableName = 'shippingcampaigns'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary().notNullable()
      table.string('name').notNullable()
      table.string('gender')
      table.string('cellphone').notNullable()
      table.string('message')
      table.boolean('phonevalid')
      table.boolean('messagesent')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('cellphone')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
