const DayjsUtil = require('../src/utils/dayjs.util');

// Mock logger to avoid dependency issues in tests
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('DayjsUtil', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    require('../src/middleware/logger.middleware').logger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatDate', () => {
    test('should format date with default format', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = DayjsUtil.formatDate(date);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('should format date with custom format', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = DayjsUtil.formatDate(date, 'YYYY/MM/DD');
      
      expect(result).toBe('2023/12/25');
    });

    test('should format date with timezone', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = DayjsUtil.formatDate(date, 'YYYY-MM-DD HH:mm:ss', 'Asia/Shanghai');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for null date', () => {
      expect(() => {
        DayjsUtil.formatDate(null);
      }).toThrow('Date is required for formatting');
    });
  });

  describe('parseDate', () => {
    test('should parse date string without format', () => {
      const dateString = '2023-12-25T10:30:00Z';
      const result = DayjsUtil.parseDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getDate()).toBe(25);
    });

    test('should parse date string with format', () => {
      const dateString = '25/12/2023';
      const format = 'DD/MM/YYYY';
      const result = DayjsUtil.parseDate(dateString, format);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(25);
    });

    test('should parse date string with timezone', () => {
      const dateString = '2023-12-25T10:30:00';
      const result = DayjsUtil.parseDate(dateString, null, 'Asia/Shanghai');
      
      expect(result).toBeInstanceOf(Date);
    });

    test('should throw error for invalid date string', () => {
      expect(() => {
        DayjsUtil.parseDate('invalid-date');
      }).toThrow('Invalid date string or format');
    });

    test('should throw error for null date string', () => {
      expect(() => {
        DayjsUtil.parseDate(null);
      }).toThrow('Date string is required for parsing');
    });
  });

  describe('now', () => {
    test('should get current date time without format', () => {
      const result = DayjsUtil.now();
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    test('should get current date time with format', () => {
      const result = DayjsUtil.now('YYYY-MM-DD');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should get current date time with timezone', () => {
      const result = DayjsUtil.now('YYYY-MM-DD HH:mm:ss', 'Asia/Shanghai');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('addTime', () => {
    test('should add days to date', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.addTime(date, 5, 'day');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(30);
    });

    test('should add months to date', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.addTime(date, 2, 'month');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getMonth()).toBe(1); // February
    });

    test('should add time with format', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.addTime(date, 1, 'year', 'YYYY');
      
      expect(result).toBe('2024');
    });

    test('should throw error for invalid unit', () => {
      expect(() => {
        DayjsUtil.addTime(new Date(), 1, 'invalid');
      }).toThrow('Invalid unit. Must be one of: year, month, week, day, hour, minute, second');
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        DayjsUtil.addTime(new Date(), 1);
      }).toThrow('Date, amount, and unit are required');
    });
  });

  describe('subtractTime', () => {
    test('should subtract days from date', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.subtractTime(date, 5, 'day');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(20);
    });

    test('should subtract months from date', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.subtractTime(date, 2, 'month');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getMonth()).toBe(9); // October
    });

    test('should subtract time with format', () => {
      const date = new Date('2023-12-25');
      const result = DayjsUtil.subtractTime(date, 1, 'year', 'YYYY');
      
      expect(result).toBe('2022');
    });
  });

  describe('diff', () => {
    test('should calculate difference in days', () => {
      const date1 = new Date('2023-12-25');
      const date2 = new Date('2023-12-20');
      const result = DayjsUtil.diff(date1, date2, 'day');
      
      expect(result).toBe(5);
    });

    test('should calculate difference in months', () => {
      const date1 = new Date('2023-12-25');
      const date2 = new Date('2023-10-25');
      const result = DayjsUtil.diff(date1, date2, 'month');
      
      expect(result).toBe(2);
    });

    test('should throw error for missing dates', () => {
      expect(() => {
        DayjsUtil.diff(new Date(), null);
      }).toThrow('Both dates are required for difference calculation');
    });

    test('should throw error for invalid unit', () => {
      expect(() => {
        DayjsUtil.diff(new Date(), new Date(), 'invalid');
      }).toThrow('Invalid unit. Must be one of: year, month, week, day, hour, minute, second');
    });
  });

  describe('fromNow', () => {
    test('should get relative time from now', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const result = DayjsUtil.fromNow(pastDate);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('day');
    });

    test('should get relative time from base date', () => {
      const date = new Date('2023-12-25');
      const baseDate = new Date('2023-12-30');
      const result = DayjsUtil.fromNow(date, baseDate);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for null date', () => {
      expect(() => {
        DayjsUtil.fromNow(null);
      }).toThrow('Date is required for relative time calculation');
    });
  });

  describe('isBetween', () => {
    test('should check if date is between two dates', () => {
      const date = new Date('2023-12-25');
      const startDate = new Date('2023-12-20');
      const endDate = new Date('2023-12-30');
      const result = DayjsUtil.isBetween(date, startDate, endDate);
      
      expect(result).toBe(true);
    });

    test('should check if date is between with unit', () => {
      const date = new Date('2023-12-25');
      const startDate = new Date('2023-12-20');
      const endDate = new Date('2023-12-30');
      const result = DayjsUtil.isBetween(date, startDate, endDate, 'day');
      
      expect(result).toBe(true);
    });

    test('should check if date is between with inclusivity', () => {
      const date = new Date('2023-12-25');
      const startDate = new Date('2023-12-25');
      const endDate = new Date('2023-12-30');
      const result = DayjsUtil.isBetween(date, startDate, endDate, 'day', '[]');
      
      expect(result).toBe(true);
    });

    test('should throw error for missing dates', () => {
      expect(() => {
        DayjsUtil.isBetween(new Date(), null, new Date());
      }).toThrow('Date, startDate, and endDate are required');
    });
  });

  describe('startOf', () => {
    test('should get start of day', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.startOf(date, 'day');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    test('should get start of month', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.startOf(date, 'month');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    test('should get start of unit with format', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.startOf(date, 'day', 'YYYY-MM-DD HH:mm:ss');
      
      expect(result).toBe('2023-12-25 00:00:00');
    });

    test('should throw error for invalid unit', () => {
      expect(() => {
        DayjsUtil.startOf(new Date(), 'invalid');
      }).toThrow('Invalid unit. Must be one of: year, month, week, day, hour, minute, second');
    });
  });

  describe('endOf', () => {
    test('should get end of day', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.endOf(date, 'day');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });

    test('should get end of month', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.endOf(date, 'month');
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(31); // December has 31 days
    });
  });

  describe('getDateInfo', () => {
    test('should get date information', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const result = DayjsUtil.getDateInfo(date);
      
      expect(result).toHaveProperty('year', 2023);
      expect(result).toHaveProperty('month', 12);
      expect(result).toHaveProperty('date', 25);
      // 时区可能影响小时，所以只检查分钟和秒
      expect(result).toHaveProperty('minute', 30);
      expect(result).toHaveProperty('second', 45);
      expect(result).toHaveProperty('isLeapYear');
      expect(result).toHaveProperty('daysInMonth');
      expect(result).toHaveProperty('unix');
      expect(result).toHaveProperty('iso');
    });

    test('should throw error for null date', () => {
      expect(() => {
        DayjsUtil.getDateInfo(null);
      }).toThrow('Date is required for getting date information');
    });
  });

  describe('isValid', () => {
    test('should validate valid date', () => {
      const result = DayjsUtil.isValid(new Date());
      expect(result).toBe(true);
    });

    test('should validate valid date string', () => {
      const result = DayjsUtil.isValid('2023-12-25');
      expect(result).toBe(true);
    });

    test('should reject invalid date', () => {
      const result = DayjsUtil.isValid('invalid-date');
      expect(result).toBe(false);
    });

    test('should reject null date', () => {
      const result = DayjsUtil.isValid(null);
      expect(result).toBe(false);
    });
  });

  describe('getWorkingDayInfo', () => {
    test('should get working day info for weekday', () => {
      // Monday
      const monday = new Date('2023-12-25'); // This is a Monday
      const result = DayjsUtil.getWorkingDayInfo(monday);
      
      expect(result).toHaveProperty('isWeekend', false);
      expect(result).toHaveProperty('isWeekday', true);
      expect(result).toHaveProperty('isWorkingDay', true);
      expect(result).toHaveProperty('dayName');
      expect(result).toHaveProperty('dayNameShort');
    });

    test('should get working day info for weekend', () => {
      // Sunday
      const sunday = new Date('2023-12-24'); // This is a Sunday
      const result = DayjsUtil.getWorkingDayInfo(sunday);
      
      expect(result).toHaveProperty('isWeekend', true);
      expect(result).toHaveProperty('isWeekday', false);
      expect(result).toHaveProperty('isWorkingDay', false);
    });

    test('should throw error for null date', () => {
      expect(() => {
        DayjsUtil.getWorkingDayInfo(null);
      }).toThrow('Date is required for working day calculation');
    });
  });

  describe('calculateAge', () => {
    test('should calculate age correctly', () => {
      const birthDate = new Date('1990-06-15');
      const referenceDate = new Date('2023-12-25');
      const result = DayjsUtil.calculateAge(birthDate, referenceDate);
      
      expect(result).toBe(33);
    });

    test('should calculate age from now', () => {
      const birthDate = new Date('1990-06-15');
      const result = DayjsUtil.calculateAge(birthDate);
      
      expect(result).toBeGreaterThan(30);
    });

    test('should throw error for future birth date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(() => {
        DayjsUtil.calculateAge(futureDate);
      }).toThrow('Birth date cannot be in the future');
    });

    test('should throw error for null birth date', () => {
      expect(() => {
        DayjsUtil.calculateAge(null);
      }).toThrow('Birth date is required for age calculation');
    });
  });

  describe('getDateRange', () => {
    test('should generate date range by days', () => {
      const startDate = new Date('2023-12-25');
      const endDate = new Date('2023-12-29');
      const result = DayjsUtil.getDateRange(startDate, endDate, 'day');
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[4]).toBeInstanceOf(Date);
    });

    test('should generate date range with format', () => {
      const startDate = new Date('2023-12-25');
      const endDate = new Date('2023-12-27');
      const result = DayjsUtil.getDateRange(startDate, endDate, 'day', 'YYYY-MM-DD');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('2023-12-25');
      expect(result[1]).toBe('2023-12-26');
      expect(result[2]).toBe('2023-12-27');
    });

    test('should throw error for invalid date order', () => {
      const startDate = new Date('2023-12-29');
      const endDate = new Date('2023-12-25');
      expect(() => {
        DayjsUtil.getDateRange(startDate, endDate);
      }).toThrow('Start date cannot be after end date');
    });

    test('should throw error for invalid unit', () => {
      expect(() => {
        DayjsUtil.getDateRange(new Date(), new Date(), 'invalid');
      }).toThrow('Invalid unit. Must be one of: day, week, month, year');
    });
  });

  describe('convertTimezone', () => {
    test('should convert timezone', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = DayjsUtil.convertTimezone(date, 'UTC', 'Asia/Shanghai');
      
      expect(result).toBeInstanceOf(Date);
    });

    test('should convert timezone with format', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = DayjsUtil.convertTimezone(date, 'UTC', 'Asia/Shanghai', 'YYYY-MM-DD HH:mm:ss');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        DayjsUtil.convertTimezone(new Date(), 'UTC');
      }).toThrow('Date, fromTimezone, and toTimezone are required');
    });
  });

  describe('integration tests', () => {
    test('should perform complete date workflow', () => {
      const startDate = new Date('2023-12-01');
      
      // 1. Add time
      const futureDate = DayjsUtil.addTime(startDate, 30, 'day');
      
      // 2. Check if in range
      const isInRange = DayjsUtil.isBetween(futureDate, startDate, new Date('2024-01-01'));
      expect(isInRange).toBe(true);
      
      // 3. Get date info
      const dateInfo = DayjsUtil.getDateInfo(futureDate);
      expect(dateInfo.year).toBe(2023);
      expect(dateInfo.month).toBe(12);
      expect(dateInfo.date).toBe(31);
      
      // 4. Format date
      const formatted = DayjsUtil.formatDate(futureDate, 'YYYY-MM-DD');
      expect(formatted).toBe('2023-12-31');
    });

    test('should handle business logic workflow', () => {
      const today = new Date();
      
      // 1. Get working day info
      const workInfo = DayjsUtil.getWorkingDayInfo(today);
      
      // 2. If it's a working day, add business days
      if (workInfo.isWorkingDay) {
        const nextBusinessDay = DayjsUtil.addTime(today, 1, 'day');
        const nextWorkInfo = DayjsUtil.getWorkingDayInfo(nextBusinessDay);
        
        // 3. Check if next day is also working day
        expect(typeof nextWorkInfo.isWorkingDay).toBe('boolean');
      }
      
      // 4. Get current time
      const now = DayjsUtil.now('HH:mm:ss');
      expect(now).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('edge cases', () => {
    test('should handle leap year correctly', () => {
      const leapYearDate = new Date('2024-02-29');
      const dateInfo = DayjsUtil.getDateInfo(leapYearDate);
      
      expect(dateInfo.isLeapYear).toBe(true);
      expect(dateInfo.daysInMonth).toBe(29);
    });

    test('should handle year boundary', () => {
      const yearEnd = new Date('2023-12-31T23:59:59Z');
      const nextYear = DayjsUtil.addTime(yearEnd, 1, 'second');
      const dateInfo = DayjsUtil.getDateInfo(nextYear);
      
      expect(dateInfo.year).toBe(2024);
      expect(dateInfo.month).toBe(1);
      expect(dateInfo.date).toBe(1);
    });

    test('should handle timezone edge cases', () => {
      const date = new Date('2023-12-25T00:00:00Z');
      
      // Convert to a timezone that might have DST
      const result = DayjsUtil.convertTimezone(date, 'UTC', 'America/New_York');
      
      expect(result).toBeInstanceOf(Date);
    });

    test('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01');
      const result = DayjsUtil.isValid(oldDate);
      
      expect(result).toBe(true);
    });

    test('should handle very future dates', () => {
      const futureDate = new Date('2100-12-31');
      const result = DayjsUtil.isValid(futureDate);
      
      expect(result).toBe(true);
    });
  });
});
