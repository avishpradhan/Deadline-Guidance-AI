import mongoose from 'mongoose';

const progressLogSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  completedTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  blockerNote: {
    type: String,
    default: '',
  },
  aiResponse: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

progressLogSchema.index({ goalId: 1, date: -1 });

export default mongoose.model('ProgressLog', progressLogSchema);
