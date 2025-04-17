import { formatTemplate, loadTemplate, type EmailScopes } from '@/utils/email';
import mailer, { mailerAuthConfig } from '@/config/email';
import logger from '@/utils/logger';
import ENV from '@/config/env';
import type { IUserProps } from '@/types';

const baseUrl = ENV.CLIENT_BASE_URL;
const supportEmail = String(mailerAuthConfig.user);
const currentYear = new Date().getFullYear();

// Send verification email
export const sendVerificationEmail = async (email: string, token: string) => {
  const template = loadTemplate('auth', 'email-verification');

  // format email template
  const html = formatTemplate<EmailScopes, 'email-verification'>(template, {
    verificationLink: `${baseUrl}/auth/verify-email?token=${token}`,
    supportEmail,
    currentYear,
  });

  // Send email
  const info = await mailer.sendMail({
    from: supportEmail,
    to: email,
    subject: 'Verify Your Email Address',
    html,
  });

  logger.info(`Verification Email Sent: ${info.messageId} - ${email}`);

  return info;
};

// Sign up success email
export const sendSignupSuccessEmail = async (user: IUserProps) => {
  const userPref = user.preferences;
  const userEmail = user.email;

  // Template
  const template = loadTemplate('auth', 'signup-success');

  // format email template
  const html = formatTemplate<EmailScopes, 'signup-success'>(template, {
    supportEmail,
    fullName: user.fullName,
    currentYear,
    currencySym: String(userPref.currencySym),
    dateFormat: String(userPref.dateFormat),
    timeFormat: String(userPref.timeFormat),
    theme: String(userPref.theme),
  });

  // Send email
  const info = await mailer.sendMail({
    from: supportEmail,
    to: userEmail,
    subject: 'Welcome to Horde!',
    html,
  });

  logger.info(`Signup email sent: ${info.messageId} - ${userEmail}`);

  return info;
};
