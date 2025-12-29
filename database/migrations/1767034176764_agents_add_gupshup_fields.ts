import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('gupshup_source', 20).nullable().after('provider_type')       // source=553199740981
      table.string('gupshup_src_name', 100).nullable().after('gupshup_source')    // src.name=Neo Hospital de Olhos
      table.string('gupshup_template_id', 60).nullable().after('gupshup_src_name')  // template.id=uuid
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('gupshup_source')
      table.dropColumn('gupshup_src_name')
      table.dropColumn('gupshup_template_id')
    })
  }
}
