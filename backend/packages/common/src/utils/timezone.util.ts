import { addHours as addHoursFns, addMinutes as addMinutesFns, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc, format as formatTz } from 'date-fns-tz';

/**
 * Timezone Utility for DriversKlub Backend
 * 
 * All operations use IST (Indian Standard Time - Asia/Kolkata, UTC+5:30) by default
 * This can be configured via APP_TIMEZONE environment variable.
 * This ensures consistent time handling across the application.
 */

const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

export class TimeUtil {
    /**
     * Get current time in IST
     * @returns Date object representing current time in IST
     */
    static getCurrentTime(): Date {
        return utcToZonedTime(new Date(), TIMEZONE);
    }

    /**
     * Convert any date to IST
     * @param date - Date to convert
     * @returns Date object in IST
     */
    static toIST(date: Date): Date {
        return utcToZonedTime(date, TIMEZONE);
    }

    /**
     * Parse date string to IST
     * @param dateString - ISO date string or any parseable date string
     * @returns Date object in IST
     */
    static parseToIST(dateString: string | Date): Date {
        if (dateString instanceof Date) {
            return utcToZonedTime(dateString, TIMEZONE);
        }
        const parsed = parseISO(dateString);
        return utcToZonedTime(parsed, TIMEZONE);
    }

    /**
     * Format date in IST with custom format
     * @param date - Date to format
     * @param formatString - Format string (e.g., 'yyyy-MM-dd HH:mm:ss')
     * @returns Formatted date string in IST
     */
    static formatIST(date: Date, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
        return formatTz(date, formatString, { timeZone: TIMEZONE });
    }

    /**
     * Get ISO string in IST
     * @param date - Date to convert
     * @returns ISO string in IST
     */
    static toISOString(date: Date): string {
        return formatTz(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: TIMEZONE });
    }

    /**
     * Add hours to a date in IST context
     * @param date - Base date
     * @param hours - Number of hours to add (can be negative)
     * @returns New date with hours added
     */
    static addHours(date: Date, hours: number): Date {
        const istDate = utcToZonedTime(date, TIMEZONE);
        const result = addHoursFns(istDate, hours);
        return utcToZonedTime(result, TIMEZONE);
    }

    /**
     * Add minutes to a date in IST context
     * @param date - Base date
     * @param minutes - Number of minutes to add (can be negative)
     * @returns New date with minutes added
     */
    static addMinutes(date: Date, minutes: number): Date {
        const istDate = utcToZonedTime(date, TIMEZONE);
        const result = addMinutesFns(istDate, minutes);
        return utcToZonedTime(result, TIMEZONE);
    }

    /**
     * Calculate difference in hours between two dates
     * @param date1 - First date
     * @param date2 - Second date
     * @returns Difference in hours (date1 - date2)
     */
    static diffInHours(date1: Date, date2: Date): number {
        const ist1 = utcToZonedTime(date1, TIMEZONE);
        const ist2 = utcToZonedTime(date2, TIMEZONE);
        return differenceInHours(ist1, ist2);
    }

    /**
     * Calculate difference in minutes between two dates
     * @param date1 - First date
     * @param date2 - Second date
     * @returns Difference in minutes (date1 - date2)
     */
    static diffInMinutes(date1: Date, date2: Date): number {
        const ist1 = utcToZonedTime(date1, TIMEZONE);
        const ist2 = utcToZonedTime(date2, TIMEZONE);
        return differenceInMinutes(ist1, ist2);
    }

    /**
     * Create a date from components in IST
     * @param year - Year
     * @param month - Month (1-12)
     * @param day - Day
     * @param hour - Hour (0-23)
     * @param minute - Minute (0-59)
     * @param second - Second (0-59)
     * @returns Date object in IST
     */
    static createIST(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
        return zonedTimeToUtc(dateString, TIMEZONE);
    }

    /**
     * Get start of day in IST
     * @param date - Date to get start of day for
     * @returns Date object representing start of day (00:00:00) in IST
     */
    static startOfDay(date: Date): Date {
        const istDate = utcToZonedTime(date, TIMEZONE);
        const formatted = formatTz(istDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
        return zonedTimeToUtc(`${formatted}T00:00:00`, TIMEZONE);
    }

    /**
     * Get end of day in IST
     * @param date - Date to get end of day for
     * @returns Date object representing end of day (23:59:59) in IST
     */
    static endOfDay(date: Date): Date {
        const istDate = utcToZonedTime(date, TIMEZONE);
        const formatted = formatTz(istDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
        return zonedTimeToUtc(`${formatted}T23:59:59`, TIMEZONE);
    }

    /**
     * Check if a date is in the past (IST)
     * @param date - Date to check
     * @returns true if date is in the past
     */
    static isPast(date: Date): boolean {
        const now = this.getCurrentTime();
        const istDate = utcToZonedTime(date, TIMEZONE);
        return istDate < now;
    }

    /**
     * Check if a date is in the future (IST)
     * @param date - Date to check
     * @returns true if date is in the future
     */
    static isFuture(date: Date): boolean {
        const now = this.getCurrentTime();
        const istDate = utcToZonedTime(date, TIMEZONE);
        return istDate > now;
    }

    /**
     * Get timezone name
     * @returns Timezone string
     */
    static getTimezone(): string {
        return TIMEZONE;
    }

    /**
     * Get timezone offset in minutes
     * @returns Offset in minutes (330 for IST = +5:30)
     */
    static getTimezoneOffset(): number {
        return 330; // IST is UTC+5:30 = 330 minutes
    }
}
