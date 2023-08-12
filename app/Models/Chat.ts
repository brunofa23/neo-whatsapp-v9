import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Shippingcampaign from './Shippingcampaign'

export default class Chat extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public shippingcampaigns_id: number

  @column()
  public interaction_id: number

  @column()
  public interaction_seq: number

  @column()
  public idexternal: number

  @column()
  public reg: number

  @column()
  public name: string

  @column()
  public cellphone: string

  @column()
  public cellphoneserialized: string

  @column()
  public message: string

  @column()
  public response: string

  @column()
  public invalidresponse: string

  @column()
  public returned: boolean

  @column()
  public chatname: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  @hasOne(() => Shippingcampaign, {
    foreignKey: 'id',
    localKey: 'shippingcampaigns_id'
  })
  public shippingcampaign: HasOne<typeof Shippingcampaign>

}
