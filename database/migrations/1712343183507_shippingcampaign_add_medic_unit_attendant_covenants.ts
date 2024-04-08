import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'shippingcampaigns'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('doctor', 80)
      table.string('unit', 80)
      table.string('attendant', 80)
      table.string('covenant', 80)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('doctor')
      table.dropColumn('unit')
      table.dropColumn('attendant')
      table.dropColumn('covenant')
    })
  }


}
