'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#01696f', '#437a22', '#006494', '#7a39bb', '#d19900', '#da7101', '#a12c7b', '#a13544']

interface PieDataItem {
  key: string
  name: string
  value: number
  icon?: string
}

interface Props {
  data: PieDataItem[]
  formatValue: (v: number) => string
}

export default function PieChartInner({ data, formatValue }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatValue(v)} />
      </PieChart>
    </ResponsiveContainer>
  )
}
