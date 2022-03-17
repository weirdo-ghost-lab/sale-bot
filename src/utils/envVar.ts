import 'dotenv/config';

export const {
  WEB3_API_ENDPOINT = '',
  DISCORD_WEBHOOK_URL = '',
  TWITTER_API_APP_KEY = '',
  TWITTER_API_APP_SECRET = '',
  TWITTER_API_USER_ACCESS_TOKEN = '',
  TWITTER_API_USER_SECRET = '',
} = process.env;
