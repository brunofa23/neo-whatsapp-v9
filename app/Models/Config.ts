import Env from '@ioc:Adonis/Core/Env'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DatetTime } from 'luxon';

export default class Config extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }



  public static get fillable() {
    return [
      'id',
      'name',
      'valuetext',
      'valuebool',
      'valueinteger',
      'valuedatetime',
    ]
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

  @column()
  public valuedatetime: DatetTime

}
