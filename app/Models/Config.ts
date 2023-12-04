import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Env from '@ioc:Adonis/Core/Env'

export default class Config extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }
  
  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public valuetext: string

  @column()
  public valuebool: boolean

  @column()
  public valueinteger: number

}
