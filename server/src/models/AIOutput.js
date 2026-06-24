import mongoose from 'mongoose';

const aiOutputSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true,
  },
  agentType: {
    type: String,
    enum: ['goal_analysis', 'task_decomposition', 'accountability', 'risk_prediction', 'recovery'],
    required: true,
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

export default mongoose.model('AIOutput', aiOutputSchema);
