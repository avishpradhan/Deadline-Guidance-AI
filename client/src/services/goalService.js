import api from './api';

export const goalService = {
  async getAll() {
    const { data } = await api.get('/goals');
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/goals/${id}`);
    return data;
  },

  async create(goalData) {
    const { data } = await api.post('/goals', goalData);
    return data;
  },

  async update(id, goalData) {
    const { data } = await api.put(`/goals/${id}`, goalData);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/goals/${id}`);
    return data;
  },

  async complete(id) {
    const { data } = await api.post(`/goals/${id}/complete`);
    return data;
  },
};
