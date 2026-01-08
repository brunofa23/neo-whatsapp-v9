// database/migrations/xxxx_add_gupshup_gsid_to_chats.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('gupshup_gs_id', 100).nullable().index().after('shippingcampaigns_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('gupshup_gs_id')
    })
  }
}
