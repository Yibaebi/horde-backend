import nodemailer from 'nodemailer';
import type SMTPConnection from 'nodemailer/lib/smtp-connection';
import ENV from './env';

const mailerAuthConfig: SMTPConnection.AuthenticationType = {
  type: 'OAuth2',
  user: ENV.HORDE_NODEMAILER_EMAIL,
  clientId: ENV.HORDE_NODEMAILER_GOOGLE_CLIENT_ID,
  clientSecret: ENV.HORDE_NODEMAILER_GOOGLE_CLIENT_SECRET,
  refreshToken: ENV.HORDE_NODEMAILER_GOOGLE_REFRESH_TOKEN,
};

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: mailerAuthConfig,
});

export { mailerAuthConfig };
export default mailer;
