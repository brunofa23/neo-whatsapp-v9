import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Chat from './Chat';
import Env from '@ioc:Adonis/Core/Env'


export default class Shippingcampaign extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
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
  public otherfields: string

  @column()
  public phonevalid: boolean

  @column()
  public messagesent: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => Chat, {
    foreignKey: 'shippingcampaigns_id'
  })
  public chat: HasOne<typeof Chat>
}
