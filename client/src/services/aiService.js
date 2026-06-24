import api from './api';

export const aiService = {
  async analyzeGoal(goalId) {
    const { data } = await api.post('/ai/analyze', { goalId });
    return data;
  },

  async checkinAnalyze(goalId, completedTasks, blockerNote) {
    const { data } = await api.post('/ai/checkin-analyze', {
      goalId,
      completedTasks,
      blockerNote,
    });
    return data;
  },

  async replan(goalId, missedTaskIds) {
    const { data } = await api.post('/ai/replan', { goalId, missedTaskIds });
    return data;
  },

  async acceptReplan(goalId, revisedTasks) {
    const { data } = await api.post('/ai/replan/accept', { goalId, revisedTasks });
    return data;
  },

  async getRisk(goalId) {
    const { data } = await api.post('/ai/risk', { goalId });
    return data;
  },
};
