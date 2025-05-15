import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'manifests'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('chat_id').notNullable().unsigned().references('chats.id').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('responsible',30).nullable()
      table.string('main_subject',30).nullable() //assunto principal
      table.string('report',500).nullable() //relato
      table.string('employee_involved').nullable() //funcionario envolvido
      table.string('medic_einvolved').nullable()//médico envolvido
      table.dateTime('date_limit').nullable() //()
      table.string('responsible_response',30).nullable() //responsável pela resposta
      table.string('root_cause',350).nullable() //analise causa raiz
      table.string('action',350).nullable() //ação
      table.dateTime('date_limit_action').nullable() //data limite para ação
      table.dateTime('date_limit_manifest').nullable()//data limite para manifesto
      table.string('obs').nullable()
      table.string('status',10).nullable()



      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
