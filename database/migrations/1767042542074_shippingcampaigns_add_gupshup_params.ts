import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'shippingcampaigns'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('gupshup_params').nullable().after('otherfields')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName,(table)=>{
      table.dropColumn('gupshup_params')
    })
  }
}
