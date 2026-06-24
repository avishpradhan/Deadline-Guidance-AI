import { create } from 'zustand';
import { goalService } from '../services/goalService';
import { aiService } from '../services/aiService';

const useGoalStore = create((set, get) => ({
  goals: [],
  currentGoal: null,
  tasks: [],
  dashboard: null,
  isLoading: false,
  error: null,
  analyzingPromises: {},

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const { goals } = await goalService.getAll();
      set({ goals, isLoading: false, error: null });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Failed to fetch goals' });
    }
  },

  fetchGoalDetail: async (id) => {
    set({ isLoading: true });
    try {
      const data = await goalService.getById(id);
      set({
        currentGoal: data.goal,
        tasks: data.tasks || [],
        isLoading: false,
        error: null,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Failed to fetch goal' });
      return null;
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true });
    try {
      const data = await goalService.create(goalData);
      // Add to local goals list
      set((state) => ({
        goals: [...state.goals, data.goal || data],
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Failed to create goal' });
      return null;
    }
  },

  analyzeGoal: async (goalId) => {
    const state = get();
    if (state.analyzingPromises[goalId]) {
      return state.analyzingPromises[goalId];
    }

    const promise = (async () => {
      set({ isLoading: true });
      try {
        const data = await aiService.analyzeGoal(goalId);
        set((state) => {
          const nextPromises = { ...state.analyzingPromises };
          delete nextPromises[goalId];
          return { analyzingPromises: nextPromises, isLoading: false, error: null };
        });
        return data;
      } catch (err) {
        set((state) => {
          const nextPromises = { ...state.analyzingPromises };
          delete nextPromises[goalId];
          return {
            analyzingPromises: nextPromises,
            isLoading: false,
            error: err.response?.data?.error || 'AI analysis failed'
          };
        });
        return null;
      }
    })();

    set((state) => ({
      analyzingPromises: { ...state.analyzingPromises, [goalId]: promise }
    }));

    return promise;
  },

  completeGoal: async (id) => {
    try {
      const data = await goalService.complete(id);
      set((state) => ({
        goals: state.goals.map((g) =>
          g._id === id ? { ...g, status: 'completed' } : g
        ),
      }));
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to complete goal' });
      return null;
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true });
    try {
      await goalService.remove(id);
      set((state) => ({
        goals: state.goals.filter((g) => g._id !== id),
        currentGoal: state.currentGoal?._id === id ? null : state.currentGoal,
        tasks: state.currentGoal?._id === id ? [] : state.tasks,
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.error || 'Failed to delete goal',
      });
      return false;
    }
  },

  clearCurrent: () => set({ currentGoal: null, tasks: [] }),
  clearError: () => set({ error: null }),
}));

export default useGoalStore;
