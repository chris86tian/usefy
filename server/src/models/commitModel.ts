import { Schema, model } from "dynamoose";

const commitSchema = new Schema({
    commitId: {
        type: String,
        hashKey: true,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    count: {
        type: Number,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
});

export default model("Commit", commitSchema);
