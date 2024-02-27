"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const whatsappConnection_1 = require("../../Services/whatsapp-web/whatsappConnection");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const util_1 = require("../../Services/whatsapp-web/util");
const luxon_1 = require("luxon");
class AgentsController {
  async index({ response }) {
    const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
    const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
    try {
      const data = await Agent_1.default.query();
      const agents = [];
      for (const agent of data) {
        const totMessage = await Chat_1.default.query()
          .where('chatname', agent.name)
          .andWhereBetween('created_at', [dateStart, dateEnd])
          .count('* as totMessage').first();
        agents.push({
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
          interval_init_query: agent.interval_init_query,
          interval_final_query: agent.interval_final_query,
          interval_init_message: agent.interval_init_message,
          interval_final_message: agent.interval_final_message,
          max_limit_message: agent.max_limit_message,
          status: agent.status,
          statusconnected: agent.statusconnected,
          qrcode: agent.qrcode,
          totMessage: totMessage?.$extras.totMessage
        });
      }
      return response.status(200).send(agents);
    }
    catch (error) {
      return error;
    }
  }
  async store({ request, response }) {
    const body = request.only(Agent_1.default.fillable);
    try {
      const data = await Agent_1.default.create(body);
      return response.status(201).send(data);
    }
    catch (error) {
      return error;
    }
  }
  async update({ params, request, response }) {
    console.log('agent update:', params.id);
    const body = request.only(Agent_1.default.fillable);
    try {
      const data = await Agent_1.default.query().where('id', params.id)
        .update(body);
      return response.status(201).send(data);
    }
    catch (error) {
      return error;
    }
  }
  async connection({ params, request, response }) {
    try {
      await Agent_1.default.query()
        .where('id', params.id)
        .update({ statusconnected: false });
      const agent = await Agent_1.default.query().where('id', params.id).first();
      console.log("conectando...");
      await (0, whatsappConnection_1.startAgent)(agent);
      return response.status(201).send('Connected');
    }
    catch (error) {
      error;
    }
  }
  async connectionAll({ response }) {
    try {
      console.log("connection all acionado...");
      // await Agent_1.default.query().update({ statusconnected: false });
      // const agents = await Agent_1.default.query();
      // for (const agent of agents) {
      //     console.log("Conectando agente:", agent.id);
      //     await (0, whatsappConnection_1.startAgent)(agent);
      // }
      // return response.status(201).send('ConnectedAll');
    }
    catch (error) {
      error;
    }
  }
}
exports.default = AgentsController;
//# sourceMappingURL=AgentsController.js.map
