# Virtual Learning Environment

This project is a **Scalable Virtual Learning Environment (VLE) Application** designed to help users create and manage courses, track progress, and interact in an online learning environment. The application is built with **Next.js** for the frontend and **Node.js** for the backend, utilizing modern web technologies to deliver a scalable, fast, and secure user experience.

---

## Table of Contents

- Project Description
- Features
- Tech Stack
- Frontend
- Backend
- Authentication
- Hosting & Deployment
- Running Locally
- Environment Variables
- License

---

## Project Description

This VLE application is designed for educators, learners, and administrators to interact and manage their learning materials, enrollments, and progress. The app integrates modern tools to provide an intuitive, responsive, and scalable learning environment.

- **Frontend:** Built using **Next.js** to leverage server-side rendering, static site generation, and API routes.
- **Backend:** The backend leverages **Node.js** and **Express.js** running in **AWS Lambda** functions, which are triggered via **API Gateway**.
- **Authentication:** Simplified user authentication and management are handled with **Clerk**.
- **Payment:** Integrated with **Stripe** for handling payments, allowing users to buy and enroll in courses.

This VLE application is designed to be easily scalable and maintainable, using **AWS services** (Lambda, DynamoDB, S3, CloudFront) to deliver a secure and high-performance experience.

---

## Features

- **Course Management:** Create, update, and manage courses with multimedia content.
- **Enrollment System:** Users can browse, enroll, and track progress in courses.
- **Interactive UI:** Built with a responsive and intuitive design using **Tailwind CSS**, **Shadcn**, and **Framer Motion**.
- **Secure Payment Integration:** Supports course purchases and subscriptions via **Stripe**.
- **User Authentication:** Simplified with **Clerk** for easy sign-up, login, and user management.
- **Responsive Design:** Optimized for mobile and desktop views.
- **Cloud-based Storage:** Use **AWS S3** for storing and serving static content like videos and PDFs.
- **Scalable Infrastructure:** Hosted on **Vercel** for the frontend, with **AWS Lambda** and **API Gateway** powering the backend, providing scalability and flexibility.

---

## Tech Stack

### **Frontend**

- **Next.js**: Framework for server-side rendering (SSR), static site generation (SSG), and API routes.
- **Redux Toolkit**: Centralized state management for handling user data, course progress, etc.
- **Tailwind CSS**: Utility-first CSS framework for creating responsive and customizable UI components.
- **Shadcn**: UI component library for building modern, accessible components.
- **TypeScript**: Provides static typing to enhance code quality and maintainability.
- **Framer Motion**: Animations and interactions for a smooth, engaging user experience.
- **React Hook Form**: Simplifies form handling, validation, and submission.
- **Zod**: Schema validation for data integrity and user inputs.
- **Stripe**: Integrated for handling payments and subscriptions for course purchases.

### **Backend**

- **Node.js**: JavaScript runtime for building scalable server-side applications.
- **Express.js**: Lightweight framework for building RESTful APIs.
- **Docker**: Containerization for the backend services, ensuring consistency across different environments.
- **AWS Lambda**: Serverless computing service to run backend functions in a scalable, event-driven architecture.
- **API Gateway**: Manages API requests and routes them to Lambda functions.
- **DynamoDB**: Fully managed NoSQL database for storing user and course data.
- **S3**: Simple Storage Service for storing and serving static files (videos, PDFs, images).
- **CloudFront**: Content Delivery Network (CDN) for distributing static content globally with low latency.

### **Authentication**

- **Clerk**: Simplified user authentication, sign-up, and login, offering features like multi-factor authentication (MFA), social logins, and user management.

### **Hosting & Deployment**

- **Frontend**: Hosted on **Vercel**, taking advantage of its serverless architecture, automatic scaling, and easy integration with Next.js.
- **Backend**: Hosted on **AWS** using **Lambda**, **API Gateway**, **S3**, and **DynamoDB** to handle backend logic, API endpoints, and storage.

---

## Running Locally

To run the application locally, you'll need to set up both the frontend and backend. Here's a step-by-step guide:

### 1. **Frontend Setup (Next.js)**

- Clone the repository:
    
    ```bash
    git clone https://github.com/ArslanKamchybekov/expertize
    cd client
    
    ```
    
- Install dependencies:
    
    ```bash
    npm install
    
    ```
    
- Create a `.env.local` file in the root of the project and configure the necessary environment variables.
    
- Run the frontend locally:
    
    ```bash
    npm run dev
    
    ```
    
    The app should now be running on `http://localhost:${PORT}`.
    

### 2. **Backend Setup (Node.js + AWS Lambda)**

- Install backend dependencies:
    
    ```bash
    cd backend
    npm install
    
    ```
    
- Configure AWS credentials (ensure you have the correct access permissions).
    - You can set up AWS CLI with `aws configure` to use the credentials.
- Deploy the backend to AWS Lambda using the AWS CLI or an infrastructure-as-code tool like **Serverless Framework** or **AWS SAM**.
- Make sure that you configure your API Gateway correctly to route API requests to the Lambda functions.

---

## Environment Variables

You will need the following environment variables for both frontend and backend:

### **Frontend** (`.env.local`)

- `NEXT_PUBLIC_API_BASE_URL`: The API URL of your backend (e.g., `https://api.example.com`).
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`: Stripe public key for frontend payments.
- `STRIPE_SECRET_KEY`: Stripe secret key for frontend payments.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: The Clerk public key for user authentication.
- `CLERK_SECRET_KEY`: The Clerk secret key for user authentication.

### **Backend** (`.env`)

- `AWS_ACCESS_KEY_ID`: AWS access key ID for backend Lambda deployment.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for backend Lambda deployment.
- `CLOUDFRONT_DOMAIN`: AWS Cloudfront domain.
- `S3_BUCKET_NAME`: AWS S3 Bucket name.
- `STRIPE_SECRET_KEY`: Stripe secret key for backend payments.
- `CLERK_PUBLISHABLE_KEY`: The Clerk public key for user authentication.
- `CLERK_SECRET_KEY`: The Clerk secret key for user authentication.

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
