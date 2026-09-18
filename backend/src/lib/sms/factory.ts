import { SmsProvider } from './types.js';
import { ConsoleSmsProvider } from './providers/console.provider.js';
import { GenericHttpSmsProvider } from './providers/generic-http.provider.js';
import { TwilioSmsProvider } from './providers/twilio.provider.js';
import { Fast2SmsProvider } from './providers/fast2sms.provider.js';
import { Msg91SmsProvider } from './providers/msg91.provider.js';
import { WhatsAppCloudProvider } from './providers/whatsapp-cloud.provider.js';

let activeProviderInstance: SmsProvider | null = null;

export class SmsProviderFactory {
  static getProvider(): SmsProvider {
    if (activeProviderInstance) {
      return activeProviderInstance;
    }

    const providerType = (process.env.SMS_PROVIDER || 'console').toLowerCase().trim();

    switch (providerType) {
      case 'generic-http':
      case 'http':
      case 'custom':
        activeProviderInstance = new GenericHttpSmsProvider({
          apiUrl: process.env.SMS_API_URL || '',
          httpMethod: (process.env.SMS_HTTP_METHOD as 'POST' | 'GET') || 'POST',
          apiKey: process.env.SMS_API_KEY || '',
          authHeader: process.env.SMS_AUTH_HEADER || 'Authorization',
          senderId: process.env.SMS_SENDER_ID || 'KNDTDP',
          template: process.env.SMS_TEMPLATE,
          payloadTemplate: process.env.SMS_PAYLOAD_MAP,
        });
        break;

      case 'twilio':
        activeProviderInstance = new TwilioSmsProvider({
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_FROM_NUMBER || '',
          serviceSid: process.env.TWILIO_SERVICE_SID || '',
        });
        break;

      case 'fast2sms':
        activeProviderInstance = new Fast2SmsProvider({
          apiKey: process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || '',
          senderId: process.env.SMS_SENDER_ID || 'TXTIND',
        });
        break;

      case 'msg91':
        activeProviderInstance = new Msg91SmsProvider({
          authKey: process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY || '',
          templateId: process.env.MSG91_TEMPLATE_ID || process.env.SMS_TEMPLATE_ID,
          senderId: process.env.SMS_SENDER_ID || 'KNDTDP',
        });
        break;

      case 'whatsapp':
      case 'whatsapp-cloud':
      case 'meta-whatsapp':
        activeProviderInstance = new WhatsAppCloudProvider();
        break;

      case 'console':
      default:
        activeProviderInstance = new ConsoleSmsProvider();
        break;
    }

    console.log(`[SMS Provider] Initialized "${activeProviderInstance.name}" SMS gateway provider.`);
    return activeProviderInstance;
  }

  static setProvider(provider: SmsProvider) {
    activeProviderInstance = provider;
  }

  static reset() {
    activeProviderInstance = null;
  }
}
