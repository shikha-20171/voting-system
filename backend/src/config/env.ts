import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Security
  JWT_SECRET: z.string().default('kondapi-production-jwt-secret-key-change-in-env'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('kondapi-secure-cookie-secret-key-2026'),
  CORS_ORIGIN: z.string().default('*'),

  // OTP Configuration & Security Policies
  OTP_STATIC_CODE: z.string().default('123456'),
  OTP_EXPIRY_MS: z.coerce.number().default(300000), // 5 minutes
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_MS: z.coerce.number().default(60000), // 60 seconds
  OTP_RATE_LIMIT_MAX: z.coerce.number().default(5), // 5 requests per window
  OTP_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes

  // SMS Gateway Configuration
  SMS_PROVIDER: z.enum(['console', 'generic-http', 'http', 'custom', 'twilio', 'fast2sms', 'msg91']).default('console'),
  SMS_API_URL: z.string().optional(),
  SMS_HTTP_METHOD: z.enum(['POST', 'GET']).default('POST'),
  SMS_API_KEY: z.string().optional(),
  SMS_AUTH_HEADER: z.string().optional(),
  SMS_SENDER_ID: z.string().default('KNDTDP'),
  SMS_TEMPLATE: z.string().optional(),
  SMS_TEMPLATE_ID: z.string().optional(),
  SMS_PAYLOAD_MAP: z.string().optional(),

  // Vendor specific keys (optional fallbacks)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_SERVICE_SID: z.string().optional(),
  FAST2SMS_API_KEY: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),

  // AI & Analytics
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
