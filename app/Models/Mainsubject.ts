import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Mainsubject extends BaseModel {

  static get fillable(){
    return[
      'id',
      'description',
      'excluded'
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public description:string

  @column()
  public excluded: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
