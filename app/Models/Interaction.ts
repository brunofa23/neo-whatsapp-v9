import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Interaction extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public seq: number

  @column()
  public name: string

  @column()
  public query: string

  @column()
  public querydev: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
