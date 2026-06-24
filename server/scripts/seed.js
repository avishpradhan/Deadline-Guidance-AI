/**
 * Seed script — creates demo data for general-purpose productivity companion
 * Run: npm run seed (from server directory)
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

const DEMO_USER = {
  name: 'Rohan Sharma',
  email: 'demo@guardian.ai',
  passwordHash: 'demo1234',
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing demo data
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    if (existingUser) {
      await Task.deleteMany({ goalId: { $in: await Goal.find({ userId: existingUser._id }).distinct('_id') } });
      await ProgressLog.deleteMany({ userId: existingUser._id });
      await Goal.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('🗑️  Cleaned existing demo data');
    }

    // Create demo user
    const user = await User.create(DEMO_USER);
    console.log(`👤 Created demo user: ${user.email}`);

    const now = new Date();

    // === Goal 1: Professional (Work Deadline - 55% complete, medium risk) ===
    const goal1 = await Goal.create({
      userId: user._id,
      title: 'Deliver Client E-commerce Platform',
      category: 'work_deadline',
      deadline: addDays(now, 8),
      priority: 'high',
      dailyHours: 3,
      skillLevel: 'advanced',
      context: 'E-commerce store launch for retail client. Need to integrate stripe, catalog API, and deploy to AWS.',
      status: 'active',
      riskScore: 'medium',
      aiDecisionInsight: {
        summary: 'At your current pace, you are projected to complete the goal on time, but buffer capacity is tight.',
        recommendation: 'Focus on connecting the React shopping cart states first. Defer transaction email styling.',
        reasoning: 'State integration represents the highest remaining logical complexity. Clearing it early secures the core checkout flow.',
        confidence: 82,
      },
    });

    const goal1Tasks = [
      { phase: 'Planning & Backend', title: 'Setup project repo and database schemas', estimatedHours: 2, dueDate: addDays(now, -4), status: 'completed', completedAt: addDays(now, -4) },
      { phase: 'Planning & Backend', title: 'Design backend authentication & product API', estimatedHours: 2, dueDate: addDays(now, -3), status: 'completed', completedAt: addDays(now, -3) },
      { phase: 'Planning & Backend', title: 'Integrate Stripe payment checkout session backend', estimatedHours: 3, dueDate: addDays(now, -2), status: 'completed', completedAt: addDays(now, -2) },
      { phase: 'Planning & Backend', title: 'Build shopping cart and order processing pipeline', estimatedHours: 2.5, dueDate: addDays(now, -1), status: 'completed', completedAt: addDays(now, -1) },
      { phase: 'Frontend Integration', title: 'Connect react shopping cart states with APIs', estimatedHours: 3, dueDate: addDays(now, 0), status: 'pending' },
      { phase: 'Frontend Integration', title: 'Implement transactional email triggers', estimatedHours: 1.5, dueDate: addDays(now, 2), status: 'pending' },
      { phase: 'Testing & Deploy', title: 'Perform sandbox payment validation & security check', estimatedHours: 2, dueDate: addDays(now, 4), status: 'pending' },
      { phase: 'Testing & Deploy', title: 'Deploy staging build to AWS Amplify & EC2', estimatedHours: 3, dueDate: addDays(now, 6), status: 'pending' },
      { phase: 'Testing & Deploy', title: 'Final client walkthrough & handover', estimatedHours: 2, dueDate: addDays(now, 8), status: 'pending' },
    ];

    for (let i = 0; i < goal1Tasks.length; i++) {
      await Task.create({ ...goal1Tasks[i], goalId: goal1._id, order: i });
    }
    console.log(`🎯 Created goal: "${goal1.title}"`);

    // Progress logs for Goal 1
    for (let d = -4; d <= -1; d++) {
      await ProgressLog.create({
        goalId: goal1._id,
        userId: user._id,
        date: addDays(now, d),
        completedTaskIds: [],
        aiResponse: 'Milestone complete. Payment gateway validation is functional. Maintain current velocity.',
      });
    }

    // === Goal 2: Entrepreneur (Business / Startup - 30% complete, high risk) ===
    const goal2 = await Goal.create({
      userId: user._id,
      title: 'Launch Startup Landing Page',
      category: 'business_startup',
      deadline: addDays(now, 4),
      priority: 'critical',
      dailyHours: 2,
      skillLevel: 'intermediate',
      context: 'Product validation landing page for a new SaaS tool. Need email collection and Product Hunt pre-launch setup.',
      status: 'active',
      riskScore: 'high',
      aiDecisionInsight: {
        summary: 'At your current pace, you are likely to miss the launch deadline by 2 days due to overdue layout tasks.',
        recommendation: 'Focus on coding layouts today. Defer Product Hunt post drafting until layouts are finalized.',
        reasoning: 'The React & CSS layouts are on the critical path. Postponing marketing copy ensures you have a functional page to show.',
        confidence: 65,
      },
    });

    const goal2Tasks = [
      { phase: 'Setup & Copywriting', title: 'Define value propositions & wireframe page', estimatedHours: 2, dueDate: addDays(now, -3), status: 'completed', completedAt: addDays(now, -3) },
      { phase: 'Setup & Copywriting', title: 'Draft landing page body copy & signup CTA', estimatedHours: 1.5, dueDate: addDays(now, -2), status: 'completed', completedAt: addDays(now, -2) },
      { phase: 'Design & Code', title: 'Code landing page layouts in React & CSS', estimatedHours: 3, dueDate: addDays(now, -1), status: 'pending' }, // Missed task!
      { phase: 'Design & Code', title: 'Integrate email list collection form & database', estimatedHours: 2, dueDate: addDays(now, 1), status: 'pending' },
      { phase: 'Launch Prep', title: 'Setup analytics dashboards & feedback loops', estimatedHours: 1.5, dueDate: addDays(now, 2), status: 'pending' },
      { phase: 'Launch Prep', title: 'Draft Product Hunt post and launch announcement', estimatedHours: 2, dueDate: addDays(now, 3), status: 'pending' },
      { phase: 'Launch Prep', title: 'Launch page live on custom domain', estimatedHours: 2.5, dueDate: addDays(now, 4), status: 'pending' },
    ];

    for (let i = 0; i < goal2Tasks.length; i++) {
      await Task.create({ ...goal2Tasks[i], goalId: goal2._id, order: i });
    }
    console.log(`🎯 Created goal: "${goal2.title}"`);

    // === Goal 3: Personal User (Personal Commitment - 60% complete, low risk) ===
    const goal3 = await Goal.create({
      userId: user._id,
      title: 'Renew Passport & Travel Visa',
      category: 'personal_commitment',
      deadline: addDays(now, 14),
      priority: 'medium',
      dailyHours: 1,
      skillLevel: 'beginner',
      context: 'Gathering documents, passport photos, scheduling biometric appointments, and filing the visa petition.',
      status: 'active',
      riskScore: 'low',
      aiDecisionInsight: {
        summary: 'At your current pace, you are on track to complete visa applications with 4 days to spare.',
        recommendation: 'Attend the biometrics center on schedule. Confirm paperwork checklist is ready.',
        reasoning: 'Completing the appointment leaves ample time for Visa application processing, which has minor complexity.',
        confidence: 94,
      },
    });

    const goal3Tasks = [
      { phase: 'Biometrics & Passport', title: 'Confirm photo compliance guidelines and take photos', estimatedHours: 1, dueDate: addDays(now, -5), status: 'completed', completedAt: addDays(now, -5) },
      { phase: 'Biometrics & Passport', title: 'Print address proof & verify citizenship files', estimatedHours: 1, dueDate: addDays(now, -3), status: 'completed', completedAt: addDays(now, -3) },
      { phase: 'Biometrics & Passport', title: 'Schedule biometric appointment online', estimatedHours: 0.5, dueDate: addDays(now, -2), status: 'completed', completedAt: addDays(now, -2) },
      { phase: 'Biometrics & Passport', title: 'Complete application portal questionnaire', estimatedHours: 1.5, dueDate: addDays(now, -1), status: 'completed', completedAt: addDays(now, -1) },
      { phase: 'Submission & Visa', title: 'Attend appointment center to submit documents', estimatedHours: 2, dueDate: addDays(now, 1), status: 'pending' },
      { phase: 'Submission & Visa', title: 'Receive renewed passport booklet', estimatedHours: 1, dueDate: addDays(now, 8), status: 'pending' },
      { phase: 'Submission & Visa', title: 'Draft and file travel visa application form', estimatedHours: 2, dueDate: addDays(now, 12), status: 'pending' },
    ];

    for (let i = 0; i < goal3Tasks.length; i++) {
      await Task.create({ ...goal3Tasks[i], goalId: goal3._id, order: i });
    }
    console.log(`🎯 Created goal: "${goal3.title}"`);

    // === Goal 4: Student / Prep (Job Interview - 50% complete, low risk) ===
    const goal4 = await Goal.create({
      userId: user._id,
      title: 'Prepare for Amazon SDE Interview',
      category: 'job_interview',
      deadline: addDays(now, 10),
      priority: 'high',
      dailyHours: 3,
      skillLevel: 'intermediate',
      context: 'Brush up algorithms, data structures, and system design topics.',
      status: 'active',
      riskScore: 'low',
      aiDecisionInsight: {
        summary: 'At your current pace, you are well-prepared for SDE topics, holding a solid preparation speed.',
        recommendation: 'Focus on Whiteboard mock design sessions. Postpone DP optimization review.',
        reasoning: 'whiteboarding practice improves confidence in core system design, which carries high interview score weight.',
        confidence: 91,
      },
    });

    const goal4Tasks = [
      { phase: 'Coding Foundations', title: 'Solve 15 hashing and arrays exercises', estimatedHours: 3, dueDate: addDays(now, -4), status: 'completed', completedAt: addDays(now, -4) },
      { phase: 'Coding Foundations', title: 'Study DFS, BFS, and Dijkstra algorithms', estimatedHours: 3, dueDate: addDays(now, -3), status: 'completed', completedAt: addDays(now, -3) },
      { phase: 'Coding Foundations', title: 'Solve 10 medium graph tasks', estimatedHours: 3, dueDate: addDays(now, -2), status: 'completed', completedAt: addDays(now, -2) },
      { phase: 'Coding Foundations', title: 'Implement LRU cache system blueprint', estimatedHours: 2, dueDate: addDays(now, -1), status: 'completed', completedAt: addDays(now, -1) },
      { phase: 'System Design', title: 'Practice mock whiteboard sessions with peers', estimatedHours: 3, dueDate: addDays(now, 2), status: 'pending' },
      { phase: 'System Design', title: 'Review horizontal scaling and replication databases', estimatedHours: 2.5, dueDate: addDays(now, 4), status: 'pending' },
      { phase: 'System Design', title: 'Solve 5 dynamic programming problems', estimatedHours: 3, dueDate: addDays(now, 7), status: 'pending' },
      { phase: 'System Design', title: 'Take full timed mock coding test', estimatedHours: 3, dueDate: addDays(now, 9), status: 'pending' },
    ];

    for (let i = 0; i < goal4Tasks.length; i++) {
      await Task.create({ ...goal4Tasks[i], goalId: goal4._id, order: i });
    }
    console.log(`🎯 Created goal: "${goal4.title}"`);

    // === Goal 5: Event Planner (Event Planning - 40% complete, low risk) ===
    const goal5 = await Goal.create({
      userId: user._id,
      title: 'Organize Regional Developer Summit',
      category: 'event_planning',
      deadline: addDays(now, 12),
      priority: 'high',
      dailyHours: 2,
      skillLevel: 'intermediate',
      context: 'Coordinate developer summit for 200+ attendees. Need venue, caterer, speaker lineup, and sponsorship confirmation.',
      status: 'active',
      riskScore: 'low',
      aiDecisionInsight: {
        summary: 'At your current pace, regional summit logistics are structured and running on track.',
        recommendation: 'Confirm sponsor batch 1 before sending speaker invites.',
        reasoning: 'Securing sponsor commitments early guarantees budget availability for attendee badge and swag ordering.',
        confidence: 88,
      },
    });

    const goal5Tasks = [
      { phase: 'Contracts & Outreach', title: 'Finalize venue contract and booking dates', estimatedHours: 2, dueDate: addDays(now, -6), status: 'completed', completedAt: addDays(now, -6) },
      { phase: 'Contracts & Outreach', title: 'Launch Call for Papers speaker application form', estimatedHours: 1.5, dueDate: addDays(now, -4), status: 'completed', completedAt: addDays(now, -4) },
      { phase: 'Contracts & Outreach', title: 'Distribute sponsorship packets to partners', estimatedHours: 2, dueDate: addDays(now, -2), status: 'completed', completedAt: addDays(now, -2) },
      { phase: 'Schedule & Logistics', title: 'Confirm first batch of event sponsors', estimatedHours: 2, dueDate: addDays(now, 1), status: 'pending' },
      { phase: 'Schedule & Logistics', title: 'Review talk submissions & schedule slots', estimatedHours: 2, dueDate: addDays(now, 3), status: 'pending' },
      { phase: 'Schedule & Logistics', title: 'Order attendee badge prints & swag bags', estimatedHours: 1.5, dueDate: addDays(now, 6), status: 'pending' },
      { phase: 'Execution Details', title: 'Confirm AV setup requirements & lunch menus', estimatedHours: 2, dueDate: addDays(now, 9), status: 'pending' },
      { phase: 'Execution Details', title: 'Perform final audio-visual setup check', estimatedHours: 2, dueDate: addDays(now, 11), status: 'pending' },
    ];

    for (let i = 0; i < goal5Tasks.length; i++) {
      await Task.create({ ...goal5Tasks[i], goalId: goal5._id, order: i });
    }
    console.log(`🎯 Created goal: "${goal5.title}"`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Account:');
    console.log(`  Email:    ${DEMO_USER.email}`);
    console.log(`  Password: demo1234`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
