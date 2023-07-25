import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client } from 'whatsapp-web.js';

import { verifyNumber } from '../VerifyNumber'


export default async (client: Client, chat: Chat) => {

  console.log("confirmação de agenda confimrada!!!!")
  return "teste confirm schedule"


}
