import { SmsOptions, SmsProvider, SmsSendResult } from '../types.js';

export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';

  async sendOtp(mobileNumber: string, otpCode: string, options?: SmsOptions): Promise<SmsSendResult> {
    const sender = options?.senderId || 'KNDTDP';
    console.log(`\n======================================================`);
    console.log(`📲 [SMS GATEWAY: CONSOLE] OTP Dispatch`);
    console.log(`To: +91 ${mobileNumber}`);
    console.log(`Sender ID: ${sender}`);
    console.log(`Message: Your Kondapi TDP Connect verification code is ${otpCode}. Valid for 5 minutes. Do not share.`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: this.name,
      timestamp: new Date(),
    };
  }

  async sendTransactional(mobileNumber: string, message: string, options?: SmsOptions): Promise<SmsSendResult> {
    const sender = options?.senderId || 'KNDTDP';
    console.log(`\n======================================================`);
    console.log(`📲 [SMS GATEWAY: CONSOLE] Transactional Message`);
    console.log(`To: +91 ${mobileNumber}`);
    console.log(`Sender ID: ${sender}`);
    console.log(`Message: ${message}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
