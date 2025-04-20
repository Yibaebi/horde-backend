import { formatTemplate, loadTemplate, type EmailScopes } from '@/utils/email';
import mailer, { mailerAuthConfig } from '@/config/email';
import clientRoutes from '@/constants/client-routes';
import logger from '@/utils/logger';
import ENV from '@/config/env';
import type { IUserProps } from '@/types';

const supportEmail = `${ENV.APP_NAME} <${String(mailerAuthConfig.user)}>`;
const currentYear = new Date().getFullYear();

// Email body config
const getEmailBody = (email: string, html: string, subject: string) => ({
  from: supportEmail,
  to: email,
  subject,
  html,
});

// Send verification email
export const sendVerificationEmail = async (email: string, token: string) => {
  const template = loadTemplate('auth', 'email-verification');

  // format email template
  const html = formatTemplate<EmailScopes, 'email-verification'>(template, {
    supportEmail,
    currentYear,
    verificationLink: `${clientRoutes.AUTH.VERIFY_EMAIL}?token=${token}`,
  });

  // Send email
  const info = await mailer.sendMail(getEmailBody(email, html, 'Password Reset Request.'));

  logger.info(`Verification Email Sent: ${info.messageId} - ${email}`);

  return info;
};

// Sign up success email
export const sendSignupSuccessEmail = async (user: IUserProps) => {
  // Template
  const template = loadTemplate('auth', 'welcome');

  // format email template
  const html = formatTemplate<EmailScopes, 'welcome'>(template, {
    fullName: user.fullName,
    currentYear,
    dashboardUrl: clientRoutes.DASHBOARD.HOME,
  });

  // Send email
  const userEmail = user.email;
  const info = await mailer.sendMail(getEmailBody(userEmail, html, 'Welcome to Horde!'));

  logger.info(`Signup email sent: ${info.messageId} - ${userEmail}`);

  return info;
};

// Send Reset Pass Mail
export const sendPassResetEmail = async (user: IUserProps, token: string) => {
  // Template
  const template = loadTemplate('auth', 'pass-reset');

  // format email template
  const html = formatTemplate<EmailScopes, 'pass-reset'>(template, {
    supportEmail,
    currentYear,
    fullName: user.fullName,
    resetLink: `${clientRoutes.AUTH.PASS_RESET}?token=${token}`,
  });

  // Send email
  const userEmail = user.email;
  const info = await mailer.sendMail(getEmailBody(userEmail, html, 'Password Reset'));

  logger.info(`Password reset email sent: ${info.messageId} - ${userEmail}`);

  return info;
};

// Send Reset Pass Success mail
export const sendPassResetSuccessEmail = async (user: IUserProps) => {
  // Template
  const template = loadTemplate('auth', 'pass-reset-confirm');

  // format email template
  const html = formatTemplate<EmailScopes, 'pass-reset-confirm'>(template, {
    supportEmail,
    currentYear,
    fullName: user.fullName,
  });

  // Send email
  const userEmail = user.email;
  const info = await mailer.sendMail(getEmailBody(userEmail, html, 'Password Reset Successful'));

  logger.info(`Password reset success email sent: ${info.messageId} - ${userEmail}`);

  return info;
};
