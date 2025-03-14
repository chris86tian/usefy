# Usefy

Usefy is a cutting-edge platform designed to empower individuals by enhancing their learning experiences, tracking progress, and fostering personal growth. This repository encapsulates the backend & client architecture and data flow for Usefy, making it a one-stop solution for modern educational needs.

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Schema Diagrams](#schema-diagrams)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [OAuth Configuration](#oauth-configuration)
- [Contributing](#contributing)

---

## Introduction

Usefy provides a seamless way to manage courses, track user progress, handle transactions, and deliver notifications. It enables users to:

- Enroll in courses.
- Monitor their learning journey with detailed progress tracking.
- Manage financial transactions related to course enrollments.
- Stay updated with notifications and personal commitment tracking.

---

## Features

1. **Course Management**

   - Create and manage course content with associated metadata.
   - Track enrollments and course completion statuses.

2. **User Progress Tracking**

   - Monitor section- and chapter-wise progress.
   - Mark quizzes and chapters as completed.

3. **Transaction Management**

   - Securely handle course payments.
   - Generate transaction histories for users.

4. **Notifications**

   - Send real-time updates to users about course events and reminders.

5. **Commit Tracking**
   - Maintain daily user activity streaks for motivation and accountability.

---

## Schema Diagrams

For an interactive view of the diagrams, visit [this workspace](https://app.eraser.io/workspace/cdYkToriyno1VkoxYAop?origin=share).

---

## Technologies Used

- **Backend**: Node.js, Express.js, Serverless Framework
- **Database**: DynamoDB
- **Authentication**: Clerk
- **API Deployment**: AWS API Gateway, AWS Lambda
- **Infrastructure**: AWS CloudFormation
- **API Documentation**: Swagger/OpenAPI
- **Other Tools**: AWS SDK, Dynamoose ORM

---

## Installation

Follow these steps to set up the project locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/growthhungrylife/usefy.git
   ```

2. Navigate to the project directory:

   ```bash
   cd usefy

   // Client application
   cd client

   // Server application
   cs server
   ```

3. Install dependencies:

   ```bash
   // Client application
   npm install --legacy-peer-deps

   // Server application
   npm install
   ```

4. Configure environment variables by creating a `.env` file and adding environment variables

5. Start the server:
   ```bash
   npm run dev
   ```

---

## Usage

1. Access the server locally at `http://localhost:8001` and client at `http://localhost:3000`.
2. Use a tool like Postman or Swagger UI for testing endpoints.
3. Integrate the backend with your frontend or mobile application for a complete user experience.

---

## Deployment

The backend is deployed using AWS Lambda and API Gateway with the Serverless Framework.

### Deploying to AWS

1. Install the Serverless Framework globally:
   ```bash
   npm install -g serverless
   ```
2. Deploy the service:
   ```bash
   serverless deploy
   ```
3. The deployment will provide an API Gateway URL, e.g.:

   ```
   Service deployed to stack growthhungry-service-dev (60s)

   endpoints:
     ANY - https://khbciw4vke.execute-api.us-east-1.amazonaws.com/prod/
     ANY - https://khbciw4vke.execute-api.us-east-1.amazonaws.com/prod/{proxy+}
   ```

---

S3 bucket= expertize-bucket-migration-migration

## OAuth Configuration

To enable Google OAuth, configure the following settings in the Google Cloud Console :

### **Authorized JavaScript Origins (Frontend)**

- ✅ `https://usefy.com`
- ✅ `http://localhost:3000`

### **Authorized Redirect URIs (Backend)**

- ✅ `https://khbciw4vke.execute-api.us-east-1.amazonaws.com/prod/auth/google/callback`
- ✅ `http://localhost:8001/auth/google/callback`

Ensure that your backend has an `/auth/google/callback` route to handle authentication responses.

---

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git commit -m "Add your message here"
   git push origin feature/your-feature-name
   ```
4. Open a pull request on GitHub.

---

Happy Learning! 🚀
