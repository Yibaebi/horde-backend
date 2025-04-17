import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define email scope types
export type EmailScopes = 'auth';

// Define templates available for each scope
export type EmailScopeTemplates = {
  auth: {
    'email-verification': {
      verificationLink: string;
      supportEmail: string;
      currentYear: number;
    };
    welcome: {
      fullName: string;
      dashboardUrl: string;
      currentYear: number;
    };
  };
};

// Load template file from filesystem
export const loadTemplate = <S extends EmailScopes>(
  scope: S,
  templateName: keyof EmailScopeTemplates[S]
): string => {
  const templatePath = path.join(
    __dirname,
    `../templates/${scope}`,
    `${templateName as string}.html`
  );

  return fs.readFileSync(templatePath, 'utf8');
};

// Format template by replacing placeholders
export const formatTemplate = <S extends EmailScopes, T extends keyof EmailScopeTemplates[S]>(
  template: string,
  replacements: EmailScopeTemplates[S][T]
): string => {
  let formatted = template;

  for (const [key, value] of Object.entries(replacements as object)) {
    formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  return formatted;
};
