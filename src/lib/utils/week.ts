// Week utilities — all weeks start on Monday (ISO 8601).

/**
 * Returns the Monday of the week containing the given date (defaults to today).
 * Returns a Date with time set to midnight UTC.
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0 = Sun, 1 = Mon, …
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Formats a Date as an ISO date string (YYYY-MM-DD) using UTC.
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Returns a human-readable week label, e.g. "w/c 5 May" or "This week".
 */
export function formatWeekLabel(monday: Date, currentMonday: Date): string {
  const isCurrentWeek = toISODate(monday) === toISODate(currentMonday)
  if (isCurrentWeek) return 'This week'

  const diff =
    (monday.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)

  if (diff === -1) return 'Last week'
  if (diff === 1)  return 'Next week'

  const day   = monday.getUTCDate()
  const month = monday.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
  return `w/c ${day} ${month}`
}

/**
 * Returns an array of Mondays centred on the current week:
 * 4 weeks back, current week, 3 weeks ahead — 8 total.
 */
export function getWeekOptions(): { date: Date; label: string }[] {
  const current = getMondayOfWeek()
  const weeks: { date: Date; label: string }[] = []

  for (let offset = -4; offset <= 3; offset++) {
    const d = new Date(current)
    d.setUTCDate(d.getUTCDate() + offset * 7)
    weeks.push({ date: d, label: formatWeekLabel(d, current) })
  }

  return weeks
}
