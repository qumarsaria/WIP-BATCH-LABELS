export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  // Returns YYYY-MM-DD for input fields
  return d.toISOString().split('T')[0];
};

export const formatDateDisplay = (date: Date | string): string => {
  const d = new Date(date);
  // Returns readable format DD MMM YYYY
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};