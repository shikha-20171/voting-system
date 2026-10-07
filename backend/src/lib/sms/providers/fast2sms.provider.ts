import { SmsOptions, SmsProvider, SmsSendResult } from '../types.js';

export interface Fast2SmsConfig {
  apiKey: string;
  senderId?: string;
  otpId: string;
  otpExpiryMinutes?: number;
}

export class Fast2SmsProvider implements SmsProvider {
  readonly name = 'fast2sms';
  private config: Fast2SmsConfig;

  constructor(config: Fast2SmsConfig) {
    this.config = config;
  }

  async sendOtp(mobileNumber: string, otpCode: string, _options?: SmsOptions): Promise<SmsSendResult> {
    if (!this.config.apiKey || !this.config.otpId) {
      return { success: false, provider: this.name, error: 'FAST2SMS_API_KEY / FAST2SMS_OTP_ID is not configured', timestamp: new Date() };
    }

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
      const response = await fetch('https://www.fast2sms.com/dev/otp/send', {
        method: 'POST',
        headers: { Authorization: this.config.apiKey, accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp_id: this.config.otpId,
          otp: otpCode,
          otp_length: 6,
          otp_expiry: this.config.otpExpiryMinutes || 5,
        }),
      });
      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || data.return !== true) {
        return { success: false, provider: this.name, error: Array.isArray(data.message) ? data.message[0] : (data.message || `Fast2SMS HTTP ${response.status}`), timestamp: new Date() };
      }
      return { success: true, messageId: data.request_id || `f2s-${Date.now()}`, provider: this.name, timestamp: new Date() };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err?.message || 'Fast2SMS network error', timestamp: new Date() };
    }
  }

  async verifyOtp(mobileNumber: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config.apiKey) return { success: false, error: 'FAST2SMS_API_KEY is not configured' };
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
      const response = await fetch('https://www.fast2sms.com/dev/otp/verify', {
        method: 'POST',
        headers: { Authorization: this.config.apiKey, accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, otp: otpCode }),
      });
      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || data.return !== true) {
        return { success: false, error: Array.isArray(data.message) ? data.message[0] : (data.message || `Fast2SMS HTTP ${response.status}`) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Fast2SMS verification network error' };
    }
  }

  async sendTransactional(mobileNumber: string, message: string, options?: SmsOptions): Promise<SmsSendResult> {
    if (!this.config.apiKey) {
      return {
        success: false,
        provider: this.name,
        error: 'FAST2SMS_API_KEY is not configured',
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sender_id: options?.senderId || this.config.senderId || 'TXTIND',
          language: 'english',
          route: 'v3',
          numbers: mobileNumber,
        }),
      });

      const data: any = await response.json();
      if (!response.ok || !data.return) {
        return {
          success: false,
          provider: this.name,
          error: data.message?.[0] || data.message || 'Fast2SMS dispatch failed',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: data.request_id || `f2s-${Date.now()}`,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || 'Fast2SMS network error',
        timestamp: new Date(),
      };
    }
  }
}
