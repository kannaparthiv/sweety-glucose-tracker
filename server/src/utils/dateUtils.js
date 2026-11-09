/**
 * Date utility functions for Sweety Blood Glucose Tracker
 */

function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getTodayString() {
  // Use YYYY-MM-DD in local time
  return new Date().toLocaleDateString('en-CA');
}

function isFutureDate(dateStr) {
  const today = getTodayString();
  return dateStr > today;
}

/**
 * Computes exact date ranges for Daily, Month-to-date, and Monthly (previous month)
 * @param {string} selectedDateStr - YYYY-MM-DD
 */
function getReportDateRanges(selectedDateStr) {
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Daily
  const dailyRange = {
    start: selectedDateStr,
    end: selectedDateStr,
  };

  // Month-to-date: 1st of month to selected date
  const mtdRange = {
    start: `${yearStr}-${String(month).padStart(2, '0')}-01`,
    end: selectedDateStr,
  };

  // Monthly: Whole previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const prevMonthStart = `${prevYear}-${prevMonthStr}-01`;
  const lastDayPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthEnd = `${prevYear}-${prevMonthStr}-${String(lastDayPrevMonth).padStart(2, '0')}`;

  const monthlyRange = {
    start: prevMonthStart,
    end: prevMonthEnd,
  };

  return {
    daily: dailyRange,
    monthToDate: mtdRange,
    monthly: monthlyRange,
  };
}

module.exports = {
  isValidDateString,
  getTodayString,
  isFutureDate,
  getReportDateRanges,
};
