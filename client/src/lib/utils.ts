import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";
import { toast } from "sonner";
import { User } from "@clerk/nextjs/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert cents to formatted currency string (e.g., 4999 -> "$49.99")
export function formatPrice(cents: number | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

// Convert dollars to cents (e.g., "49.99" -> 4999)
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

// Convert cents to dollars (e.g., 4999 -> "49.99")
export function centsToDollars(cents: number | undefined): string {
  return ((cents || 0) / 100).toString();
}

// Zod schema for price input (converts dollar input to cents)
export const priceSchema = z.string().transform((val) => {
  const dollars = parseFloat(val);
  if (isNaN(dollars)) return "0";
  return dollarsToCents(dollars).toString();
});

export const customStyles = "text-gray-300 placeholder:text-gray-500";

export function convertToSubCurrency(amount: number, factor = 100) {
  return Math.round(amount * factor);
}

export function extractVideoId(url: string, source: "youtube" | "vimeo" = "youtube"): string | null {
  if (source === "youtube") {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
  } else if (source === "vimeo") {
    // Extract Vimeo video ID
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /vimeo\.com\/.*\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

export const parseYouTubeTime = (url: string) => {
  const timeParam = url.split("t=")[1];
  if (!timeParam) return 0;

  let seconds = 0;
  const minutes = timeParam.match(/(\d+)m/);
  const secs = timeParam.match(/(\d+)s/);

  if (minutes) seconds += parseInt(minutes[1]) * 60;
  if (secs) seconds += parseInt(secs[1]);

  return seconds;
};

// Convert timestamp string (HH:MM:SS) to seconds
export function convertTimestampToSeconds(timestamp: string | undefined): number {
  if (!timestamp) return 0;
  
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Convert seconds to HH:MM:SS format
export function formatSecondsToTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
}

export const getUserName = (user: User) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  
  return fullName || user.username || user.fullName || user.emailAddresses?.[0]?.emailAddress || "Unknown";
}

export const handleEnroll = async (userId: string, courseId: string, createTransaction: any) => {
  try {
      const transactionData: Partial<Transaction> = {
          transactionId: "free-enrollment",
          userId: userId,
          courseId: courseId,
          paymentProvider: undefined,
          amount: 0,
      };
  
      await createTransaction(transactionData);
      toast.success("Enrolled user successfully!");
  } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Enrolled successfully, but failed to send email.");
  }
}

export const NAVBAR_HEIGHT = 48;

export const courseCategories = [
  { value: "technology", label: "Technology" },
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "artificial-intelligence", label: "Artificial Intelligence" },
] as const;

export const customDataGridStyles = {
  border: "none",
  backgroundColor: "#17181D",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#1B1C22",
    color: "#6e6e6e",
    "& [role='row'] > *": {
      backgroundColor: "#1B1C22 !important",
      border: "none !important",
    },
  },
  "& .MuiDataGrid-cell": {
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-row": {
    backgroundColor: "#17181D",
    "&:hover": {
      backgroundColor: "#25262F",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: "#17181D",
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-filler": {
    border: "none !important",
    backgroundColor: "#17181D !important",
    borderTop: "none !important",
    "& div": {
      borderTop: "none !important",
    },
  },
  "& .MuiTablePagination-root": {
    color: "#6e6e6e",
  },
  "& .MuiTablePagination-actions .MuiIconButton-root": {
    color: "#6e6e6e",
  },
};

export const createCourseFormData = (
  data: CourseFormData,
  sections: Section[],
  thumbnailUrl: string
): FormData => {
  const formData = new FormData();
  formData.append("title", data.courseTitle);
  formData.append("description", data.courseDescription);
  formData.append("price", data.coursePrice.toString());
  formData.append("status", data.courseStatus ? "Published" : "Draft");
  formData.append("image", thumbnailUrl);

  const sectionsWithVideos = sections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({
      ...chapter,
      video: chapter.video,
    })),
  }));

  formData.append("sections", JSON.stringify(sectionsWithVideos));

  return formData;
};

