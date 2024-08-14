import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('company_id').nullable()
      table.string('obs').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(['company_id','obs'])
    })
  }
}
