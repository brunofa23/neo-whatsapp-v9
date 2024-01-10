import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary().notNullable()
      table.integer('interaction_id').notNullable().references('interactions.id')
      table.integer('interaction_seq')
      table.integer('idexternal')
      table.integer('reg').notNullable()
      table.string('name').notNullable()
      table.string('cellphone')
      table.string('cellphoneserialized').nullable
      table.string('message', 600)
      table.string('response')
      table.integer('shippingcampaigns_id').references('shippingcampaigns.id')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
