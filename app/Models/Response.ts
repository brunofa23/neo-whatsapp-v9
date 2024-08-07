import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Response extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'name',
      'message',
      'local',
      'company_id',
      'interaction_id',
      'created_at',
      'updated_at'
    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public name:string

  @column()
  public message:string

  @column()
  public local:string

  @column()
  public company_id:number

  @column()
  public interaction_id:number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
