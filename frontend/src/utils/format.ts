import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
};

export const formatTime = (dateString: string): string => {
  return format(new Date(dateString), 'HH:mm');
};

export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export const calculateDuration = (start: string, end?: string | null): string => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const hours = differenceInHours(endDate, startDate);
  const minutes = differenceInMinutes(endDate, startDate) % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h ${m}m`;
};
