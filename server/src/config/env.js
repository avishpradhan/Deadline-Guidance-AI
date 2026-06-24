const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.example to .env and fill in the values.`
    );
  }
};
