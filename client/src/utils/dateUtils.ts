import dayjs from 'dayjs';

// Утилиты для работы с датами
export const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD.MM.YYYY');
};

export const isDateExpired = (date: string | Date) => {
    return dayjs().isAfter(dayjs(date));
};

export const getDaysDifference = (date1: string | Date, date2: string | Date) => {
    return dayjs(date2).diff(dayjs(date1), 'day');
};

export const addDays = (date: string | Date, days: number) => {
    return dayjs(date).add(days, 'day').toDate();
};

export const addMonths = (date: string | Date, months: number) => {
    return dayjs(date).add(months, 'month').toDate();
};
