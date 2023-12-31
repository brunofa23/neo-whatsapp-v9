import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Env from '@ioc:Adonis/Core/Env'

export default class Agent extends BaseModel {


  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }


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
