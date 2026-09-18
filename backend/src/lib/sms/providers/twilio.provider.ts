import { SmsOptions, SmsProvider, SmsSendResult } from '../types.js';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber?: string;
  serviceSid?: string;
}

export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  async sendOtp(mobileNumber: string, otpCode: string, options?: SmsOptions): Promise<SmsSendResult> {
    const message = `Your Kondapi TDP Connect verification code is ${otpCode}. Valid for 5 minutes.`;
    return this.sendTransactional(mobileNumber, message, options);
  }

  async sendTransactional(mobileNumber: string, message: string, _options?: SmsOptions): Promise<SmsSendResult> {
    const hasSender = Boolean(this.config.fromNumber || this.config.serviceSid);
    if (!this.config.accountSid || !this.config.authToken || !hasSender) {
      return {
        success: false,
        provider: this.name,
        error: 'Twilio credentials not configured (Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER or TWILIO_SERVICE_SID)',
        timestamp: new Date(),
      };
    }

    try {
      const formattedTo = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');

      const paramsObj: Record<string, string> = {
        To: formattedTo,
        Body: message,
      };

      if (this.config.serviceSid) {
        paramsObj.MessagingServiceSid = this.config.serviceSid;
      } else if (this.config.fromNumber) {
        paramsObj.From = this.config.fromNumber;
      }

      const params = new URLSearchParams(paramsObj);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await response.json();
      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: data.message || `Twilio error code ${data.code}`,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: data.sid,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || 'Twilio network request failed',
        timestamp: new Date(),
      };
    }
  }
}
