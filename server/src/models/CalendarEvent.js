import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  googleEventId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
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
    default: 'other',
  },
  duration: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    default: 'google-calendar',
  },
}, {
  timestamps: true,
});

// Ensure unique index so we don't save duplicates
calendarEventSchema.index({ userId: 1, googleEventId: 1 }, { unique: true });
calendarEventSchema.index({ userId: 1, start: 1, end: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
