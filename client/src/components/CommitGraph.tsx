import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// interface CommitGridProps {
//   courseId: string;
// }

const CommitGrid = () => {

  const generateSampleinfo = () => {
    const info = [];
    const now = new Date();
    for (let i = 0; i < 357; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      info.unshift({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10)
      });
    }
    return info;
  };

  const info = generateSampleinfo();

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-700';
    if (count <= 2) return 'bg-green-900';
    if (count <= 5) return 'bg-green-700';
    if (count <= 8) return 'bg-green-500';
    return 'bg-green-300';
  };

  const formatDate = (dateString: string | number | Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const weeks: { date: string; count: number; }[][] = [];
  let currentWeek: { date: string; count: number; }[] = [];
  info.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === info.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <Card className="w-5/12 h-64 bg-customgreys-darkGrey">
      <CardHeader>
        <CardTitle>Commit Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-4">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-white hover:ring-opacity-50 transition-all`}
                  title={`${formatDate(day.date)}: ${day.count} commits`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommitGrid;