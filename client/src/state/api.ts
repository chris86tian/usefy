import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { User } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/clerk-js";
import { toast } from "sonner";

const server_url =
  process.env.NEXT_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_LOCAL_URL;

const customBaseQuery = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: any
) => {
  const skipAuth = extraOptions?.skipAuth || false;

  const baseQuery = fetchBaseQuery({
    baseUrl: server_url,
    credentials: "include",
    mode: "cors",
    prepareHeaders: async (headers) => {
      if (!skipAuth) {
        try {
          const token = await window.Clerk?.session?.getToken();
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      }

      const body = (args as FetchArgs).body;
      if (!body || !(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      headers.set("X-Requested-With", "XMLHttpRequest");
      headers.set("Accept", "application/json");

      return headers;
    },
  });

  const isS3UrlRequest =
    typeof args === "object" && args.url?.includes("get-upload");

  try {
    let result: any = await baseQuery(args, api, extraOptions);

    if (
      result.error &&
      result.error.status === "FETCH_ERROR" &&
      typeof args === "object"
    ) {
      console.log(
        "Possible CORS error detected, retrying with additional headers"
      );

      const newArgs = { ...args };
      if (!newArgs.headers) newArgs.headers = {};

      try {
        result = await baseQuery(newArgs, api, extraOptions);
      } catch (retryError) {
        console.error("Retry after CORS error also failed:", retryError);
      }
    }

    if (result.error && result.error.status === 401) {
      console.log("Unauthorized request, checking authentication status");

      const isSignedIn = !!window.Clerk?.session;

      if (!isSignedIn) {
        console.log("User not signed in, redirecting to sign-in page");
        window.Clerk?.openSignIn();
        return {
          error: { status: "CUSTOM_ERROR", error: "Authentication required" },
        };
      } else {
        console.log("User is signed in but got 401, trying to refresh token");
        try {
          const newToken = await window.Clerk?.session?.getToken();

          if (newToken && typeof args === "object") {
            const newArgs = { ...args };
            if (!newArgs.headers) newArgs.headers = {};
            newArgs.headers = {
              ...newArgs.headers,
              Authorization: `Bearer ${newToken}`,
            };

            console.log("Retrying request with refreshed token");
            result = await baseQuery(newArgs, api, extraOptions);
          }
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
        }
      }
    }

    if (result.error) {
      const errorData = result.error.data;
      const errorMessage =
        errorData?.message ||
        result.error.status.toString() ||
        "An error occurred";

      if (result.error.status !== "FETCH_ERROR") {
        toast.error(`Error: ${errorMessage}`);
      }
    }

    const isMutationRequest =
      (args as FetchArgs).method && (args as FetchArgs).method !== "GET";

    if (isMutationRequest && !isS3UrlRequest) {
      const successMessage = result.data?.message;
      if (successMessage) toast.success(successMessage);
    }

    if (result.data) {
      result.data = result.data.data;
    } else if (
      result.error?.status === 204 ||
      result.meta?.response?.status === 24
    ) {
      return { data: null };
    }

    return result;
  } catch (error) {
    console.error("API request error:", error);
    return { error: { status: "FETCH_ERROR", error } };
  }
};

export const api = createApi({
  baseQuery: customBaseQuery,
  reducerPath: "api",
  tagTypes: [
    "Organizations",
    "Courses",
    "Users",
    "UserCourseProgress",
    "Feedback",
    "Cohorts",
    "TimeTracking",
  ],
  endpoints: (build) => ({
    /* 
    ===============
    USER CLERK
    =============== 
    */
    getUser: build.query<User, string>({
      query: (userId) => `users/clerk/${userId}`,
    }),
    updateUser: build.mutation<User, Partial<User> & { userId: string }>({
      query: ({ userId, ...updatedUser }) => ({
        url: `users/clerk/${userId}`,
        method: "PUT",
        body: updatedUser,
      }),
      invalidatesTags: ["Users"],
    }),

    getUsers: build.query<User[], void>({
      query: () => "users/clerk",
      providesTags: ["Users"],
    }),

    getCourseUsers: build.query<User[], string>({
      query: (courseId) => `users/clerk/course/${courseId}`,
    }),

    deleteUser: build.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `users/clerk/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    /* 
    ===============
    ORGANIZATIONS
    =============== 
    */
    getOrganizations: build.query<Organization[], void>({
      query: () => "organizations",
      providesTags: ["Organizations"],
    }),

    getOrganization: build.query<Organization, string>({
      query: (id) => `organizations/${id}`,
      providesTags: ["Organizations"],
    }),

    createOrganization: build.mutation<Organization, Partial<Organization>>({
      query: (body) => ({
        url: "organizations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organizations"],
    }),

    updateOrganization: build.mutation<
      Organization,
      { organizationId: string; formData: FormData }
    >({
      query: ({ organizationId, formData }) => ({
        url: `organizations/${organizationId}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Organizations"],
    }),

    deleteOrganization: build.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `organizations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Organizations"],
    }),

    joinOrganization: build.mutation<Organization, string>({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/join`,
        method: "POST",
      }),
      invalidatesTags: ["Organizations"],
    }),

    getMyOrganizations: build.query<Organization[], void>({
      query: () => "organizations/my",
    }),

    getOrganizationCourses: build.query<Course[], string>({
      query: (organizationId) => `organizations/${organizationId}/courses`,
      transformErrorResponse: (response) => {
        if (
          response.status === 404 ||
          response.status === 401 ||
          response.status === 403
        ) {
          console.log(
            `Error fetching courses for organization ${response.status}:`,
            response
          );
          return { data: [] };
        }
        return response;
      },
      transformResponse: (response, meta, arg) => {
        if (!response) return [];
        return response;
      },
      extraOptions: {
        skipAuth: true,
      },
    }),

    getMyOrganizationCourses: build.query<Course[], string>({
      query: (organizationId) => `organizations/${organizationId}/my-courses`,
    }),

    addCourseToOrganization: build.mutation<
      { message: string },
      { organizationId: string; courseId: string }
    >({
      query: ({ organizationId, courseId }) => ({
        url: `organizations/${organizationId}/${courseId}`,
        method: "POST",
      }),
    }),

    removeCourseFromOrganization: build.mutation<
      { message: string },
      { organizationId: string; courseId: string }
    >({
      query: ({ organizationId, courseId }) => ({
        url: `organizations/${organizationId}/${courseId}`,
        method: "DELETE",
      }),
    }),

    getMyUserCourseProgresses: build.query<UserCourseProgress[], string>({
      query: (organizationId) => `organizations/${organizationId}/progresses`,
    }),

    inviteUserToOrganization: build.mutation<
      { message: string },
      { organizationId: string; email: string; role: string }
    >({
      query: ({ organizationId, email, role }) => ({
        url: `organizations/${organizationId}/invite`,
        method: "POST",
        body: { email, role },
      }),
    }),

    inviteUserToCohort: build.mutation<
      { message: string },
      { organizationId: string; cohortId: string; email: string; role: string }
    >({
      query: ({ organizationId, cohortId, email, role }) => ({
        url: `organizations/${organizationId}/cohort/${cohortId}/invite`,
        method: "POST",
        body: { email, role },
      }),
    }),

    getOrganizationUsers: build.query<
      { admins: User[]; instructors: User[]; learners: User[] },
      string
    >({
      query: (organizationId: string) =>
        `organizations/${organizationId}/users`,
    }),

    removeUserFromOrganization: build.mutation<
      { message: string },
      { organizationId: string; userId: string; role: string }
    >({
      query: ({ organizationId, userId, role }) => ({
        url: `organizations/${organizationId}/remove/${userId}`,
        method: "DELETE",
        body: { role },
      }),
    }),

    changeUserRole: build.mutation<
      { message: string },
      {
        organizationId: string;
        userId: string;
        currentRole: string;
        newRole: string;
      }
    >({
      query: ({ organizationId, userId, currentRole, newRole }) => ({
        url: `organizations/${organizationId}/change-role/${userId}`,
        method: "PUT",
        body: { currentRole, newRole },
      }),
    }),
    /* 
    ===============
    COHORTS
    =============== 
    */
    createCohort: build.mutation<
      Cohort,
      Partial<Cohort> & { organizationId: string }
    >({
      query: ({ organizationId, ...body }) => ({
        url: `cohorts/${organizationId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cohorts"],
    }),
    getCohorts: build.query<Cohort[], string>({
      query: (organizationId) => `cohorts/${organizationId}`,
      providesTags: ["Cohorts"],
    }),
    getCohort: build.query<
      Cohort,
      { organizationId: string; cohortId: string }
    >({
      query: ({ organizationId, cohortId }) =>
        `cohorts/${organizationId}/${cohortId}`,
    }),
    updateCohort: build.mutation<
      Cohort,
      { organizationId: string; cohortId: string; name: string }
    >({
      query: ({ organizationId, cohortId, name }) => ({
        url: `cohorts/${organizationId}/${cohortId}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: ["Cohorts"],
    }),
    deleteCohort: build.mutation<
      { message: string },
      { organizationId: string; cohortId: string }
    >({
      query: ({ organizationId, cohortId }) => ({
        url: `cohorts/${organizationId}/${cohortId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cohorts"],
    }),
    getCohortLearners: build.query<
      User[],
      { organizationId: string; cohortId: string }
    >({
      query: ({ organizationId, cohortId }) =>
        `cohorts/${organizationId}/${cohortId}/learners`,
    }),
    addLearnerToCohort: build.mutation<
      { message: string },
      { organizationId: string; cohortId: string; learnerId: string }
    >({
      query: ({ organizationId, cohortId, learnerId }) => ({
        url: `cohorts/${organizationId}/${cohortId}/add-learner`,
        method: "POST",
        body: { learnerId },
      }),
    }),
    removeLearnerFromCohort: build.mutation<
      { message: string },
      { organizationId: string; cohortId: string; learnerId: string }
    >({
      query: ({ organizationId, cohortId, learnerId }) => ({
        url: `cohorts/${organizationId}/remove-learner/${cohortId}`,
        method: "DELETE",
        body: { learnerId },
      }),
    }),
    getCohortCourses: build.query<
      Course[],
      { organizationId: string; cohortId: string }
    >({
      query: ({ organizationId, cohortId }) =>
        `cohorts/${organizationId}/${cohortId}/courses`,
    }),
    addCourseToCohort: build.mutation<
      { message: string },
      { organizationId: string; cohortId: string; courseId: string }
    >({
      query: ({ organizationId, cohortId, courseId }) => ({
        url: `cohorts/${organizationId}/${cohortId}/add-course`,
        method: "POST",
        body: { courseId },
      }),
    }),
    removeCourseFromCohort: build.mutation<
      { message: string },
      { cohortId: string; courseId: string }
    >({
      query: ({ cohortId, courseId }) => ({
        url: `cohorts/remove-course/${cohortId}`,
        method: "DELETE",
        body: { courseId },
      }),
    }),
    /* 
    ===============
    COURSES
    =============== 
    */
    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Courses", id }],
    }),

    createCourse: build.mutation<Course, void>({
      query: () => ({
        url: `courses`,
        method: "POST",
      }),
      invalidatesTags: ["Courses"],
    }),

    updateCourse: build.mutation<
      Course,
      { orgId: string; cohortId: string; courseId: string; formData: FormData }
    >({
      query: ({ orgId, courseId, cohortId, formData }) => {
        return {
          url: `courses/${orgId}/cohorts/${cohortId}/${courseId}`,
          method: "PUT",
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
    }),

    archiveCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `courses/${courseId}/archive`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: "Courses", id: courseId },
      ],
    }),

    unarchiveCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `courses/${courseId}/unarchive`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: "Courses", id: courseId },
      ],
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses"],
    }),

    addCourseInstructor: build.mutation<
      { message: string; id: string },
      { courseId: string; userId?: string; email?: string }
    >({
      query: ({ courseId, userId, email }) => ({
        url: `courses/${courseId}/instructors`,
        method: "POST",
        body: userId ? { userId } : { email },
      }),
    }),

    removeCourseInstructor: build.mutation<
      { message: string },
      { courseId: string; userId: string }
    >({
      query: ({ courseId, userId }) => ({
        url: `courses/${courseId}/instructors`,
        method: "DELETE",
        body: { userId },
      }),
    }),

    getCourseInstructors: build.query<User[], string>({
      query: (courseId) => `courses/${courseId}/instructors`,
    }),

    getUploadVideoUrl: build.mutation<
      { uploadUrl: string; videoUrl: string },
      {
        courseId: string;
        chapterId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-upload-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    getUploadImageUrl: build.mutation<
      { uploadUrl: string; imageUrl: string },
      { courseId: string; fileName: string; fileType: string }
    >({
      query: ({ courseId, fileName, fileType }) => ({
        url: `courses/${courseId}/get-upload-image-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),
    /*
    ===============
    ASSIGNMENTS
    ===============
    */
    createAssignment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        assignment: Assignment;
      }
    >({
      query: ({ courseId, sectionId, chapterId, assignment }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments`,
        method: "POST",
        body: assignment,
      }),
    }),

    getAssignments: build.query<
      Assignment[],
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments`,
    }),

    getAssignment: build.query<
      Assignment,
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        assignmentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, assignmentId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`,
    }),

    deleteAssignment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        assignmentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, assignmentId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`,
        method: "DELETE",
      }),
    }),

    updateAssignment: build.mutation<
      Assignment,
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        assignmentId: string;
        assignment: Assignment;
      }
    >({
      query: ({
        courseId,
        sectionId,
        chapterId,
        assignmentId,
        assignment,
      }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`,
        method: "PUT",
        body: assignment,
      }),
    }),
    /*
    ===============
    SUBMISSIONS
    ===============
    */
    createSubmission: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        assignmentId: string;
        submission: Submission;
      }
    >({
      query: ({
        courseId,
        sectionId,
        chapterId,
        assignmentId,
        submission,
      }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}/submit`,
        method: "POST",
        body: submission,
      }),
    }),

    /* 
    ===============
    FILE UPLOADS (PDF)
    =============== 
    */

    getUploadFileUrl: build.mutation<
      { uploadUrl: string; fileUrl: string },
      {
        courseId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/get-upload-file-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    /* 
    ===============
    TRANSACTIONS
    =============== 
    */
    getTransactions: build.query<Transaction[], string>({
      query: (userId) => `transactions?userId=${userId}`,
    }),
    createStripePaymentIntent: build.mutation<
      { clientSecret: string },
      { amount: number }
    >({
      query: ({ amount }) => ({
        url: `/transactions/stripe/payment-intent`,
        method: "POST",
        body: { amount },
      }),
    }),
    createTransaction: build.mutation<Transaction, Partial<Transaction>>({
      query: (transaction) => ({
        url: "transactions",
        method: "POST",
        body: transaction,
      }),
    }),
    getTransactionStats: build.query<Transaction, void>({
      query: () => "transactions/stats",
    }),

    /* 
    ===============
    NOTIFICATIONS
    =============== 
    */
    getNotifications: build.query<UserNotification[], void>({
      query: () => "notifications",
    }),
    markNotificationAsRead: build.mutation<{ message: string }, string>({
      query: (notificationId) => ({
        url: `notifications/${notificationId}`,
        method: "PUT",
      }),
    }),

    /* 
    ===============
    USER COURSE PROGRESS
    =============== 
    */
    getUserEnrolledCourses: build.query<Course[], string>({
      query: (userId) => `users/course-progress/${userId}/enrolled-courses`,
      providesTags: ["Courses", "UserCourseProgress"],
    }),

    getUserCourseProgress: build.query<
      UserCourseProgress,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) =>
        `users/course-progress/${userId}/courses/${courseId}`,
      providesTags: ["UserCourseProgress"],
    }),

    updateUserCourseProgress: build.mutation<
      UserCourseProgress,
      {
        userId: string;
        courseId: string;
        progressData: {
          sections: SectionProgress[];
        };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}`,
        method: "PUT",
        body: progressData,
      }),
      invalidatesTags: ["UserCourseProgress"],
      async onQueryStarted(
        { userId, courseId, progressData },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            "getUserCourseProgress",
            { userId, courseId },
            (draft) => {
              Object.assign(draft, {
                ...draft,
                sections: progressData.sections,
              });
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    updateQuizProgress: build.mutation<
      ChapterProgress,
      {
        userId: string;
        courseId: string;
        sectionId: string;
        chapterId: string;
        completed: boolean;
      }
    >({
      query: ({ userId, courseId, sectionId, chapterId, completed }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}/quiz`,
        method: "PUT",
        body: { sectionId, chapterId, completed },
      }),
    }),

    getUserCourseSubmissions: build.query<
      any[],
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) =>
        `courses/${courseId}/submissions/${userId}`,
    }),

    /*
    ===============
    COMMITS
    ===============
    */
    getCommits: build.query<Commit[], { userId: string }>({
      query: ({ userId }) => `commits/${userId}`,
    }),

    /*
    ===============
    COMMENTS
    ===============
    */
    createComment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        comment: ChapterComment;
      }
    >({
      query: ({ courseId, sectionId, chapterId, comment }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
        method: "POST",
        body: comment,
      }),
    }),

    upvoteComment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, commentId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}/upvote`,
        method: "POST",
      }),
    }),

    downvoteComment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, commentId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}/downvote`,
        method: "POST",
      }),
    }),

    createReply: build.mutation<
      { message: string },
      {
        orgId: string;
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
        reply: Reply;
      }
    >({
      query: ({ orgId, courseId, sectionId, chapterId, commentId, reply }) => ({
        url: `courses/${orgId}/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}/replies`,
        method: "POST",
        body: reply,
      }),
    }),

    getChapterComments: build.query<
      ChapterComment[],
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
    }),

    /*
    ===============
    LIKE/DISLIKE
    ===============
    */
    likeChapter: build.mutation<
      { message: string },
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/like`,
        method: "POST",
      }),
    }),

    dislikeChapter: build.mutation<
      { message: string },
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/dislike`,
        method: "POST",
      }),
    }),

    /*
    ===============
    FEEDBACK
    ===============
    */
    createFeedback: build.mutation<
      { message: string },
      {
        feedbackType: "question" | "assignment";
        questionId?: string;
        assignmentId?: string;
        userId: string;
        courseId: string;
        sectionId: string;
        chapterId: string;
        feedback: string;
        username: string;
        createdAt: string;
      }
    >({
      query: (body) => ({
        url: "feedback",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Feedback"],
    }),

    getFeedback: build.query<Feedback[], string>({
      query: (courseId) => `feedback/course/${courseId}`,
      providesTags: ["Feedback"],
    }),

    updateFeedbackStatus: build.mutation<
      Feedback,
      { feedbackId: string; status: string }
    >({
      query: ({ feedbackId, status }) => ({
        url: `feedback/${feedbackId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Feedback"],
    }),

    deleteFeedback: build.mutation<{ message: string }, string>({
      query: (feedbackId) => ({
        url: `feedback/${feedbackId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Feedback"],
    }),

    /*
    ===============
    STATISTICS
    ===============
    */

    getChapterStats: build.query({
      query: ({ courseId, chapterId }) => ({
        url: `time-tracking/stats?courseId=${courseId}&chapterId=${chapterId}`,
      }),
      providesTags: ["TimeTracking"],
    }),

    /*
    ===============
    ENROLLMENTS
    ===============
    */
    enrollUser: build.mutation<
      { message: string },
      { courseId: string; userId: string }
    >({
      query: ({ courseId, userId }) => ({
        url: `courses/${courseId}/enroll/${userId}`,
        method: "POST",
      }),
    }),
    unenrollUser: build.mutation<
      { message: string },
      { courseId: string; userId: string }
    >({
      query: ({ courseId, userId }) => ({
        url: `courses/${courseId}/unenroll/${userId}`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetUsersQuery,
  useGetCourseUsersQuery,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useJoinOrganizationMutation,
  useGetMyOrganizationsQuery,
  useGetOrganizationCoursesQuery,
  useGetMyOrganizationCoursesQuery,
  useAddCourseToOrganizationMutation,
  useRemoveCourseFromOrganizationMutation,
  useGetMyUserCourseProgressesQuery,
  useInviteUserToOrganizationMutation,
  useInviteUserToCohortMutation,
  useGetOrganizationUsersQuery,
  useRemoveUserFromOrganizationMutation,
  useChangeUserRoleMutation,
  useCreateCohortMutation,
  useGetCohortsQuery,
  useGetCohortQuery,
  useUpdateCohortMutation,
  useDeleteCohortMutation,
  useGetCohortLearnersQuery,
  useAddLearnerToCohortMutation,
  useRemoveLearnerFromCohortMutation,
  useGetCohortCoursesQuery,
  useAddCourseToCohortMutation,
  useRemoveCourseFromCohortMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useGetCourseInstructorsQuery,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useGetCourseQuery,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
  useCreateAssignmentMutation,
  useGetAssignmentsQuery,
  useDeleteAssignmentMutation,
  useUpdateAssignmentMutation,
  useGetAssignmentQuery,
  useCreateSubmissionMutation,
  useGetUploadFileUrlMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useCreateStripePaymentIntentMutation,
  useGetTransactionStatsQuery,
  useGetUserEnrolledCoursesQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
  useUpdateQuizProgressMutation,
  useGetUserCourseSubmissionsQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useGetCommitsQuery,
  useCreateCommentMutation,
  useUpvoteCommentMutation,
  useDownvoteCommentMutation,
  useCreateReplyMutation,
  useGetChapterCommentsQuery,
  useLikeChapterMutation,
  useDislikeChapterMutation,
  useCreateFeedbackMutation,
  useGetFeedbackQuery,
  useUpdateFeedbackStatusMutation,
  useDeleteFeedbackMutation,
  useGetChapterStatsQuery,
  useEnrollUserMutation,
  useUnenrollUserMutation,
} = api;
