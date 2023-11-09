export const yesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

export const startOfDay = (date: Date): Date => {
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  return startOfDate;
};

export const endOfDay = (date: Date): Date => {
  const endOfDate = new Date(date);
  endOfDate.setHours(23, 59, 59, 999);
  return endOfDate;
};