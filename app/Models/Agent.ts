import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Agent extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public number_phone: string

  @column()
  public interval_init_query: number

  @column()
  public interval_final_query: number

  @column()
  public interval_init_message: number

  @column()
  public interval_final_message: number

  @column()
  public max_limit_message: number

  @column()
  public status: string

  @column()
  public active: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
