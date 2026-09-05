/**
 * Deterministic Working Hours Calculator
 *
 * Enforces business rule:
 * Weekly hours = (End Time − Start Time − Break Duration) * Number of Working Days
 *
 * Guarantees that manually submitted weekly hours can NEVER become the source of truth.
 */

/**
 * Calculate weekly working hours from time stamps and days
 * @param {string} startTime - Format "HH:MM" (24h)
 * @param {string} endTime - Format "HH:MM" (24h)
 * @param {number} [breakDuration=0] - Break in minutes
 * @param {Array<string>} [weeklyWorkingDays=[]] - List of active days
 * @returns {number} Calculated weekly hours (rounded to 2 decimal places)
 */
const calculateWeeklyHours = (startTime, endTime, breakDuration = 0, weeklyWorkingDays = []) => {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return 0;
  }

  let dailyMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (dailyMinutes < 0) {
    // Overnight shift handling (e.g. 22:00 to 06:00)
    dailyMinutes += 24 * 60;
  }

  const netDailyMinutes = Math.max(0, dailyMinutes - (Number(breakDuration) || 0));
  const activeDaysCount = Array.isArray(weeklyWorkingDays) ? weeklyWorkingDays.length : 0;
  const totalWeeklyMinutes = netDailyMinutes * activeDaysCount;

  return Math.round((totalWeeklyMinutes / 60) * 100) / 100;
};

module.exports = {
  calculateWeeklyHours
};
