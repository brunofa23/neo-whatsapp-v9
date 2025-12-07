import Env from '@ioc:Adonis/Core/Env'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Agent extends BaseModel {

  static get connection() {
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

      // 👇 novos atributos snake_case
      'provider_type',
      'megaapi_host',
      'megaapi_instance_key',
      'megaapi_token',

      'created_at',
      'updated_at',
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

  // 👇 provider_type = wwebjs | megaapi
  @column()
  public provider_type: 'wwebjs' | 'megaapi'

  @column()
  public qrcode: string

  @column()
  public statusconnected: boolean

  @column()
  public default_chat: boolean

  @column()
  public interaction_priority: string

  @column()
  public deleted: boolean

  @column()
  public company_id: number

  @column()
  public obs: string

  // 👇 informações específicas MegaAPI
  @column()
  public megaapi_host: string

  @column()
  public megaapi_instance_key: string

  @column()
  public megaapi_token: string

  @column.dateTime({ autoCreate: true })
  public created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updated_at: DateTime
}
