'use client'

interface SparklineChartProps {
  data: number[]          // массив из 7 значений
  color?: string          // hex-цвет линии, по умолчанию — акцентный
  width?: number
  height?: number
  className?: string
}

export function SparklineChart({
  data,
  color,
  width = 80,
  height = 28,
  className,
}: SparklineChartProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  // Нормализуем точки
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return [x, y] as [number, number]
  })

  // Строим SVG path через кривые Безье для плавности
  const d = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = points[i - 1]
    const cpx = (px + x) / 2
    return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
  }, '')

  // Area под линией
  const areaD =
    `${d} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`

  const lineColor = color ?? 'hsl(var(--primary, 174 100% 21%))'
  const gradientId = `sg-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={d}
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Последняя точка — dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2}
        fill={lineColor}
      />
    </svg>
  )
}
