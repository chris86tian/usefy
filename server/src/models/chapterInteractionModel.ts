import { Schema, model } from "dynamoose";

const chapterInteractionSchema = new Schema({
    chapterId: {
        type: String,
        hashKey: true,
    },
    userId: {
        type: String,
        rangeKey: true,
    },
    like: Boolean,
    dislike: Boolean,          
});

export default model("ChapterInteraction", chapterInteractionSchema);