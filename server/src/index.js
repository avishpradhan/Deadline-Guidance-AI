import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { app } from './app.js';
import { validateEnv } from './config/env.js';

const start = async () => {
  try {
    validateEnv();
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🛡️  Deadline Guardian API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
