import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http";
import AWS from "aws-sdk";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
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
import timeTrackingRoutes from "./routes/timeTrackingRoutes";

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

const allowedOrigins = [
  "http://localhost:3000",
  "https://usefy.com",
  "https://www.usefy.com",
  "https://expertize-bucket-migration.s3.amazonaws.com",
  "https://d2d2uxovkp6xho.cloudfront.net",
];

const app = express();

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
      "Accept",
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

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.status(200).send();
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
app.use(
  "/notifications",
  (req, res, next) => {
    if (req.method === "OPTIONS") {
      const origin = req.headers.origin || "";
      const isAllowedOrigin = allowedOrigins.includes(origin);

      res.header(
        "Access-Control-Allow-Origin",
        isAllowedOrigin ? origin : "https://www.usefy.com"
      );
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With,Accept"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
      res.status(200).send();
      return;
    }

    requireAuth()(req, res, (err) => {
      if (err) {
        const origin = req.headers.origin || "";
        const isAllowedOrigin = allowedOrigins.includes(origin);

        res.header(
          "Access-Control-Allow-Origin",
          isAllowedOrigin ? origin : "https://www.usefy.com"
        );
        res.header("Access-Control-Allow-Credentials", "true");

        res.status(401).json({
          message: "Unauthorized. Please sign in to access this resource.",
          code: "unauthorized",
        });
        return;
      }
      next();
    });
  },
  notificationRoutes
);
app.use("/commits", requireAuth(), commitRoutes);
app.use("/feedback", requireAuth(), feedbackRoutes);
app.use("/time-tracking", timeTrackingRoutes);

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

  const isAllowedOrigin = allowedOrigins.includes(origin);

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowedOrigin
      ? origin
      : "https://www.usefy.com",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Requested-With,Accept",
    "Access-Control-Max-Age": "86400",
  };

  if (!isAllowedOrigin) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      body: JSON.stringify({ message: "Origin not allowed" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    console.log("Handling OPTIONS request for path:", event.path);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    console.log("Lambda event:", JSON.stringify(event, null, 2));

    if (event.requestContext?.requestId) {
      event.headers["x-request-id"] = event.requestContext.requestId;
    }

    event.headers["x-api-request"] = "true";

    const isRootPath =
      event.path === "/" ||
      event.path === "/migration" ||
      event.path === "/migration/";

    if (isRootPath) {
      console.log("Handling request to root path:", event.path);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({ message: "API is running" }),
      };
    }

    const result = await serverlessApp(event, context);
    console.log("Lambda response:", JSON.stringify(result, null, 2));

    const response = result as LambdaResponse;

    const isRedirect = response.statusCode >= 300 && response.statusCode < 400;

    if (isRedirect && response.statusCode === 302) {
      console.log("Converting redirect to 401 Unauthorized response");
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          message: "Unauthorized. Please sign in to access this resource.",
          code: "unauthorized",
        }),
      };
    }

    // Remove any existing CORS headers to avoid duplicates
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
        ...corsHeaders,
      },
    };
  } catch (error) {
    console.error("Lambda error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
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
