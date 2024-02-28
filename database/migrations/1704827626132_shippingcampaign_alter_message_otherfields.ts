import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'shippingcampaigns'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('message', 600).alter()
      table.string('otherfields', 600).alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('message').alter()
      table.string('otherfields').alter()
    })
  }


}
