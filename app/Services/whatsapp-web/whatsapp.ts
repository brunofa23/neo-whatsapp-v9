import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import Mehtods from '../../Services/whatsapp-web/ChatMonitoring/ClientMethods'
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'

async function executeWhatsapp(logout: boolean = false) {

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import Mehtods from '../../Services/whatsapp-web/ChatMonitoring/ClientMethods'
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'

async function executeWhatsapp(logout: boolean = false) {

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
  