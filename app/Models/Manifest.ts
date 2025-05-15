import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Mainsubject from './Mainsubject'
import Chat from './Chat'

export default class Manifest extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'chat_id',
      'mainsubject_id',
      'user_responsible_id',
      'responsible',
      'main_subject',
      'complement',
      'report',
      'employee_involved',
      'medic_einvolved',
      'date_limit',
      'responsible_response',
      'root_cause',
      'action',
      'date_limit_action',
      'date_limit_manifest',
      'obs',
      'status',
      'justification'
    ]
  }

  @hasOne(() => User, {
    foreignKey: 'id',
    localKey: 'user_responsible_id'
  })
  public user: HasOne<typeof User>

  @hasOne(() => Mainsubject, {
    foreignKey: 'id',
    localKey: 'mainsubject_id'
  })
  public mainsubject: HasOne<typeof Mainsubject>

  @hasOne(() => Chat, {
    foreignKey: 'id',
    localKey: 'chat_id'
  })
  public chat: HasOne<typeof Chat>


  @column({ isPrimary: true })
  public id: number

  @column()
  public chat_id: number

  @column()
  public mainsubject_id: number

  @column()
  public user_responsible_id: number

  @column()
  public responsible: string
  @column()
  public main_subject: string

  @column()
  public complement: string

  @column()
  public report: string
  @column()
  public employee_involved: string
  @column()
  public medic_einvolved: string

  @column.dateTime()
  public date_limit: DateTime

  @column()
  public responsible_response: string
  @column()
  public root_cause: string
  @column()
  public action: string

  @column.dateTime()
  public date_limit_action: DateTime

  @column.dateTime()
  public date_limit_manifest: DateTime

  @column()
  public obs: string
  @column()
  public status: string

  @column()
  public justification: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}



