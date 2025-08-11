import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('excluded').after('chat_finished')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName,(table)=>{
      table.dropColumn('excluded')
    })
  }
}
