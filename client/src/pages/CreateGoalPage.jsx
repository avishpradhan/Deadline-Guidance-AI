import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Plus, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Slider from '../components/ui/Slider';
import Stepper from '../components/ui/Stepper';
import useGoalStore from '../stores/goalStore';
import { GOAL_CATEGORIES, PRIORITY_LEVELS, SKILL_LEVELS, CATEGORY_ICONS } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';

const STEPS = ['Goal Basics', 'Context', 'Confirm'];

export default function CreateGoalPage() {
  const navigate = useNavigate();
  const { createGoal, isLoading } = useGoalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: 'work_deadline',
    deadline: '',
    priority: 'medium',
    dailyHours: 3,
    skillLevel: 'beginner',
    context: '',
    constraints: [],
    events: [],
  });

  const [tempConstraint, setTempConstraint] = useState({
    type: 'travel',
    title: '',
    date: '',
    duration: '',
    notes: '',
  });

  const [tempEvent, setTempEvent] = useState({
    name: '',
    date: '',
    time: '',
  });

  const addConstraint = () => {
    if (!tempConstraint.title || !tempConstraint.date) return;
    setFormData((prev) => ({
      ...prev,
      constraints: [...prev.constraints, tempConstraint],
    }));
    setTempConstraint({ type: 'travel', title: '', date: '', duration: '', notes: '' });
  };

  const removeConstraint = (index) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index),
    }));
  };

  const addEvent = () => {
    if (!tempEvent.name || !tempEvent.date || !tempEvent.time) return;
    setFormData((prev) => ({
      ...prev,
      events: [...prev.events, tempEvent],
    }));
    setTempEvent({ name: '', date: '', time: '' });
  };

  const removeEvent = (index) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index),
    }));
  };

  const update = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.title.trim() && formData.deadline;
    }
    return true;
  };

  const handleSubmit = async () => {
    const data = await createGoal(formData);
    if (data) {
      const goalId = data.goalId || data.goal?._id || data._id;
      navigate(`/goals/${goalId}/analyze`);
    }
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(0);

  const goNext = () => { setDirection(1); setCurrentStep((s) => Math.min(s + 1, 2)); };
  const goBack = () => { setDirection(-1); setCurrentStep((s) => Math.max(s - 1, 0)); };

  return (
    <PageContainer maxWidth="max-w-[700px]">
      <div className="mb-6 text-left">
        <h1 className="text-xl md:text-2xl font-display font-bold mb-1 tracking-tight text-white">Create a New Goal</h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Every details feeds the AI diagnostics. Provide concrete constraints to align your plan.
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} className="mb-6" />

      <Card variant="static" padding="p-6 md:p-8" className="border-white/5 bg-white/[0.01] shadow-xl text-left">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Goal Basics */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <Input
                label="Goal / Commitment Title"
                placeholder="e.g., Launch MVP Landing Page, Renew Passport, Prepare for DSA Interview"
                value={formData.title}
                onChange={(e) => update('title', e.target.value)}
                helperText="Gemini needs a clear title to generate domain-specific tasks"
              />
              <Select
                label="Category"
                options={GOAL_CATEGORIES}
                value={formData.category}
                onChange={(e) => update('category', e.target.value)}
                helperText="Helps the AI adapt timelines and pacing to your domain"
              />
              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => update('deadline', e.target.value)}
                helperText="Drives risk scores, velocity formulas, and milestone boundaries"
                min={new Date().toISOString().split('T')[0]}
              />
              <Select
                label="Priority"
                options={PRIORITY_LEVELS}
                value={formData.priority}
                onChange={(e) => update('priority', e.target.value)}
                helperText="Influences how aggressively the planner schedules tasks"
              />
            </motion.div>
          )}

          {/* Step 2: Context */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <Slider
                label="Available Daily Hours"
                min={0.5}
                max={8}
                step={0.5}
                value={formData.dailyHours}
                onChange={(e) => update('dailyHours', parseFloat(e.target.value))}
                helperText="Subtracted by calendar conflicts to find actual study/work pacing capacity"
              />
              <Select
                label="Current Skill / Knowledge Level"
                options={SKILL_LEVELS}
                value={formData.skillLevel}
                onChange={(e) => update('skillLevel', e.target.value)}
                helperText="Determines estimated hours and depth of the task decomposition"
              />
              <Input
                label="Additional Context"
                type="textarea"
                placeholder="e.g., I need to focus on system design; Q3 roadmap has specific modules..."
                value={formData.context}
                onChange={(e) => update('context', e.target.value)}
                helperText="Add any custom scope parameters, preferences, or details to enrich the AI plan"
              />

              {/* Constraints Section */}
              <div className="border-t border-white/5 pt-6 mt-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Upcoming Constraints
                  </h4>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                  Provide dates when you are busy (e.g. traveling, exam date). The AI will block capacity and avoid scheduling tasks on these days.
                </p>
                
                {formData.constraints.length > 0 && (
                  <div className="space-y-2">
                    {formData.constraints.map((c, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 text-[11px] font-medium">
                        <div>
                          <span className="font-bold text-indigo-300 capitalize">{c.type.replace('_', ' ')}</span>: <span className="text-white">{c.title}</span>
                          <div className="text-[var(--color-text-muted)] text-[10px] mt-0.5">
                            Date: {c.date} | Duration: {c.duration || 'N/A'} {c.notes && `| Notes: ${c.notes}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeConstraint(index)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/25 border border-white/5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Constraint Type</label>
                    <select
                      value={tempConstraint.type}
                      onChange={(e) => setTempConstraint({ ...tempConstraint, type: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="travel">Travel</option>
                      <option value="exam">Exam</option>
                      <option value="interview">Interview</option>
                      <option value="meeting">Meeting</option>
                      <option value="family_event">Family Event</option>
                      <option value="work_deadline">Work Deadline</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Train Journey, Midterm Exam"
                      value={tempConstraint.title}
                      onChange={(e) => setTempConstraint({ ...tempConstraint, title: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      value={tempConstraint.date}
                      onChange={(e) => setTempConstraint({ ...tempConstraint, date: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 6 hours, all day"
                      value={tempConstraint.duration}
                      onChange={(e) => setTempConstraint({ ...tempConstraint, duration: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g., Offline, no laptop access"
                      value={tempConstraint.notes}
                      onChange={(e) => setTempConstraint({ ...tempConstraint, notes: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addConstraint}
                      disabled={!tempConstraint.title || !tempConstraint.date}
                      icon={Plus}
                      className="text-xs py-1 px-3"
                    >
                      Add Constraint
                    </Button>
                  </div>
                </div>
              </div>

              {/* Manual Events Section */}
              <div className="border-t border-white/5 pt-6 mt-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Manual Calendar Events
                  </h4>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                  Add non-blocking calendar events to guide task timing (foundation for Google Calendar).
                </p>

                {formData.events.length > 0 && (
                  <div className="space-y-2">
                    {formData.events.map((e, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 text-[11px] font-medium">
                        <div>
                          <span className="font-bold text-emerald-300">{e.name}</span>
                          <div className="text-[var(--color-text-muted)] text-[10px] mt-0.5">
                            Date: {e.date} | Time: {e.time}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvent(index)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-black/25 border border-white/5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Event Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Demo Day, Q3 Planning"
                      value={tempEvent.name}
                      onChange={(e) => setTempEvent({ ...tempEvent, name: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      value={tempEvent.date}
                      onChange={(e) => setTempEvent({ ...tempEvent, date: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Time</label>
                    <input
                      type="time"
                      value={tempEvent.time}
                      onChange={(e) => setTempEvent({ ...tempEvent, time: e.target.value })}
                      className="w-full text-xs bg-[var(--color-navy-950)] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEvent}
                      disabled={!tempEvent.name || !tempEvent.date || !tempEvent.time}
                      icon={Plus}
                      className="text-xs py-1 px-3"
                    >
                      Add Event
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Review Timeline & Parameters</h3>
              
              <div className="space-y-1.5 mb-6 bg-black/25 p-4 rounded-xl border border-white/5">
                {[
                  { label: 'Title', value: formData.title },
                  {
                    label: 'Category',
                    value: `${CATEGORY_ICONS[formData.category] || ''} ${
                      GOAL_CATEGORIES.find((c) => c.value === formData.category)?.label
                    }`,
                  },
                  { label: 'Deadline', value: formData.deadline ? formatDate(formData.deadline) : '—' },
                  {
                    label: 'Priority',
                    value: PRIORITY_LEVELS.find((p) => p.value === formData.priority)?.label,
                  },
                  { label: 'Daily Hours', value: `${formData.dailyHours} hrs/day` },
                  {
                    label: 'Skill Level',
                    value: SKILL_LEVELS.find((s) => s.value === formData.skillLevel)?.label,
                  },
                  { label: 'Context', value: formData.context || '—' },
                  { label: 'Constraints', value: formData.constraints.length > 0 ? `${formData.constraints.length} constraint(s) added` : 'None' },
                  { label: 'Calendar Events', value: formData.events.length > 0 ? `${formData.events.length} event(s) added` : 'None' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between py-2 border-b border-white/5 last:border-0 text-xs"
                  >
                    <span className="text-[var(--color-text-muted)] font-semibold">{item.label}</span>
                    <span className="text-[var(--color-text-primary)] text-right font-medium max-w-[65%] truncate">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Diagnostics Setup</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                  Upon submitting, Gemini orchestrates Agent 1 (Feasibility Analysis) and Agent 2 (Task Decomposition) to generate a day-by-day roadmap fitting your capacity blocks.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={goBack} icon={ArrowLeft} className="text-xs">
              Back
            </Button>
          ) : (
            <div />
          )}
          {currentStep < 2 ? (
            <Button onClick={goNext} disabled={!canProceed()} icon={ArrowRight} className="text-xs rounded-xl font-bold">
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              icon={Sparkles}
              className="!bg-gradient-to-r !from-indigo-600 !via-indigo-500 !to-emerald-500 text-xs rounded-xl font-bold py-2.5 px-5"
            >
              Generate AI Plan
            </Button>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
