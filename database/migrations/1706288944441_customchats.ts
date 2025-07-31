import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'customchats'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary().notNullable()
      table.integer('chats_id').notNullable().unsigned().references('chats.id')
      table.integer('idexternal')
      table.integer('reg').notNullable()
      table.string('cellphone').notNullable()
      table.string('cellphoneserialized').nullable()
      table.string('message', 600)
      table.string('response', 600)
      table.integer('returned')
      table.string('chatname')
      table.boolean('messagesent').defaultTo('false')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
