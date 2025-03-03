import { model, Schema } from "dynamoose";

const cohortSchema = new Schema({
    cohortId: {
      type: String,
      hashKey: true,
      required: true,
    },
    organizationId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    instructors: {
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
    learners: {
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
    courses: {
      type: Array,
      schema: [
        new Schema({
          courseId: {
            type: String,
            required: true,
          },
        }),
      ],
    },
  });

  const Cohort = model("Cohort", cohortSchema);
  export default Cohort;