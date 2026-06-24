import api from './api';

export const progressService = {
  async submitCheckin(goalId, date, completedTasks, blockerNote = '') {
    const { data } = await api.post('/progress/checkin', {
      goalId,
      date,
      completedTasks,
      blockerNote,
    });
    return data;
  },

  async getHistory(goalId) {
    const { data } = await api.get(`/progress/${goalId}/history`);
    return data;
  },
};
