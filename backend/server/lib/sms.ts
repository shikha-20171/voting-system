const smsProvider = process.env.SMS_PROVIDER || 'console';

export async function sendOtpSms(mobileNumber: string, otpCode: string): Promise<{ sent: boolean; provider: string }> {
  if (process.env.NODE_ENV !== 'production' && smsProvider === 'console') {
    console.log(`[SMS] OTP to ${mobileNumber}: ${otpCode}`);
    return { sent: true, provider: 'console' };
  }

  if (smsProvider === 'msg91' && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        recipients: [{ mobiles: mobileNumber.replace(/\D/g, ''), var: otpCode }],
      }),
    });

    if (!response.ok) {
      throw new Error(`MSG91 SMS failed (${response.status})`);
    }

    return { sent: true, provider: 'msg91' };
  }

  if (smsProvider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const body = new URLSearchParams({
      To: mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber.replace(/\D/g, '')}`,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: `Your Kondapi Connect OTP is ${otpCode}. Valid for 5 minutes.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      throw new Error(`Twilio SMS failed (${response.status})`);
    }

    return { sent: true, provider: 'twilio' };
  }

  console.log(`[SMS fallback] OTP to ${mobileNumber}: ${otpCode}`);
  return { sent: false, provider: 'console-fallback' };
}
