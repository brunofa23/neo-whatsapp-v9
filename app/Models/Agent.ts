import Env from '@ioc:Adonis/Core/Env'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Agent extends BaseModel {


  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }


  public static get fillable() {
    return [
      'id',
      'name',
      'number_phone',
      'interval_init_query',
      'interval_final_query',
      'interval_init_message',
      'interval_final_message',
      'max_limit_message',
      'status',
      'active',
      'qrcode',
      'statusconnected',
      'default_chat',
      'interaction_priority',
      'deleted',
      'company_id',
      'obs',
      'provider_type',
      'createdAt',
      'updatedAt',
    ]
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

  @column()
  public providerType: 'wwebjs' | 'megaapi' // se quiser ser mais estrito no TS

  @column()
  public qrcode: string

  @column()
  public statusconnected: boolean

  @column()
  public default_chat: boolean

  @column()
  public interaction_priority: string //confirmation or evaluation

  @column()
  public deleted: boolean

  @column()
  public company_id: number

  @column()
  public obs: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
