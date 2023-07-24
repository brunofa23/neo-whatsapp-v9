import { BaseModel, column, hasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


}
