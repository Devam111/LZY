// Time formatting utilities for frontend

/**
 * Convert minutes to hours with proper formatting
 * @param {number} minutes - Time in minutes
 * @returns {number} - Time in hours rounded to 1 decimal place
 */
export const minutesToHours = (minutes) => {
  if (!minutes || minutes === 0) return 0;
  return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
};

/**
 * Format study time for display
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string (e.g., "2.5h", "0.5h")
 */
export const formatStudyTime = (minutes) => {
  if (!minutes || minutes === 0) return '0.0h';
  const hours = minutesToHours(minutes);
  return `${hours}h`;
};

/**
 * Format study time with smart display (hours or minutes)
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string (e.g., "2.5h", "45m")
 */
export const formatStudyTimeSmart = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = minutes / 60;
  if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  } else {
    return `${Math.round(minutes)}m`;
  }
};

/**
 * Calculate average study time per day
 * @param {number} totalMinutes - Total study time in minutes
 * @param {number} studyDays - Number of study days
 * @returns {number} - Average study time in hours (1 decimal place)
 */
export const calculateAvgStudyTimePerDay = (totalMinutes, studyDays) => {
  if (!studyDays || studyDays === 0) return 0;
  const avgMinutesPerDay = totalMinutes / studyDays;
  return minutesToHours(avgMinutesPerDay);
};

/**
 * Calculate average study time per session
 * @param {number} totalMinutes - Total study time in minutes
 * @param {number} totalSessions - Number of study sessions
 * @returns {number} - Average study time in hours (1 decimal place)
 */
export const calculateAvgStudyTimePerSession = (totalMinutes, totalSessions) => {
  if (!totalSessions || totalSessions === 0) return 0;
  const avgMinutesPerSession = totalMinutes / totalSessions;
  return minutesToHours(avgMinutesPerSession);
};

/**
 * Get study time breakdown
 * @param {number} totalMinutes - Total study time in minutes
 * @returns {object} - Object with formatted time values
 */
export const getStudyTimeBreakdown = (totalMinutes) => {
  const hours = minutesToHours(totalMinutes);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return {
    totalMinutes,
    totalHours: hours,
    totalDays: days,
    remainingHours: Math.round(remainingHours * 10) / 10,
    formatted: formatStudyTime(totalMinutes),
    formattedSmart: formatStudyTimeSmart(totalMinutes),
    formattedWithDays: days > 0 ? `${days}d ${remainingHours}h` : formatStudyTime(totalMinutes)
  };
};

/**
 * Format time from API response
 * @param {object} apiResponse - API response with study time data
 * @returns {object} - Formatted time data
 */
export const formatTimeFromAPI = (apiResponse) => {
  const studyTimeMinutes = apiResponse.studyTimeMinutes || apiResponse.totalStudyTime || 0;
  const studyTimeHours = apiResponse.studyTimeHours || minutesToHours(studyTimeMinutes);
  const avgStudyTimePerDay = apiResponse.avgStudyTimePerDay || 0;
  
  return {
    studyTimeMinutes,
    studyTimeHours,
    avgStudyTimePerDay,
    formatted: formatStudyTime(studyTimeMinutes),
    formattedSmart: formatStudyTimeSmart(studyTimeMinutes),
    breakdown: getStudyTimeBreakdown(studyTimeMinutes)
  };
};
