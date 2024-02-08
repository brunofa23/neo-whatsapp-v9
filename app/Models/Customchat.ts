import Env from '@ioc:Adonis/Core/Env'
import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Chat from './Chat'

export default class Customchat extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }

  public static get fillable() {
    return [
      'id',
      'chats_id',
      'idexternal',
      'reg',
      'cellphone',
      'cellphoneserialized',
      'message',
      'response',
      'returned',
      'chatname',
      'messagesent',
      'read',
      'viewed',
      'phonevalid'
    ]
  }

  @hasOne(() => Chat, {
    foreignKey: 'id',
    localKey: 'chats_id'
  })
  public chat: HasOne<typeof Chat>

  @column({ isPrimary: true })
  public id: number
  @column()
  public chats_id: number
  @column()
  public idexternal: number
  @column()
  public reg: number
  @column()
  public cellphone: string
  @column()
  public cellphoneserialized: string
  @column()
  public message: string
  @column()
  public response: string
  @column()
  public returned: boolean
  @column()
  public chatname: string
  @column()
  public chatnumber: string
  @column()
  public messagesent: boolean
  @column()
  public read: boolean
  @column()
  public viewed: boolean
  @column()
  public phonevalid: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
