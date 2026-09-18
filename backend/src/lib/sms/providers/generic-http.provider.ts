import { SmsOptions, SmsProvider, SmsSendResult } from '../types.js';

export interface GenericHttpSmsConfig {
  apiUrl: string;
  httpMethod?: 'POST' | 'GET';
  apiKey?: string;
  authHeader?: string;
  senderId?: string;
  template?: string;
  payloadTemplate?: string;
  extraHeaders?: Record<string, string>;
}

export class GenericHttpSmsProvider implements SmsProvider {
  readonly name = 'generic-http';
  private config: GenericHttpSmsConfig;

  constructor(config: GenericHttpSmsConfig) {
    this.config = config;
  }

  async sendOtp(mobileNumber: string, otpCode: string, options?: SmsOptions): Promise<SmsSendResult> {
    const sender = options?.senderId || this.config.senderId || 'KNDTDP';
    const rawTemplate = this.config.template || 'Your Kondapi Connect verification code is {OTP}. Valid for 5 minutes. Do not share.';
    const message = rawTemplate
      .replace(/\{OTP\}/gi, otpCode)
      .replace(/\{\{otp\}\}/gi, otpCode)
      .replace(/\{MOBILE\}/gi, mobileNumber)
      .replace(/\{\{mobile\}\}/gi, mobileNumber);

    return this.sendTransactional(mobileNumber, message, { ...options, senderId: sender });
  }

  async sendTransactional(mobileNumber: string, message: string, options?: SmsOptions): Promise<SmsSendResult> {
    if (!this.config.apiUrl) {
      return {
        success: false,
        provider: this.name,
        error: 'SMS_API_URL is not configured for Generic HTTP SMS Provider',
        timestamp: new Date(),
      };
    }

    const sender = options?.senderId || this.config.senderId || 'KNDTDP';
    const method = (this.config.httpMethod || 'POST').toUpperCase();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.extraHeaders || {}),
    };

    if (this.config.authHeader && this.config.apiKey) {
      headers[this.config.authHeader] = this.config.apiKey;
    } else if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      let url = this.config.apiUrl;
      let body: string | undefined;

      if (method === 'GET') {
        const queryParams = new URLSearchParams({
          mobile: mobileNumber,
          message,
          sender,
          ...(this.config.apiKey ? { apikey: this.config.apiKey } : {}),
          ...(options?.customParams || {}),
        });
        url = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
      } else {
        if (this.config.payloadTemplate) {
          body = this.config.payloadTemplate
            .replace(/\{\{mobile\}\}/gi, mobileNumber)
            .replace(/\{\{message\}\}/gi, JSON.stringify(message).slice(1, -1))
            .replace(/\{\{sender\}\}/gi, sender)
            .replace(/\{\{apiKey\}\}/gi, this.config.apiKey || '');
        } else {
          body = JSON.stringify({
            mobile: mobileNumber,
            message,
            sender,
            templateId: options?.templateId,
            entityId: options?.entityId,
            ...(options?.customParams || {}),
          });
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseText = await response.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: `Gateway returned status ${response.status}: ${responseText.slice(0, 200)}`,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: responseJson?.messageId || responseJson?.msgid || responseJson?.id || `http-${Date.now()}`,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: `Network error connecting to SMS Gateway: ${err?.message || err}`,
        timestamp: new Date(),
      };
    }
  }
}
