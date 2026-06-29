export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString("en-CA", { month: "long" });
}

export function getWeeksForMonth(
  year: number,
  month: number
): { start: Date; end: Date; label: string }[] {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let current = new Date(firstDay);

  // Week 1: 1st of month → first Sunday
  const firstSunday = new Date(current);
  while (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + 1);
  }
  if (firstSunday <= lastDay) {
    weeks.push({
      start: new Date(current),
      end: new Date(Math.min(firstSunday.getTime(), lastDay.getTime())),
      label: formatWeekLabel(current, firstSunday <= lastDay ? firstSunday : lastDay),
    });
    current = new Date(firstSunday);
    current.setDate(current.getDate() + 1); // Monday after first Sunday
  }

  // Middle weeks: Monday → Sunday
  while (current <= lastDay) {
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
    const actualEnd = weekEnd > lastDay ? lastDay : weekEnd;

    weeks.push({
      start: new Date(current),
      end: new Date(actualEnd),
      label: formatWeekLabel(current, actualEnd),
    });

    current = new Date(actualEnd);
    current.setDate(current.getDate() + 1); // Next Monday
  }

  return weeks;
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
