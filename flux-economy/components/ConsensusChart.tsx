'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ConsensusChartProps {
  data: Array<{ agentName: string; approvalRate: number; rejectionRate: number }>;
}

export default function ConsensusChart({ data }: ConsensusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="agentName" 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={{ stroke: '#9ca3af' }}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number) => `${value.toFixed(1)}%`}
        />
        <Legend 
          wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
        />
        <Bar dataKey="approvalRate" fill="#10b981" name="Approval Rate" />
        <Bar dataKey="rejectionRate" fill="#ef4444" name="Rejection Rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}
