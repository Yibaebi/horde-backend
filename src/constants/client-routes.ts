import ENV from '@/config/env';

const BASE_URL = ENV.CLIENT_BASE_URL;

export default {
  AUTH: {
    VERIFY_EMAIL: `${BASE_URL}/auth/verify-email`,
  },

  DASHBOARD: {
    HOME: `${BASE_URL}/user/dashboard/home`,
  },
};
