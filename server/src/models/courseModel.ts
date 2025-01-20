import { Schema, model } from "dynamoose";
import { release } from "os";

const chapterSchema = new Schema({
  chapterId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Text", "Quiz", "Video"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  video: {
    type: String,
  },
  likes: {
    type: Number,
  },
  dislikes: {
    type: Number,
  },
  comments : {
    type: Array,
    schema: [
      new Schema({
        id: {
          type: String,
          required: true,
        },
        userId: {
          type: String,
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: String,
          required: true,
        },
        replies: {
          type: Array,
          schema: [
            new Schema({
              id: {
                type: String,
                required: true,
              },
              userId: {
                type: String,
                required: true,
              },
              username: {
                type: String,
                required: true,
              },
              content: {
                type: String,
                required: true,
              },
              createdAt: {
                type: String,
                required: true,
              },
            }),
          ],
        },
      }),
    ],
  },
  quiz: {
    type: Object,
    schema: new Schema({
      questions: {
        type: Array,
        schema: [
          new Schema({
            question: {
              type: String,
              required: true,
            },
            options: {
              type: Array,
              required: true,
              schema: [String],
            },
            correctAnswer: {
              type: Number,
              required: true,
            },
          }),
        ],
      },
    }),
  },
  assignments: {
    type: Array,
    schema: [
      new Schema({
        assignmentId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        resources : {
          type: Array,
          schema: [
            new Schema({
              id: {
                type: String,
                required: true,
              },
              title: {
                type: String,
                required: true,
              },
              type: {
                type: String,
                required: true,
                enum: ["link", "image", "file"],
              },
              url: {
                type: String,
                required: true,
              },
              fileUrl: {
                type: String,
              },
            }),
          ],
        },
        submissions: {
          type: Array,
          schema: [
            new Schema({
              submissionId: {
                type: String,
                required: true,
              },
              userId: {
                type: String,
                required: true,
              },
              code: {
                type: String,
              },
              evaluation: {
                type: Object,
                schema: new Schema({
                  passed: {
                    type: Boolean,
                    required: true,
                  },
                  score: {
                    type: Number,
                    required: true,
                  },
                  explanation: {
                    type: String,
                  },
                }),
              },
            }),
          ],
        },
        hints: {
          type: Array,
          schema: [String],
        },
      }),
    ],
  },
});

const sectionSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
  },
  sectionTitle: {
    type: String,
    required: true,
  },
  sectionDescription: {
    type: String,
  },
  chapters: {
    type: Array,
    schema: [chapterSchema],
  },
  releaseDate: {
    type: String,
  },
});

const courseSchema = new Schema(
  {
    courseId: {
      type: String,
      hashKey: true,
      required: true,
    },
    teacherId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
    },
    level: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Published", "Archived"],
    },
    sections: {
      type: Array,
      schema: [sectionSchema],
    },
    enrollments: {
      type: Array,
      schema: [
        new Schema({
          userId: {
            type: String,
            required: true,
          },
        }),
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Course = model("Course", courseSchema);
export default Course;