export const uploadAllVideos = async (
  localSections: Section[],
  courseId: string,
  getUploadVideoUrl: any,
  setProgress: (progress: number) => void
) => {
  // Deep clone sections to avoid mutating original data
  const updatedSections = localSections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({ ...chapter })),
  }));

  // Count the total number of videos to upload
  const totalVideos = updatedSections.reduce(
    (count, section) =>
      count +
      section.chapters.filter(
        (chapter) =>
          chapter.video instanceof File && chapter.video.type === "video/mp4"
      ).length,
    0
  );

  let uploadedCount = 0;

  for (let i = 0; i < updatedSections.length; i++) {
    for (let j = 0; j < updatedSections[i].chapters.length; j++) {
      const chapter = updatedSections[i].chapters[j];

      // Check if the video is a File and needs to be uploaded
      if (chapter.video instanceof File && chapter.video.type === "video/mp4") {
        try {
          const updatedChapter = await uploadVideo(
            chapter,
            courseId,
            updatedSections[i].sectionId,
            getUploadVideoUrl
          );

          updatedSections[i].chapters[j] = updatedChapter;
        } catch (error) {
          console.error(
            `Failed to upload video for chapter ${chapter.chapterId}:`,
            error
          );
        }

        // Update progress after each upload attempt
        uploadedCount++;
        setProgress(Math.floor((uploadedCount / totalVideos) * 100));
      }
    }
  }

  return updatedSections;
};

async function uploadVideo(
  chapter: Chapter,
  courseId: string,
  sectionId: string,
  getUploadVideoUrl: any
) {
  const file = chapter.video as File;

  try {
    const { uploadUrl, videoUrl } = await getUploadVideoUrl({
      courseId,
      sectionId,
      chapterId: chapter.chapterId,
      fileName: file.name,
      fileType: file.type,
    }).unwrap();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    toast.success(
      `Video uploaded successfully for chapter ${chapter.chapterId}`
    );

    return { ...chapter, video: videoUrl };
  } catch (error) {
    console.error(
      `Failed to upload video for chapter ${chapter.chapterId}:`,
      error
    );
    toast.error(`Failed to upload video for chapter ${chapter.chapterId}`);
    throw error;
  }
}

export async function uploadThumbnail(
  courseId: string,
  getUploadImageUrl: any,
  file: File
) {
  try {
    const { uploadUrl, imageUrl } = await getUploadImageUrl({
      courseId,
      fileName: file.name,
      fileType: file.type,
    }).unwrap();

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", errorText);
      throw new Error(
        `Upload failed with status ${response.status}: ${errorText}`
      );
    }

    toast.success("Thumbnail uploaded successfully!");
    return imageUrl;
  } catch (error) {
    console.error("Failed to upload thumbnail:", error);
    toast.error("Failed to upload thumbnail");
    throw error;
  }
}

export const uploadAssignmentFile = async (
  file: File,
  getUploadImageUrl: any,
  onProgress?: (progress: number) => void
) => {
  try {
    const { uploadUrl, imageUrl } = await getUploadImageUrl({
      fileName: file.name,
      fileType: file.type,
    }).unwrap();

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = event.loaded / event.total;
          onProgress?.(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });

    toast.success("File uploaded successfully!");
    return imageUrl;
  } catch (error) {
    console.error("Failed to upload file:", error);
    toast.error("Failed to upload file");
    throw error;
  }
};

export const uploadAllFiles = async (
  sections: Section[],
  courseId: string,
  getUploadFileUrl: any,
  progressCallback: (progress: number) => void
) => {
  let totalFiles = 0;
  let uploadedFiles = 0;
  const uploadErrors: string[] = [];

  // Calculate total files to upload
  sections.forEach((section) => {
    if (section.files) {
      totalFiles += section.files.filter(file => file.fileUrl).length;
    }
  });

  const updatedSections = JSON.parse(JSON.stringify(sections));

  for (const section of updatedSections) {
    if (section.files) {
      const updatedFiles = [];
      for (const file of section.files) {
        if (file.file) {
          try {
            const { uploadUrl, fileUrl } = await getUploadFileUrl({
              courseId,
              sectionId: section.sectionId,
              fileName: file.file.name,
              fileType: file.file.type,
            }).unwrap();

            await fetch(uploadUrl, {
              method: "PUT",
              body: file.file,
              headers: { "Content-Type": file.file.type },
            });

            updatedFiles.push({
              ...file,
              fileUrl,
              file: undefined
            });
            uploadedFiles++;
            progressCallback((uploadedFiles / totalFiles) * 100);
          } catch (error) {
            uploadErrors.push(`Failed to upload: ${file.title}`);
          }
        } else if (file.fileUrl) {
          updatedFiles.push(file);
        }
      }
      section.files = updatedFiles;
    }
  }

  if (uploadErrors.length > 0) {
    throw new Error(uploadErrors.join('\n'));
  }

  return updatedSections;
};

export const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor (Timor-Leste)",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (formerly Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export function formatDuration(ms: number) {
  if (!ms) return "0h 0m";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
