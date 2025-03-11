import { Schema, model } from "dynamoose";

const timeTrackingSchema = new Schema({
  timeTrackingId: {
    type: String,
    hashKey: true,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  sectionId: {
    type: String,
    required: true,
  },
  chapterId: {
    type: String,
    required: true,
  },
  durationMs: {
    type: Number,
    required: true,
  },
  trackedAt: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
    index: {
      name: "dateIndex",
      type: "global",
    },
  }
});

const TimeTracking = model("TimeTracking", timeTrackingSchema);
export default TimeTracking;