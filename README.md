# Usefy

Usefy is an AI-agents powered organization platform designed to revolutionize educational experiences through intelligent course management, role-based access control, and automated content generation.

---

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
  - [Organization Management](#organization-management)
  - [Role-Based Access Control](#role-based-access-control)
  - [AI Course Generation](#ai-course-generation)
  - [Interactive Learning](#interactive-learning)
  - [Progress Tracking](#progress-tracking)
  - [Course Management](#course-management)
- [Technical Architecture](#technical-architecture)
- [Schema Diagrams](#schema-diagrams)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Introduction

Usefy provides a comprehensive platform for creating and managing educational organizations, cohorts, and courses. The platform leverages AI to generate educational content while offering robust features for both administrators and learners. Usefy empowers educational institutions, training programs, and learning communities to create, customize, and manage their educational content with minimal effort.

<img width="1278" alt="Screenshot 2025-03-22 at 1 05 58 AM" src="https://github.com/user-attachments/assets/517977ea-a73f-4fe2-8b49-c1b4b5be5073" />

<img width="1279" alt="Screenshot 2025-03-22 at 1 19 11 AM" src="https://github.com/user-attachments/assets/6a49d10e-d514-49c7-bbca-8533f5ae3e0b" />

<img width="1019" alt="Screenshot 2025-03-22 at 1 08 29 AM" src="https://github.com/user-attachments/assets/76107800-c316-4e49-9ac6-166704a06c2e" />

<img width="1018" alt="Screenshot 2025-03-22 at 1 09 43 AM" src="https://github.com/user-attachments/assets/0c72e351-24e0-47ea-84db-49658891746e" />

<img width="1278" alt="Screenshot 2025-03-22 at 1 11 42 AM" src="https://github.com/user-attachments/assets/4fdc410d-d1b6-46c9-8836-72c943ab8540" />

<img width="1277" alt="Screenshot 2025-03-22 at 1 15 34 AM" src="https://github.com/user-attachments/assets/9b3a2f66-ae63-4c89-a8c1-e3c719ce32ec" />

<img width="1278" alt="Screenshot 2025-03-22 at 1 16 01 AM" src="https://github.com/user-attachments/assets/a3f798da-95f0-41ad-916e-fcd03a320709" />

<img width="1723" alt="Screenshot 2025-03-22 at 1 20 09 AM" src="https://github.com/user-attachments/assets/d773a7c8-ccf0-4bfd-8cbf-5bc8654de584" />


---

## Key Features

### Organization Management

- Create organizations and cohorts within them
- Invite users to organizations/cohorts via email or CSV bulk import
- Manage members across different cohorts

### Role-Based Access Control

- **Admins**: Full control over organizations, cohorts, and courses
- **Instructors**: Ability to edit courses and generate content
- **Learners**: Access to assigned cohorts and courses

### AI Course Generation

- Generate complete courses from YouTube links
- AI-powered creation of sections, chapters, resources, quizzes, and assignments
- Customizable content generation based on specific needs

### Interactive Learning

- Run code directly in the built-in IDE
- Receive AI-generated feedback on coding assignments
- Comment on and like chapter content
- Submit issues/feedback on course materials

### Progress Tracking

- GitHub-like activity commit graph
- Detailed statistics for instructors (submissions, completion rates, time spent)
- Personal progress tracking for learners

### Course Management

- Control release timing of course sections
- Change course status (public/draft/archived)
- Instant email/notification updates for course changes

---

## Technical Architecture

Usefy provides a seamless experience through its integrated backend and client architecture, handling:

- User authentication and authorization
- Course content management
- Progress tracking
- Notifications
- AI-powered content generation
- IDE integration for coding assignments

---

## Schema Diagrams

For an interactive view of the database schemas and relationships, visit [this workspace](https://app.eraser.io/workspace/cdYkToriyno1VkoxYAop?origin=share).

---

## Technologies Used

- **Backend**: Node.js, Express.js, Serverless Framework
- **Database**: DynamoDB
- **Authentication**: Clerk
- **AI Services**: OpenAI SDK for AI agents (content generation and solutions feedback)
- **Frontend**: Next.js
- **Containerization**: Docker
- **Infrastructure**: AWS (API Gateway, Lambda, CloudFormation, CloudWatch)
- **Storage**: AWS S3
- **API Documentation**: Swagger/OpenAPI
- **Other Tools**: AWS SDK, Dynamoose ORM

---

## Installation

Follow these steps to set up the project locally:

1. Clone the repository:

```bash
git clone https://github.com/growthhungrylife/usefy.git
```

2. Navigate to the project directories:

```bash
cd usefy

# Client application
cd client

# Server application (from root)
cd server
```

3. Install dependencies:

```bash
# Client application
npm install --legacy-peer-deps

# Server application
npm install
```

4. Configure environment variables by creating a `.env` file with necessary environment variables

5. Start the development servers:

```bash
npm run dev
```

### Using Docker

You can also run the application using Docker:

```bash
# Build the Docker image
docker build -t usefy .

# Run the container
docker run -p 3000:3000 -p 8001:8001 usefy
```

---

## Usage

1. Access the server locally at http://localhost:8001 and client at http://localhost:3000
2. Use Postman or Swagger UI for testing endpoints
3. Integrate the backend with your frontend or mobile application for a complete user experience

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
  ANY - https://mhun775961.execute-api.us-east-1.amazonaws.com/migration/
  ANY - https://mhun775961.execute-api.us-east-1.amazonaws.com/migration/{proxy+}
```

S3 bucket: expertize-bucket-migration

---

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes and push the branch:

```bash
git commit -m "Add your message here"
git push origin feature/your-feature-name
```

4. Open a pull request on GitHub

---

Happy Learning & Teaching! 🚀
