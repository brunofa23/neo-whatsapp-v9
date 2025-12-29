import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'

export default class Interaction extends BaseModel {
  static get connection() {
    return Env.get('DB_CONNECTION_MAIN')
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public seq: number

  @column()
  public name: string

  @column()
  public query: string

  @column()
  public querydev: string

  // ✅ NOVO: template id do Gupshup
  @column({ columnName: 'id_templates_gupshup' })
  public idTemplatesGupshup: string

  @column()
  public status: boolean

  @column()
  public maxsendlimit: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
