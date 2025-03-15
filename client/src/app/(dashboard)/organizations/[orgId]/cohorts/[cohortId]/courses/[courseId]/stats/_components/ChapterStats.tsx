import { useGetChapterStatsQuery } from "@/state/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function ChapterStats({ courseId, chapterId }: { 
  courseId: string; 
  chapterId: string 
}) {
  const { data, isLoading, error } = useGetChapterStatsQuery(
    { courseId, chapterId },
    {
      skip: !courseId || !chapterId,
      refetchOnMountOrArgChange: true
    }
  );

  useEffect(() => {
    if (error) {
      console.error('API Error Details:', {
        status: (error as any)?.status,
        data: (error as any)?.data,
        courseId,
        chapterId
      });
    }
  }, [error, courseId, chapterId]);


  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (error) return <div>Error loading statistics</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium">Total Sessions</h3>
          <p className="text-2xl font-bold">{data?.totalUsers}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium">Average Time</h3>
          <p className="text-2xl font-bold">
            {Math.floor((data?.totalDuration || 0) / 3600)}h {Math.floor((data?.averageDuration || 0) / 60)}m {Math.floor((data?.averageDuration || 0) % 60)}s
          </p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium">Total Time Spent</h3>
          <p className="text-2xl font-bold">
            {Math.floor((data?.totalDuration || 0) / 3600)}h {Math.floor(((data?.totalDuration || 0) % 3600) / 60)}m {Math.floor((data?.averageDuration || 0) % 60)}s
          </p>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.dataPoints}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="duration" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}