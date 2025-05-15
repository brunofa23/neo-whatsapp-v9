import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'manifests'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('complement',255).nullable().after('main_subject')
      table.string('justification',255).nullable().after('status')
      table.string('status',30).nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('complement') // Remove a coluna 'ack'
      table.dropColumn('justification') // Remove a coluna 'ack'
      // Remove o índice composto
    })
  }
}
