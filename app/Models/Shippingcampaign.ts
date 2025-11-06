import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import Chat from './Chat';
import Env from '@ioc:Adonis/Core/Env'


export default class Shippingcampaign extends BaseModel {

  static get connection() {
    //return 'mysql';
    return Env.get('DB_CONNECTION_MAIN')
  }

  public static get fillable() {
    return [
      'id',
      'interaction_id',
      'interaction_seq',
      'idexternal',
      'idexternal_array',
      'reg',
      'name',
      'cellphone',
      'cellphoneserialized',
      'message',
      'otherfields',
      'phonevalid',
      'messagesent',
      'dateshedule',
      'doctor',
      'unit',
      'unit_cod',
      'attendant',
      'covenant',
      'dateservice',
      'prioritysend',
      'resend',
      'excluded',
      'justify_excluded',
      'date_first_return',
      'company_id',
      'phone_unit',
      'type_service',
      'created_at',
      'updated_at',
      'filePath'
    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public interaction_id: number

  @column()
  public interaction_seq: number

  @column()
  public idexternal: number

  @column()
  public idexternal_array:string

  @column()
  public reg: number

  @column()
  public name: string

  @column()
  public cellphone: string

  @column()
  public cellphoneserialized: string

  @column()
  public message: string

  @column()
  public otherfields: string

  @column()
  public phonevalid: boolean

  @column()
  public messagesent: boolean

  @column()
  public dateshedule: DateTime

  @column()
  public doctor: string

  @column()
  public unit: string

  @column()
  public unit_cod:string

  @column()
  public attendant: string

  @column()
  public covenant: string

  @column()
  public dateservice: DateTime

  @column()
  public prioritysend: boolean

  @column()
  public resend:number

  @column()
  public excluded: boolean

  @column()
  public justify_excluded:string

  @column.dateTime()
  public date_first_return:DateTime

  @column()
  public company_id:number

  @column()
  public phone_unit:string

  @column()
  public type_service:string

  @column()
  public file_path:string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime



  @hasOne(() => Chat, {
    foreignKey: 'shippingcampaigns_id'
  })
  public chat: HasOne<typeof Chat>
}
