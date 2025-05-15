import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Faq extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'ask',
      'answer',
      'behavior',
      'created_at',
      'updated_at'
    ]
  }

  @column({ isPrimary: true })
  public id: number
  @column()
  public ask: string
  @column()
  public answer: string
  @column()
  public behavior: string
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
