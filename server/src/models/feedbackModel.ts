import { Schema, model } from "dynamoose";

const feedbackSchema = new Schema({
  feedbackId: {
    type: String,
    hashKey: true,
    required: true,
  },
  feedbackType: {
    type: String,
    enum: ['question', 'assignment'],
    required: true,
  },
  questionId: {
    type: String,
    required: false, //optional
  },
  assignmentId: {
    type: String,
    required: false, //optional
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
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
  feedback: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,  // Change from Date to String
    required: true,
  },
});

const Feedback = model("Feedback", feedbackSchema);
export default Feedback;