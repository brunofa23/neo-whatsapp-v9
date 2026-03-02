import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'templates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // JSON em string, ex: '["patient_name","data_registro"]'
      table.text('params_schema').nullable().after('description')
    })
  }
   public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('params_schema')
    })
  }


}
