import { Schema, model } from "dynamoose";

const notificationSchema = new Schema(
  {
    notificationId: {
      type: String,
      hashKey: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
  }
);

const UserNotification = model("UserNotification", notificationSchema);

export default UserNotification;
