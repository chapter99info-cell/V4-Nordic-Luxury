import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: number, currency: 'AUD' | 'NZD' = 'AUD') => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  // Assuming timeStr is HH:mm
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'hh:mm a');
  } catch (e) {
    return timeStr;
  }
};
