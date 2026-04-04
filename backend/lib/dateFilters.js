const DAY_IN_MS = 24 * 60 * 60 * 1000;

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getPeriodRange = (period) => {
  const now = new Date();

  switch (period) {
    case "today":
      return { gte: startOfToday() };
    case "7d":
      return { gte: new Date(now.getTime() - 7 * DAY_IN_MS) };
    case "30d":
      return { gte: new Date(now.getTime() - 30 * DAY_IN_MS) };
    case "90d":
      return { gte: new Date(now.getTime() - 90 * DAY_IN_MS) };
    case "this_month":
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "this_year":
      return { gte: new Date(now.getFullYear(), 0, 1) };
    default:
      return {};
  }
};

const getDateFilterFromQuery = (query) => {
  const { period, startDate, endDate } = query || {};

  if (startDate || endDate) {
    const range = {};

    if (startDate && isValidDate(startDate)) {
      range.gte = new Date(startDate);
    }

    if (endDate && isValidDate(endDate)) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }

    return range;
  }

  return getPeriodRange(period);
};

const getDateFilterFromRangeToken = (token) => {
  if (!token) return null;

  const map = {
    today: { gte: startOfToday() },
    "7d": getPeriodRange("7d"),
    "30d": getPeriodRange("30d"),
    "90d": getPeriodRange("90d"),
  };

  return map[token] || null;
};

module.exports = {
  getDateFilterFromQuery,
  getDateFilterFromRangeToken,
  startOfToday,
};
