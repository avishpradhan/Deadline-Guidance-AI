import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true,
  },
  phase: {
    type: String,
    default: 'General',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  estimatedHours: {
    type: Number,
    default: 1,
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient goal+status queries
taskSchema.index({ goalId: 1, status: 1 });
taskSchema.index({ goalId: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
