import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Manifest extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'chat_id',
      'responsible',
      'main_subject',
      'report',
      'employee_involved',
      'medic_einvolved',
      'date_limit',
      'respnsible_response',
      'root_cause',
      'action',
      'date_limit_action',
      'date_limit_manifest',
      'obs',
      'status',
    ]
  }

  
  @column({ isPrimary: true })
  public id: number

  @column()
  public chat_id: number
  @column()
  public responsible: string
  @column()
  public main_subject: string
  @column()
  public report: string
  @column()
  public employee_involved: string
  @column()
  public medic_einvolved: string

  @column.dateTime()
  public date_limit: DateTime

  @column()
  public respnsible_response: string
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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
