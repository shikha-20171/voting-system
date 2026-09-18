import { SmsOptions, SmsProvider, SmsSendResult } from '../types.js';

export interface Msg91Config {
  authKey: string;
  templateId?: string;
  senderId?: string;
}

export class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';
  private config: Msg91Config;

  constructor(config: Msg91Config) {
    this.config = config;
  }

  async sendOtp(mobileNumber: string, otpCode: string, options?: SmsOptions): Promise<SmsSendResult> {
    if (!this.config.authKey) {
      return {
        success: false,
        provider: this.name,
        error: 'MSG91_AUTH_KEY is not configured',
        timestamp: new Date(),
      };
    }

    try {
      const templateId = options?.templateId || this.config.templateId;
      const formattedMobile = mobileNumber.startsWith('91') ? mobileNumber : `91${mobileNumber}`;
      
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId || ''}&mobile=${formattedMobile}&otp=${otpCode}&authkey=${this.config.authKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: any = await response.json();
      if (!response.ok || data.type === 'error') {
        return {
          success: false,
          provider: this.name,
          error: data.message || 'MSG91 OTP dispatch failed',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: data.message || `msg91-${Date.now()}`,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || 'MSG91 network request error',
        timestamp: new Date(),
      };
    }
  }

  async sendTransactional(mobileNumber: string, message: string, options?: SmsOptions): Promise<SmsSendResult> {
    if (!this.config.authKey) {
      return {
        success: false,
        provider: this.name,
        error: 'MSG91_AUTH_KEY is not configured',
        timestamp: new Date(),
      };
    }

    try {
      const formattedMobile = mobileNumber.startsWith('91') ? mobileNumber : `91${mobileNumber}`;
      const sender = options?.senderId || this.config.senderId || 'KNDTDP';

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: this.config.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: options?.templateId || this.config.templateId,
          sender,
          short_url: '0',
          recipients: [
            {
              mobiles: formattedMobile,
              message,
            },
          ],
        }),
      });

      const data: any = await response.json();
      if (!response.ok || data.type === 'error') {
        return {
          success: false,
          provider: this.name,
          error: data.message || 'MSG91 flow message failed',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: data.message || `msg91-${Date.now()}`,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || 'MSG91 network request error',
        timestamp: new Date(),
      };
    }
  }
}
