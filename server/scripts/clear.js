/**
 * Clear script — deletes all data from the database
 * Run: node scripts/clear.js (from server directory)
 */
import dotenv from 'dotenv';
dotenv.config();

import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('⚠️ Failed to set DNS servers:', err.message);
}

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Goal from '../src/models/Goal.js';
import Task from '../src/models/Task.js';
import ProgressLog from '../src/models/ProgressLog.js';
import AIOutput from '../src/models/AIOutput.js';

const clear = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Wipe all collections
    const taskRes = await Task.deleteMany({});
    const progressRes = await ProgressLog.deleteMany({});
    const aiOutputRes = await AIOutput.deleteMany({});
    const goalRes = await Goal.deleteMany({});
    const userRes = await User.deleteMany({});

    console.log('🗑️  Database cleared successfully:');
    console.log(`  - Deleted ${taskRes.deletedCount} tasks`);
    console.log(`  - Deleted ${progressRes.deletedCount} progress logs`);
    console.log(`  - Deleted ${aiOutputRes.deletedCount} AI outputs`);
    console.log(`  - Deleted ${goalRes.deletedCount} goals`);
    console.log(`  - Deleted ${userRes.deletedCount} users`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Clear failed:', err);
    process.exit(1);
  }
};

clear();
