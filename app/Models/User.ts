import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel } from '@ioc:Adonis/Lucid/Orm'
import Env from '@ioc:Adonis/Core/Env'


export default class User extends BaseModel {


  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }



  public static get fillable() {
    return [
      'id',
      'username',
      'name',
      'email',
      'password',
      'remember_me_token',
    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column()
  public name: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
