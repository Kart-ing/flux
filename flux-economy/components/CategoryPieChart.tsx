'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend 
          wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
