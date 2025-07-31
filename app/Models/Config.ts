<<<<<<< HEAD
import Env from '@ioc:Adonis/Core/Env'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DatetTime } from 'luxon';
=======
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Env from '@ioc:Adonis/Core/Env'
>>>>>>> development

export default class Config extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }
<<<<<<< HEAD



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



=======
  
>>>>>>> development
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

<<<<<<< HEAD
  @column()
  public valuedatetime: DatetTime

=======
>>>>>>> development
}
