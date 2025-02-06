import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http";
import AWS from "aws-sdk";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import "./utils/scheduledEmail";
import {
  createClerkClient,
  requireAuth,
} from "@clerk/express";
// /* ROUTE IMPORTS */
import courseRoutes from "./routes/courseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import commitRoutes from "./routes/commitRoutes";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/* CONFIGURATIONS */
dotenv.config();

if (process.env.NODE_ENV === "development") {
  dynamoose.aws.ddb.local();
} else {
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  dynamoose.aws.ddb.set(new DynamoDB());
}

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/courses", courseRoutes);
app.use("/users/clerk", requireAuth(), userClerkRoutes);
app.use("/transactions", requireAuth(), transactionRoutes);
app.use("/notifications", requireAuth(), notificationRoutes);
app.use("/commits", requireAuth(), commitRoutes);
app.use("/users/course-progress", requireAuth(), userCourseProgressRoutes);

/* SERVER */
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV === "development") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} else {
  console.log("Serverless app");
}

/* SERVERLESS */
const serverlessApp = serverless(app);

export const handler = async (event: any, context: any) => {
    return serverlessApp(event, context);
};