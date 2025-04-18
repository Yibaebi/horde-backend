import ENV from '@/config/env';

const BASE_URL = ENV.CLIENT_BASE_URL;

export default {
  AUTH: {
    VERIFY_EMAIL: `${BASE_URL}/auth/verify-email` as const,
    PASS_RESET: `${BASE_URL}/auth/reset-password` as const,
    GOOGLE_AUTH_AUTHORIZE: `${BASE_URL}/auth/google/authorize` as const,
    GOOGLE_AUTH_ERROR_REDIRECT: `${BASE_URL}/auth/google/error` as const,
  },

  DASHBOARD: {
    HOME: `${BASE_URL}/user/dashboard/home` as const,
  },
};
