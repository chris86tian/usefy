import { model, Schema } from "dynamoose";

const organizationSchema = new Schema({
    organizationId: {
      type: String,
      hashKey: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    admins: {
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
  });

  const Organization = model("Organization", organizationSchema);
  export default Organization;