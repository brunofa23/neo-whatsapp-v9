import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'manifests'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('mainsubject_id').nullable().unsigned()
      .references('mainsubjects.id').onDelete('CASCADE').onUpdate('CASCADE').after('chat_id')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mainsubject_id')
    })
  }
}
