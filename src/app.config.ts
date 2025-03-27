import * as dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  mongoUrl: process.env.MONGO_URL,
  port: process.env.PORT || 3000,
  musicbrainurl: process.env.MUSICBRAINZSERVICE,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB || 0,
  },
};
