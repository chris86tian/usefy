# Vimeo Integration Setup

This document provides instructions for setting up Vimeo integration for course generation.

## Prerequisites

1. A Vimeo account (Pro, Business, or Premium plan recommended for API access)
2. Access to create API applications in your Vimeo account

## Setup Steps

1. Go to the [Vimeo Developer Portal](https://developer.vimeo.com/)
2. Log in with your Vimeo account
3. Create a new application by clicking "Create App"
4. Fill in the required information:
   - Name: Usefy Integration
   - Description: Integration for Usefy course platform
   - App URL: Your application URL
   - Callback URLs: Your application callback URL
5. Select the appropriate scopes for your application:
   - `public`
   - `private`
   - `video_files`
   - `create`
   - `edit`
   - `delete`
   - `interact`
   - `upload`
6. Generate an access token with the selected scopes
7. Copy the access token and add it to your `.env.local` file:

```
VIMEO_ACCESS_TOKEN=your_access_token_here
```

## User Process Flow

Once the Vimeo integration is set up, here's how the process works for users:

### For Administrators/Developers:
1. **One-time Setup**: The administrator needs to obtain a Vimeo access token and add it to the `.env.local` file as described above.
2. **No Additional Authorization Required**: Unlike OAuth flows, users will not need to individually authorize with Vimeo. The system-wide access token handles all API requests.

### For Course Creators:
1. **Upload Video to Vimeo**: First, upload your video to Vimeo through your Vimeo account.
2. **Set Privacy Settings**: Make sure your video is either unlisted or public so it can be accessed by the API.
3. **Enable Captions/Transcripts**: For best results, ensure your video has captions or transcripts enabled on Vimeo.
4. **Copy Video URL**: Get the URL of your Vimeo video (e.g., `https://vimeo.com/123456789`).

### Course Generation Process:
1. **Access Course Editor**: Navigate to the course editor in Usefy.
2. **Click "Generate"**: Click the "Generate" button to open the dialog.
3. **Select Vimeo**: Choose "Vimeo" as the video source.
4. **Enter Video URL**: Paste your Vimeo video URL.
5. **Configure Options**: Select options for generating quizzes, assignments, etc.
6. **Click "Process"**: Click the "Process" button to start the course generation.
7. **Wait for Processing**: The system will:
   - Connect to Vimeo using the pre-configured access token
   - Fetch the video transcript
   - Analyze the content
   - Generate course sections, chapters, and materials
   - No user authentication or additional steps required

### What Happens Behind the Scenes:
1. The system extracts the Vimeo video ID from the URL
2. It uses the access token to fetch the video transcript via the Vimeo API
3. For Vimeo videos, the system uses OpenAI to analyze the transcript and generate course content
4. The generated content is structured into sections, chapters, quizzes, and assignments
5. Timestamps are applied to each chapter for easy navigation

## Usage

Once you've set up the Vimeo integration, you can:

1. Upload unlisted videos to Vimeo
2. Generate courses from Vimeo videos
3. Extract transcripts and create chapters automatically

## Troubleshooting

If you encounter issues with the Vimeo integration:

1. Verify that your access token has the correct scopes
2. Check that your Vimeo account has the necessary permissions
3. Ensure that your videos have captions/transcripts enabled
4. Verify that the video is accessible (unlisted or public)
5. Check that the `.env.local` file contains the correct access token
6. Ensure your Vimeo plan supports API access (Pro, Business, or Premium)
