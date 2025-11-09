'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SpendingChartProps {
  data: Array<{ date: string; amount: number }>;
  color?: string;
}

export default function SpendingChart({ data, color = '#ef4444' }: SpendingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="date" 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={{ stroke: '#9ca3af' }}
          tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
