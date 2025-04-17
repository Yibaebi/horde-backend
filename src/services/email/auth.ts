import { formatTemplate, loadTemplate, type EmailScopes } from '@/utils/email';
import mailer, { mailerAuthConfig } from '@/config/email';
import clientRoutes from '@/constants/client-routes';
import logger from '@/utils/logger';
import type { IUserProps } from '@/types';

const supportEmail = String(mailerAuthConfig.user);
const currentYear = new Date().getFullYear();

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

  const info = await mailer.sendMail({
    from: supportEmail,
    to: userEmail,
    subject: 'Welcome to Horde!',
    html,
  });

  logger.info(`Signup email sent: ${info.messageId} - ${userEmail}`);

  return info;
};
