import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: 200,
  },
  category: {
    type: String,
    enum: [
      'exam_prep',
      'job_interview',
      'project',
      'skill_learning',
      'work_deadline',
      'personal_commitment',
      'business_startup',
      'event_planning',
      'other',
    ],
    default: 'other',
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  dailyHours: {
    type: Number,
    min: 0.5,
    max: 16,
    default: 3,
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  context: {
    type: String,
    maxlength: 2000,
    default: '',
  },
  status: {
    type: String,
    enum: ['planning', 'analyzing', 'active', 'completed', 'archived'],
    default: 'planning',
  },
  riskScore: {
    type: String,
    enum: ['low', 'medium', 'high', null],
    default: null,
  },
  constraints: [
    {
      type: {
        type: String,
        enum: [
          'travel',
          'exam',
          'interview',
          'meeting',
          'family_event',
          'work_deadline',
          'hackathon',
          'other',
        ],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      duration: {
        type: String,
        default: '',
      },
      notes: {
        type: String,
        default: '',
      },
    },
  ],
  events: [
    {
      name: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      time: {
        type: String,
        required: true,
      },
    },
  ],
  aiDecisionInsight: {
    summary: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0,
    },
    goalForecast: {
      type: String,
      default: '',
    },
    insightDelta: {
      probabilityChange: { type: Number, default: 0 },
      healthScoreChange: { type: Number, default: 0 },
      forecastDateChange: { type: Number, default: 0 },
      explanation: { type: String, default: '' },
    },
    changeDrivers: [
      {
        factor: { type: String },
        impact: { type: Number },
      }
    ],
    riskDrivers: [
      {
        type: { type: String, enum: ['positive', 'negative'] },
        factor: { type: String },
      }
    ],
    highestImpactAction: {
      action: { type: String, default: '' },
      beforeProbability: { type: Number, default: 0 },
      afterProbability: { type: Number, default: 0 },
    },
    scenarios: [
      {
        name: { type: String },
        successProbability: { type: Number },
      }
    ],
    bottlenecks: [
      {
        task: { type: String },
        blockedTasks: { type: Number },
        impact: { type: String },
      }
    ],
    reasoning: {
      type: String,
      default: '',
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    confidenceReasons: [
      {
        type: String,
      }
    ],
  },
}, {
  timestamps: true,
});

// Compound index for efficient user+status queries
goalSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Goal', goalSchema);
