import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.COOKIE_SECURE = 'false';
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:8080';
process.env.JWT_ACCESS_TTL_SECONDS = '900';
process.env.JWT_REFRESH_TTL_DAYS = '7';
process.env.BCRYPT_ROUNDS = '10';
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-with-more-than-thirty-two-characters-123456';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-with-more-than-thirty-two-characters-654321';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://incidenthub:incidenthub@localhost:5432/incidenthub?schema=public';
