import { Schema, model } from "dynamoose";

const chapterSchema = new Schema({
  chapterId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
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
        upvotes: {
          type: Number,
        },
        downvotes: {
          type: Number,
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
  quiz: new Schema({
    quizId: {
      type: String,
      required: true,
    },
    questions: {
      type: Array,
      schema: [
        new Schema({
          questionId: {
            type: String,
            required: true,
          },
          question: {
            type: String,
            required: true,
          },
          difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
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
        fileUrl: {
          type: String,
        },
        isCoding: {
          type: Boolean,
        },
        language: {
          type: String,
        },
        starterCode: {
          type: String,
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
              fileUrls: {
                type: Array,
                schema: [String],
              },
              links: {
                type: Array,
                schema: [String],
              },
              comment: {
                type: String,
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
  files: {
    type: Array,
    schema: [
      new Schema({
        fileId: {
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
        fileUrl: {
          type: String,
          required: true,
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

export const courseSchema = new Schema(
  {
    courseId: {
      type: String,
      hashKey: true,
      required: true,
    },
    instructors: {
      type: Array,
      required: true,
      schema: [
        new Schema({
          userId: {
            type: String,
            required: true,
          },
        }),
      ],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
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
