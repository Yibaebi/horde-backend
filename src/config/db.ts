import mongoose from 'mongoose';
import ENV from '@/config/env';
import logger from '@/utils/logger';

const startDB = async () => {
  try {
    await mongoose.connect(ENV.DATABASE_URL);

    logger.info(`Connected to ${ENV.DATABASE_URL}...`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

export default startDB;
