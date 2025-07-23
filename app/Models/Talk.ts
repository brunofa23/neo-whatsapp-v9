import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Talk extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'chat_id',
      'reg',
      'cellphone',
      'cellphoneserialized',
      'message',
      'message_ack',
      'chatnumber',
      'type',
      'created_at',
      'updated_at'
    ]
  }


  @column({ isPrimary: true })
  public id: number
  @column()
  public chat_id: number
  @column()
  public reg: number
  @column()
  public cellphone: string
  @column()
  public cellphoneserialized: string
  @column()
  public message: string
  @column()
  public message_ack: number
  @column()
  public chatnumber: string
  @column()
  public type: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
