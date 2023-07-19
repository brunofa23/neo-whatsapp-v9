import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {

  static get connection() {
    return 'mssql2';
  }

  protected tableName = 'shippingcampaigns'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary().notNullable()
      table.integer('interaction').notNullable()
      table.integer('reg')
      table.string('name').notNullable()
      table.string('cellphone')
      table.string('cellphoneserialized')
      table.string('message', 350)
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
