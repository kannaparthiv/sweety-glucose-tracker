const { query } = require('../config/db');
const { isValidDateString, getTodayString, getReportDateRanges } = require('../utils/dateUtils');

async function getStatsForRange(userId, startDate, endDate) {
  const statsRes = await query(
    `SELECT
       COUNT(*) as count,
       MAX(value) as highest,
       MIN(value) as lowest,
       AVG(value) as avg_val
     FROM readings
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, startDate, endDate]
  );

  const row = statsRes.rows[0];
  const count = parseInt(row.count, 10) || 0;

  if (count === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  const highest = parseInt(row.highest, 10);
  const lowest = parseInt(row.lowest, 10);
  const avgVal = parseFloat(row.avg_val);
  const average = Math.round(avgVal * 10) / 10; // Rounded to 1 decimal place

  return {
    count,
    highest,
    lowest,
    average,
    dateRange: {
      startDate,
      endDate,
    },
  };
}

// GET /api/reports?date=YYYY-MM-DD
async function getReports(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({
        message: 'Please provide a valid date in YYYY-MM-DD format.',
      });
    }

    const ranges = getReportDateRanges(selectedDate);

    // 1. Daily Report
    const dailyStats = await getStatsForRange(
      userId,
      ranges.daily.start,
      ranges.daily.end
    );

    // Get daily individual readings with slots
    const dailyReadingsRes = await query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND date = $2
       ORDER BY
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, selectedDate]
    );

    const dailyReport = {
      ...dailyStats,
      title: 'Daily Report',
      date: selectedDate,
      readings: dailyReadingsRes.rows,
    };

    // 2. Month-to-date Report
    const mtdStats = await getStatsForRange(
      userId,
      ranges.monthToDate.start,
      ranges.monthToDate.end
    );
    const mtdReport = {
      ...mtdStats,
      title: 'Month-to-Date Report',
    };

    // 3. Monthly Report (Previous Month)
    const monthlyStats = await getStatsForRange(
      userId,
      ranges.monthly.start,
      ranges.monthly.end
    );
    const monthlyReport = {
      ...monthlyStats,
      title: 'Monthly Report (Previous Month)',
    };

    // 4. Monthly readings for chart visualization (bonus)
    const monthReadingsRes = await query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value
       FROM readings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC,
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, ranges.monthToDate.start, ranges.monthToDate.end]
    );

    res.status(200).json({
      selectedDate,
      daily: dailyReport,
      monthToDate: mtdReport,
      monthly: monthlyReport,
      chartData: monthReadingsRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReports,
};
