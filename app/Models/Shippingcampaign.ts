import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Shippingcampaign extends BaseModel {

  static get connection() {
    return 'mssql2';
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public gender: string

  @column()
  public cellphone: string

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
}
