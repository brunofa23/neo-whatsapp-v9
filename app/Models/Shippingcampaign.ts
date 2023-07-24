import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Chat from './Chat';

export default class Shippingcampaign extends BaseModel {

  static get connection() {
    return 'mssql2';
  }

  @column({ isPrimary: true })
  public id: number

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
  public phonevalid: boolean

  @column()
  public messagesent: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => Chat)
  public chat: HasOne<typeof Chat>
}
