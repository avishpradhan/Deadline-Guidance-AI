import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import AIOutput from '../models/AIOutput.js';
import { analyzeGoal } from '../services/gemini/goalAnalysisAgent.js';
import { decomposeTasks } from '../services/gemini/taskDecompositionAgent.js';
import { generateAccountabilityMessage } from '../services/gemini/accountabilityAgent.js';
import { predictRisk } from '../services/gemini/riskPredictionAgent.js';
import { generateRecoveryPlan } from '../services/gemini/recoveryAgent.js';
import { calculateGoalForecast } from '../utils/forecastEngine.js';
import { refreshDecisionInsight } from '../utils/decisionHelper.js';

/**
 * POST /api/ai/analyze
 * Orchestrates Agent 1 (analysis) → Agent 2 (decomposition) → stores tasks
 */
export const analyze = async (req, res, next) => {
  try {
    const { goalId } = req.body;
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    // 1. If goal is already active, return the existing tasks and analysis immediately
    if (goal.status === 'active') {
      const tasks = await Task.find({ goalId }).sort({ order: 1 });
      
      // Group tasks by phase
      const phasesMap = {};
      for (const task of tasks) {
        if (!phasesMap[task.phase]) {
          phasesMap[task.phase] = [];
        }
        phasesMap[task.phase].push({
          title: task.title,
          estimatedHours: task.estimatedHours,
          dueDate: task.dueDate,
        });
      }
      const phases = Object.entries(phasesMap).map(([name, tasks]) => ({
        name,
        tasks,
      }));

      // Retrieve the saved goal analysis AI output
      const analysisOutput = await AIOutput.findOne({ goalId, agentType: 'goal_analysis' }).sort({ createdAt: -1 });
      const analysis = analysisOutput ? analysisOutput.output : {};

      return res.json({
        riskScore: goal.riskScore || analysis.riskScore || 'medium',
        riskReason: analysis.riskReason || '',
        coachNote: analysis.coachNote || '',
        feasibility: analysis.feasibility || 'achievable',
        phases,
        tasksCreated: tasks.length,
        aiDecisionInsight: goal.aiDecisionInsight,
      });
    }

    // 2. If a concurrent request is already analyzing, poll/wait for it to finish
    if (goal.status === 'analyzing') {
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const updatedGoal = await Goal.findById(goalId);
        if (updatedGoal && updatedGoal.status === 'active') {
          const tasks = await Task.find({ goalId }).sort({ order: 1 });
          const phasesMap = {};
          for (const task of tasks) {
            if (!phasesMap[task.phase]) {
              phasesMap[task.phase] = [];
            }
            phasesMap[task.phase].push({
              title: task.title,
              estimatedHours: task.estimatedHours,
              dueDate: task.dueDate,
            });
          }
          const phases = Object.entries(phasesMap).map(([name, tasks]) => ({
            name,
            tasks,
          }));

          const analysisOutput = await AIOutput.findOne({ goalId, agentType: 'goal_analysis' }).sort({ createdAt: -1 });
          const analysis = analysisOutput ? analysisOutput.output : {};

          return res.json({
            riskScore: updatedGoal.riskScore || analysis.riskScore || 'medium',
            riskReason: analysis.riskReason || '',
            coachNote: analysis.coachNote || '',
            feasibility: analysis.feasibility || 'achievable',
            phases,
            tasksCreated: tasks.length,
            aiDecisionInsight: updatedGoal.aiDecisionInsight,
          });
        }
      }
      return res.status(409).json({ error: 'Goal analysis is already in progress. Please refresh.' });
    }

    // 3. Mark as analyzing immediately to block duplicate requests
    goal.status = 'analyzing';
    await goal.save();

    let analysis, decomposition;
    try {
      // Agent 1: Analyze goal
      analysis = await analyzeGoal(goal);

      // Store AI output
      await AIOutput.create({
        goalId,
        agentType: 'goal_analysis',
        input: goal.toObject(),
        output: analysis,
      });

      // Agent 2: Decompose into tasks
      decomposition = await decomposeTasks(goal, analysis);

      // Store AI output
      await AIOutput.create({
        goalId,
        agentType: 'task_decomposition',
        input: { goal: goal.toObject(), analysis },
        output: decomposition,
      });
    } catch (aiErr) {
      // Revert status to planning if Gemini call fails, so it can be retried
      goal.status = 'planning';
      await goal.save();
      throw aiErr;
    }

    // Save tasks to database
    let taskOrder = 0;
    const savedTasks = [];

    if (decomposition.phases) {
      for (const phase of decomposition.phases) {
        for (const task of phase.tasks || []) {
          const saved = await Task.create({
            goalId,
            phase: phase.name,
            title: task.title,
            estimatedHours: task.estimatedHours || 1,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            order: taskOrder++,
          });
          savedTasks.push(saved);
        }
      }
    }

    // Update goal status and risk score
    goal.status = 'active';
    goal.riskScore = analysis.riskScore || 'medium';
    await goal.save();

    // Call the structured Decision Insight helper to calculate and save initial insights
    const decisionInsight = await refreshDecisionInsight(goal._id, req.user._id);
    if (decisionInsight) {
      goal.aiDecisionInsight = decisionInsight;
      await goal.save();
    }

    res.json({
      riskScore: analysis.riskScore,
      riskReason: analysis.riskReason,
      coachNote: analysis.coachNote,
      feasibility: analysis.feasibility,
      phases: decomposition.phases,
      tasksCreated: savedTasks.length,
      aiDecisionInsight: goal.aiDecisionInsight,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/checkin-analyze
 * Runs Agent 3 (accountability) on check-in data
 */
export const checkinAnalyze = async (req, res, next) => {
  try {
    const { goalId, completedTasks, blockerNote } = req.body;
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const allTasks = await Task.find({ goalId });
    const overallCompleted = allTasks.filter((t) => t.status === 'completed').length;
    const daysRemaining = Math.max(1, Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    ));

    const result = await generateAccountabilityMessage({
      goalTitle: goal.title,
      goalCategory: goal.category,
      completedToday: completedTasks?.length || 0,
      totalToday: allTasks.filter((t) => t.status !== 'completed').length,
      blockerNote: blockerNote || '',
      daysRemaining,
      overallCompleted,
      overallTotal: allTasks.length,
    });

    // Store AI output
    await AIOutput.create({
      goalId,
      agentType: 'accountability',
      input: { completedTasks, blockerNote },
      output: result,
    });

    // Refresh decision insight on check-in
    try {
      await refreshDecisionInsight(goalId, req.user._id);
    } catch (coachErr) {
      console.error('Error updating decision insight during check-in:', coachErr);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/replan
 * Runs Agent 5 (recovery) for behind-schedule goals
 */
export const replan = async (req, res, next) => {
  try {
    const { goalId, missedTaskIds } = req.body;
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const missedTasks = missedTaskIds
      ? await Task.find({ _id: { $in: missedTaskIds }, goalId })
      : await Task.find({ goalId, status: { $ne: 'completed' } });

    const allTasks = await Task.find({ goalId });
    const completedCount = allTasks.filter((t) => t.status === 'completed').length;
    const pendingCount = allTasks.filter((t) => t.status !== 'completed').length;
    const pendingHours = allTasks.filter((t) => t.status !== 'completed').reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const daysRemaining = Math.max(1, Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    ));

    const result = await generateRecoveryPlan({
      userId: goal.userId,
      goalTitle: goal.title,
      missedTasks,
      daysRemaining,
      dailyHours: goal.dailyHours,
      skillLevel: goal.skillLevel,
      createdAt: goal.createdAt,
      deadline: goal.deadline,
    });

    // 1. Calculate success probability BEFORE recovery
    const beforeForecast = calculateGoalForecast({
      createdAt: goal.createdAt,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      priority: goal.priority,
      totalTasks: allTasks.length,
      completedTasks: completedCount,
      remainingTasks: pendingCount,
      estimatedHoursRemaining: pendingHours,
    });

    const successProbabilityBefore = beforeForecast.successProbability;

    // 2. Calculate success probability AFTER recovery (using revised tasks)
    const revisedTasksList = result?.recoveryPlan?.revisedTasks || [];
    const revisedTasksCount = revisedTasksList.length;
    const revisedHours = revisedTasksList.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const afterForecast = calculateGoalForecast({
      createdAt: goal.createdAt,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      priority: goal.priority,
      totalTasks: completedCount + revisedTasksCount,
      completedTasks: completedCount,
      remainingTasks: revisedTasksCount,
      estimatedHoursRemaining: revisedHours,
    });

    // Ensure the rescue plan actually provides an improvement
    const successProbabilityAfter = Math.min(99, Math.max(successProbabilityBefore + 15, afterForecast.successProbability, 75));
    const improvement = Math.max(5, successProbabilityAfter - successProbabilityBefore);

    // 3. Compile Risk Drivers (Explain WHY the goal is risky)
    const riskDrivers = [];
    if (daysRemaining <= 5) {
      riskDrivers.push(`Only ${daysRemaining} days remain before deadline`);
    } else {
      riskDrivers.push(`Approaching deadline: ${daysRemaining} days left`);
    }
    const pendingPercent = Math.round((pendingCount / (allTasks.length || 1)) * 100);
    if (pendingPercent > 0) {
      riskDrivers.push(`${pendingPercent}% of tasks remain incomplete`);
    }
    if (beforeForecast.daysAheadOrBehind < 0) {
      riskDrivers.push(`Current completion velocity is below required pace`);
    }
    const totalCapacity = daysRemaining * goal.dailyHours;
    if (pendingHours > totalCapacity) {
      riskDrivers.push(`Remaining effort (${pendingHours}h) exceeds available capacity (${totalCapacity}h)`);
    }
    if (riskDrivers.length < 2) {
      riskDrivers.push('Buffer time has been exhausted by recent task delays');
    }

    // Enrich the recovery response with intelligence indicators
    if (result && result.recoveryPlan) {
      result.recoveryPlan.successProbabilityBefore = successProbabilityBefore;
      result.recoveryPlan.successProbabilityAfter = successProbabilityAfter;
      result.recoveryPlan.improvement = improvement;
      result.recoveryPlan.riskDrivers = riskDrivers;
    }

    // Store AI output
    await AIOutput.create({
      goalId,
      agentType: 'recovery',
      input: { missedTaskIds, daysRemaining },
      output: result,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/risk
 * Runs Agent 4 (risk prediction) and updates goal
 */
export const risk = async (req, res, next) => {
  try {
    const { goalId } = req.body;
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const allTasks = await Task.find({ goalId });
    const completed = allTasks.filter((t) => t.status === 'completed').length;
    const daysElapsed = Math.max(1, Math.ceil(
      (new Date() - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24)
    ));
    const daysRemaining = Math.max(0, Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    ));

    const result = await predictRisk({
      goalTitle: goal.title,
      completedTasks: completed,
      totalTasks: allTasks.length,
      daysRemaining,
      daysElapsed,
    });

    // Update goal risk score
    if (result.riskScore) {
      goal.riskScore = result.riskScore;
      await goal.save();
    }

    // Store AI output
    await AIOutput.create({
      goalId,
      agentType: 'risk_prediction',
      input: { completed, total: allTasks.length, daysRemaining, daysElapsed },
      output: result,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/replan/accept
 * Activates recovery plan: deletes pending tasks, inserts revised tasks, resets goal risk
 */
export const acceptReplan = async (req, res, next) => {
  try {
    const { goalId, revisedTasks } = req.body;
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    // 1. Delete all pending (non-completed) tasks for this goal
    await Task.deleteMany({ goalId, status: { $ne: 'completed' } });

    // 2. Determine the order index to start appending the new tasks
    const completedTasks = await Task.find({ goalId, status: 'completed' }).sort({ order: 1 });
    let nextOrder = completedTasks.length > 0 ? completedTasks[completedTasks.length - 1].order + 1 : 0;

    // 3. Create the new revised tasks in the database
    const savedTasks = [];
    if (revisedTasks && revisedTasks.length > 0) {
      for (const t of revisedTasks) {
        const saved = await Task.create({
          goalId,
          phase: 'Deadline Rescue Phase',
          title: t.title,
          estimatedHours: t.estimatedHours || 1,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          status: 'pending',
          order: nextOrder++,
        });
        savedTasks.push(saved);
      }
    }

    // 4. Reset the goal's risk score to low/medium since the plan is rescued!
    goal.riskScore = 'low';
    await goal.save();

    // Refresh decision insight after replan activation
    await refreshDecisionInsight(goal._id, req.user._id);

    res.json({ success: true, tasksCreated: savedTasks.length });
  } catch (err) {
    next(err);
  }
};
