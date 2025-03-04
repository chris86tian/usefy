import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http";
import AWS from "aws-sdk";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import "./utils/scheduledEmail";
import { createClerkClient, requireAuth } from "@clerk/express";
import cors from "cors";
import courseRoutes from "./routes/courseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import commitRoutes from "./routes/commitRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import cohortRoutes from "./routes/cohortRoutes";

dotenv.config();

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
  console.error("❌ Clerk keys are not properly configured!");
  process.exit(1);
}

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
  console.log("🔧 Using AWS configuration for development");
  AWS.config.update({
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
} else {
  console.log("🔧 Using AWS configuration for production");
  AWS.config.update({ region: "us-east-1" });
}

dynamoose.aws.ddb.set(new DynamoDB());

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://usefy.com",
  "https://www.usefy.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-amz-acl",
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-user-agent",
      "x-amz-target",
      "x-amz-signedheaders",
      "x-amz-expires",
      "x-amz-algorithm",
      "x-amz-credential",
      "x-amz-signature",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
    maxAge: 86400,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.originalUrl} ${
        res.statusCode
      }`
    );
  });
  next();
});

/* ROUTES */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/organizations", organizationRoutes);
app.use("/cohorts", cohortRoutes);
app.use("/courses", courseRoutes);
app.use("/users/course-progress", requireAuth(), userCourseProgressRoutes);
app.use("/users/clerk", userClerkRoutes);
app.use("/transactions", requireAuth(), transactionRoutes);
app.use("/notifications", requireAuth(), notificationRoutes);
app.use("/commits", requireAuth(), commitRoutes);
app.use("/feedback", requireAuth(), feedbackRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Express error:", {
      error: err,
      stack: err.stack,
      requestId: req.headers["x-request-id"],
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });

    const statusCode = err.status || 500;
    const errorResponse = {
      message: err.message || "Internal Server Error",
      requestId: req.headers["x-request-id"],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    };

    res.status(statusCode).json(errorResponse);
  }
);

/* SERVER */
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
  const port = process.env.PORT || 8001;
  app.listen(port, () => {
    console.log(
      `🚀 Server is running in development mode on http://localhost:${port}`
    );
  });
} else {
  console.log("🚀 Serverless mode activated");
}

/* SERVERLESS */
const serverlessApp = serverless(app);

interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const handler = async (
  event: any,
  context: any
): Promise<LambdaResponse> => {
  event.headers = event.headers || {};
  const origin = event.headers.origin || "https://www.usefy.com";

  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Origin not allowed" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Requested-With",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  try {
    console.log("Lambda event:", JSON.stringify(event, null, 2));

    if (event.requestContext?.requestId) {
      event.headers["x-request-id"] = event.requestContext.requestId;
    }

    const result = await serverlessApp(event, context);
    console.log("Lambda response:", JSON.stringify(result, null, 2));

    const response = result as LambdaResponse;

    const headers = { ...(response.headers || {}) };
    delete headers["access-control-allow-origin"];
    delete headers["access-control-allow-credentials"];
    delete headers["access-control-allow-methods"];
    delete headers["access-control-allow-headers"];
    delete headers["access-control-max-age"];

    return {
      ...response,
      headers: {
        ...headers,
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    };
  } catch (error) {
    console.error("Lambda error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Requested-With",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        requestId: event.requestContext?.requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      }),
    };
  }
};
