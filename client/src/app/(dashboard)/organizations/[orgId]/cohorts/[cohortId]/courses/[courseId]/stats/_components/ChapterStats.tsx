import { useGetBatchChapterStatsQuery } from "@/state/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

interface ChapterStatsProps {
  courseId: string;
  chapterId: string;
  completionRate: number;
  timeRange: "1d" | "7d" | "30d" | "custom";
  dateRange: DateRange | undefined;
  chapterIds: string[];
}

export default function ChapterStats({ 
  courseId, 
  chapterId, 
  completionRate,
  timeRange,
  dateRange,
  chapterIds
}: ChapterStatsProps) {
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data, isLoading, error } = useGetBatchChapterStatsQuery(
    { courseId, chapterIds },
    {
      skip: !courseId || !chapterIds?.length,
      refetchOnMountOrArgChange: true
    }
  );

  useEffect(() => {
    if (error) {
      console.error('API Error Details:', {
        status: (error as any)?.status,
        data: (error as any)?.data,
        courseId,
        chapterId,
        timestamp: new Date().toISOString()
      });
    }
  }, [error, courseId, chapterId]);

  // Filter data based on time range
  useEffect(() => {
    if (data?.stats?.[chapterId]?.dataPoints) {
      let cutoffDate: Date;
      
      if (timeRange === "custom" && dateRange?.from) {
        cutoffDate = dateRange.from;
      } else {
        const days = timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30;
        cutoffDate = subDays(new Date(), days);
      }
      
      const filtered = data.stats[chapterId].dataPoints.filter((point: any) => {
        const pointDate = new Date(point.date);
        return pointDate >= cutoffDate;
      });

      setFilteredData(filtered);
    }
  }, [data, chapterId, timeRange, dateRange]);

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (error) {
    console.error('Error in ChapterStats:', error);
    return <div className="text-muted-foreground">No time tracking data available</div>;
  }

  if (!data?.stats?.[chapterId]) {
    console.log('No stats data available for:', { courseId, chapterId });
    return <div className="text-muted-foreground">No time tracking data available</div>;
  }

  const totalHours = (data.stats[chapterId].totalDuration || 0) / 3600;
  const averageTimePerUser = data.stats[chapterId].averageDuration || 0;
  const uniqueUsers = data.stats[chapterId].totalUsers || 0;

  // Format time for display
  const formatTime = (seconds: number) => {
    // Convert milliseconds to seconds if needed
    const secondsValue = seconds > 1000 ? seconds / 1000 : seconds;
    const hours = Math.floor(secondsValue / 3600);
    const minutes = Math.floor((secondsValue % 3600) / 60);
    const remainingSeconds = Math.round(secondsValue % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Format time for chart axis (simpler format)
  const formatChartTime = (seconds: number) => {
    // Convert milliseconds to seconds if needed
    const secondsValue = seconds > 1000 ? seconds / 1000 : seconds;
    const hours = Math.floor(secondsValue / 3600);
    const minutes = Math.floor((secondsValue % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time/User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(averageTimePerUser)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis 
              tickFormatter={formatChartTime}
              domain={['0', (dataMax: number) => Math.ceil(dataMax * 1.2)]}
              ticks={[
                0,
                Math.ceil(Math.max(...filteredData.map(d => d.duration)) * 0.25),
                Math.ceil(Math.max(...filteredData.map(d => d.duration)) * 0.5),
                Math.ceil(Math.max(...filteredData.map(d => d.duration)) * 0.75),
                Math.ceil(Math.max(...filteredData.map(d => d.duration)))
              ]}
            />
            <Tooltip 
              formatter={(value: number) => [formatTime(value), 'Duration']}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <Legend />
            <Bar 
              dataKey="duration" 
              fill="#2563eb" 
              name="Time Spent"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}