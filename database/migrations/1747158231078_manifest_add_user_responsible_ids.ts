import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'manifests'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('user_responsible_id').nullable().unsigned().references('users.id')
      .after('mainsubject_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_responsible_id')
    })
  }
}
