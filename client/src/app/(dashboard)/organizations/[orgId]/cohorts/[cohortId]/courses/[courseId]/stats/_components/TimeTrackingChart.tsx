import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate, formatDuration } from '@/lib/utils';

interface TimeTrackingChartProps {
  data: Array<{
    date: string;
    duration: number;
  }>;
}

export default function TimeTrackingChart({ data }: TimeTrackingChartProps) {
  const chartId = `time-tracking-${data.length}`;
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#94a3b8' }}
            axisLine={{ stroke: '#94a3b8' }}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={50}
            key={`x-axis-${chartId}`}
          />
          <YAxis
            tickFormatter={formatDuration}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#94a3b8' }}
            axisLine={{ stroke: '#94a3b8' }}
            tickMargin={8}
            key={`y-axis-${chartId}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(payload[0].payload.date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {typeof payload[0].value === 'number' ? formatDuration(payload[0].value) : '0h 0m'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
            key={`tooltip-${chartId}`}
          />
          <Bar
            dataKey="duration"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            key={`bar-${chartId}`}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 