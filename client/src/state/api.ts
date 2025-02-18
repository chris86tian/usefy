import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { User } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/clerk-js";
import { toast } from "sonner";

const server_url = process.env.NEXT_ENV === "production" ? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_LOCAL_URL;

const customBaseQuery = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: any
) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: server_url,
    credentials: "include",
    prepareHeaders: async (headers) => {
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const body = (args as FetchArgs).body;
      if (!body || !(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  });

  try {
    const result: any = await baseQuery(args, api, extraOptions);

    if (result.error) {
      const errorData = result.error.data;
      const errorMessage =
        errorData?.message ||
        result.error.status.toString() ||
        "An error occurred";
      toast.error(`Error: ${errorMessage}`);
    }

    const isMutationRequest =
      (args as FetchArgs).method && (args as FetchArgs).method !== "GET";

    if (isMutationRequest) {
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
  tagTypes: ["Courses", "Users", "UserCourseProgress"],
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

    getUsers: build.query<User, void>({
      query: () => "users/clerk",
    }),

    getCourseUsers: build.query<User[], string>({
      query: (courseId) => `users/clerk/course/${courseId}`,
    }),

    promoteUserToAdmin: build.mutation<User, string>({
      query: (userId) => ({
        url: `users/clerk/${userId}/promote`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
    }),

    demoteUserFromAdmin: build.mutation<User, string>({
      query: (userId) => ({
        url: `users/clerk/${userId}/demote`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
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
    COURSES
    =============== 
    */
    getCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: "courses",
        params: { category },
      }),
      providesTags: ["Courses"],
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Courses", id }],
    }),

    createCourse: build.mutation<
      Course,
      { teacherId: string; teacherName: string }
    >({
      query: (body) => ({
        url: `courses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses"],
    }),

    updateCourse: build.mutation<
      Course,
      { courseId: string; formData: FormData }
    >({
      query: ({ courseId, formData }) => {
        console.log("Preparing update course request:", { courseId });
        console.log("FormData contents:");
        for (const [key, value] of formData.entries()) {
          console.log(
            `${key}:`,
            key === "sections" ? JSON.parse(value as string) : value
          );
        }

        return {
          url: `courses/${courseId}`,
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
    getNotifications: build.query<Notification[], Partial<Notification>>({
      query: (userId) => `notifications?userId=${userId}`,
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
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
        reply: Reply;
      }
    >({
      query: ({ courseId, sectionId, chapterId, commentId, reply }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}/replies`,
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
      userId: string;
      courseId: string;
      sectionId: string;
      chapterId: string;
      feedback: string;
    }
  >({
    query: (body) => ({
      url: `feedback`,
      method: "POST",
      body,
    }),
  }),
  }),
});

export const {
  useGetUserQuery,
  useGetUsersQuery,
  useGetCourseUsersQuery,
  usePromoteUserToAdminMutation,
  useDemoteUserFromAdminMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
  useCreateAssignmentMutation,
  useGetAssignmentsQuery,
  useDeleteAssignmentMutation,
  useUpdateAssignmentMutation,
  useGetAssignmentQuery,
  useCreateSubmissionMutation,
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
  useGetCommitsQuery,
  useCreateCommentMutation,
  useUpvoteCommentMutation,
  useDownvoteCommentMutation,
  useCreateReplyMutation,
  useGetChapterCommentsQuery,
  useLikeChapterMutation,
  useDislikeChapterMutation,
  useCreateFeedbackMutation,
} = api;
