import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { calculateChart, getHistoricalOffset } from '../../lib/chart'

const CURRENT_NAME     = ''
const CURRENT_LOCATION = ''
const CURRENT_YEAR     = new Date().getFullYear()

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(year: number, month: number): number {
  // new Date(year, month, 0) → last day of 1-indexed `month`
  return new Date(year, month, 0).getDate()
}

interface DataPanelProps {
  onAfterCalculate?: () => void
}

export default function DataPanel({ onAfterCalculate }: DataPanelProps) {
  const setChartResult   = useStore((s) => s.setChartResult)
  const clearChartResult = useStore((s) => s.clearChartResult)

  const [name,    setName]    = useState(CURRENT_NAME)
  const [location, setLocation] = useState(CURRENT_LOCATION)
  const [year,    setYear]    = useState(1900)
  const [month,   setMonth]   = useState(1)
  const [day,     setDay]     = useState(1)
  const [hour,    setHour]    = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleReset() {
    clearChartResult()
    setName(CURRENT_NAME)
    setLocation(CURRENT_LOCATION)
    setYear(1900)
    setMonth(1)
    setDay(1)
    setHour(0)
    setMinutes(0)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const offset = await getHistoricalOffset(location, year, month, day, hour, minutes)
      const result = calculateChart(year, month, day, hour, minutes, offset)
      console.log(result)
      setChartResult(result)
      onAfterCalculate?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-xs font-semibold tracking-widest uppercase text-muted">
        Data
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-dim uppercase tracking-wider">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="panel-input"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-dim uppercase tracking-wider">Location</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Berlin, Germany"
            className="panel-input"
          />
        </div>

        {/* Year / Month / Day — one row */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-dim uppercase tracking-wider">Date</span>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: '3fr 4fr 2fr' }}>
            <input
              type="number"
              value={year}
              onChange={(e) => {
                const y = Number(e.target.value)
                setYear(y)
                const max = daysInMonth(y, month)
                if (day > max) setDay(max)
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Year"
              min={1900}
              max={CURRENT_YEAR}
              className="panel-input text-center"
            />
            <select
              value={month}
              onChange={(e) => {
                const m = Number(e.target.value)
                setMonth(m)
                const max = daysInMonth(year, m)
                if (day > max) setDay(max)
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="panel-input"
            >
              {MONTHS.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              className="panel-input text-center"
            >
              {Array.from({ length: daysInMonth(year, month) }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hour / Minutes */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-dim uppercase tracking-wider">Time</span>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="number"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="HH"
              min={0}
              max={23}
              className="panel-input text-center"
            />
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="MM"
              min={0}
              max={59}
              className="panel-input text-center"
            />
          </div>
          <span className="text-[9px] text-dim opacity-60 text-center">hour · minutes (local)</span>
        </div>

        {error && (
          <p className="text-[10px] text-red-400 leading-snug">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            disabled={loading || !location}
            className="btn-ctrl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '◌ …' : '▶ Calculate'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-ctrl text-sm"
          >
            ✕ Reset
          </button>
        </div>
      </form>
    </div>
  )
}
