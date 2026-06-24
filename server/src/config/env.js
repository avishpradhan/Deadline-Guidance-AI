const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    missing.push('CLIENT_URL');
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please configure them in your environment.`
    );
  }
};
