// app/Models/Template.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Template extends BaseModel {
  public static table = 'templates'

  @column({ isPrimary: true })
  public id: number

  @column()
  public id_external: string

  @column()
  public type?: string | null

  @column()
  public title?: string | null

  @column()
  public description?: string | null

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
