import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Unit extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'id_unit',
      'name',
      'address',
      'phone',
    ]
  }

  @column({ isPrimary: true })
  public id: number
  @column()
  public id_unit: number
  @column()
  public name: string
  @column()
  public address: string
  @column()
  public phone: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
