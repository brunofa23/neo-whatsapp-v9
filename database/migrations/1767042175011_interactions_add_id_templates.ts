import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'interactions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('id_templates_gupshup', 100).after('querydev').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('id_templates_gupshup')
    })
  }
}
