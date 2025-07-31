import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'talks'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('chat_id').nullable().unsigned().references('chats.id').after('id')
      table.integer('reg',11).nullable().after('chat_id')
      table.string('cellphoneserialized',30).nullable().after('cellphone')

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('chat_id')
      table.dropColumn('reg')
      table.dropColumn('cellphoneserialized')
    }
    )
  }
}
