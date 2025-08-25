const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const quarterOfYear = require('dayjs/plugin/quarterOfYear');
const isBetween = require('dayjs/plugin/isBetween');
const isLeapYear = require('dayjs/plugin/isLeapYear');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { logger } = require("../middleware/logger.middleware");

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(isBetween);
dayjs.extend(isLeapYear);
dayjs.extend(customParseFormat);

class DayjsUtil {
  static logger = logger("dayjs");

  /**
   * 格式化日期
   * Format date
   * @param {Date|string|number} date - 日期对象、字符串或时间戳
   * @param {string} format - 格式化字符串 (默认: 'YYYY-MM-DD HH:mm:ss')
   * @param {string} timezone - 时区 (可选)
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss', timezone = null) {
    try {
      if (!date) {
        throw new Error('Date is required for formatting');
      }

      let dayjsObj = dayjs(date);
      
      if (timezone) {
        dayjsObj = dayjsObj.tz(timezone);
      }

      const result = dayjsObj.format(format);
      
      this.logger.info('Date formatted successfully', { 
        inputDate: date,
        format,
        timezone,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error formatting date', { error: error.message });
      throw new Error(`Failed to format date: ${error.message}`);
    }
  }

  /**
   * 解析日期字符串
   * Parse date string
   * @param {string} dateString - 日期字符串
   * @param {string} format - 日期格式 (可选)
   * @param {string} timezone - 时区 (可选)
   * @returns {Date} 解析后的日期对象
   */
  static parseDate(dateString, format = null, timezone = null) {
    try {
      if (!dateString) {
        throw new Error('Date string is required for parsing');
      }

      let dayjsObj;
      
      if (format) {
        dayjsObj = dayjs(dateString, format);
      } else {
        dayjsObj = dayjs(dateString);
      }

      if (timezone) {
        dayjsObj = dayjsObj.tz(timezone);
      }

      if (!dayjsObj.isValid()) {
        throw new Error('Invalid date string or format');
      }

      const result = dayjsObj.toDate();
      
      this.logger.info('Date parsed successfully', { 
        dateString,
        format,
        timezone,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error parsing date', { error: error.message });
      throw new Error(`Failed to parse date: ${error.message}`);
    }
  }

  /**
   * 获取当前日期时间
   * Get current date time
   * @param {string} format - 格式化字符串 (可选)
   * @param {string} timezone - 时区 (可选)
   * @returns {string|Date} 当前日期时间
   */
  static now(format = null, timezone = null) {
    try {
      let dayjsObj = dayjs();
      
      if (timezone) {
        dayjsObj = dayjsObj.tz(timezone);
      }

      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('Current date time retrieved', { 
        format,
        timezone,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error getting current date time', { error: error.message });
      throw new Error(`Failed to get current date time: ${error.message}`);
    }
  }

  /**
   * 添加时间
   * Add time to date
   * @param {Date|string|number} date - 基准日期
   * @param {number} amount - 数量
   * @param {string} unit - 单位 (year, month, week, day, hour, minute, second)
   * @param {string} format - 输出格式 (可选)
   * @returns {string|Date} 计算后的日期
   */
  static addTime(date, amount, unit, format = null) {
    try {
      if (!date || amount === undefined || !unit) {
        throw new Error('Date, amount, and unit are required');
      }

      const validUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const dayjsObj = dayjs(date).add(amount, unit);
      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('Time added successfully', { 
        inputDate: date,
        amount,
        unit,
        format,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error adding time', { error: error.message });
      throw new Error(`Failed to add time: ${error.message}`);
    }
  }

  /**
   * 减少时间
   * Subtract time from date
   * @param {Date|string|number} date - 基准日期
   * @param {number} amount - 数量
   * @param {string} unit - 单位 (year, month, week, day, hour, minute, second)
   * @param {string} format - 输出格式 (可选)
   * @returns {string|Date} 计算后的日期
   */
  static subtractTime(date, amount, unit, format = null) {
    try {
      if (!date || amount === undefined || !unit) {
        throw new Error('Date, amount, and unit are required');
      }

      const validUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const dayjsObj = dayjs(date).subtract(amount, unit);
      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('Time subtracted successfully', { 
        inputDate: date,
        amount,
        unit,
        format,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error subtracting time', { error: error.message });
      throw new Error(`Failed to subtract time: ${error.message}`);
    }
  }

  /**
   * 计算两个日期之间的差值
   * Calculate difference between two dates
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @param {string} unit - 单位 (year, month, week, day, hour, minute, second)
   * @returns {number} 差值
   */
  static diff(date1, date2, unit = 'day') {
    try {
      if (!date1 || !date2) {
        throw new Error('Both dates are required for difference calculation');
      }

      const validUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const result = dayjs(date1).diff(dayjs(date2), unit);
      
      this.logger.info('Date difference calculated successfully', { 
        date1,
        date2,
        unit,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error calculating date difference', { error: error.message });
      throw new Error(`Failed to calculate date difference: ${error.message}`);
    }
  }

  /**
   * 获取相对时间描述
   * Get relative time description
   * @param {Date|string|number} date - 目标日期
   * @param {Date|string|number} baseDate - 基准日期 (默认: 当前时间)
   * @returns {string} 相对时间描述
   */
  static fromNow(date, baseDate = null) {
    try {
      if (!date) {
        throw new Error('Date is required for relative time calculation');
      }

      const base = baseDate ? dayjs(baseDate) : dayjs();
      const result = dayjs(date).from(base);
      
      this.logger.info('Relative time calculated successfully', { 
        date,
        baseDate,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error calculating relative time', { error: error.message });
      throw new Error(`Failed to calculate relative time: ${error.message}`);
    }
  }

  /**
   * 检查日期是否在指定范围内
   * Check if date is between two dates
   * @param {Date|string|number} date - 要检查的日期
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @param {string} unit - 比较单位 (可选)
   * @param {string} inclusivity - 包含性 ('()', '[]', '(]', '[)') (默认: '[]')
   * @returns {boolean} 是否在范围内
   */
  static isBetween(date, startDate, endDate, unit = null, inclusivity = '[]') {
    try {
      if (!date || !startDate || !endDate) {
        throw new Error('Date, startDate, and endDate are required');
      }

      const result = dayjs(date).isBetween(startDate, endDate, unit, inclusivity);
      
      this.logger.info('Date range check completed', { 
        date,
        startDate,
        endDate,
        unit,
        inclusivity,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error checking date range', { error: error.message });
      throw new Error(`Failed to check date range: ${error.message}`);
    }
  }

  /**
   * 获取日期的开始时间
   * Get start of date unit
   * @param {Date|string|number} date - 目标日期
   * @param {string} unit - 单位 (year, month, week, day, hour, minute, second)
   * @param {string} format - 输出格式 (可选)
   * @returns {string|Date} 开始时间
   */
  static startOf(date, unit, format = null) {
    try {
      if (!date || !unit) {
        throw new Error('Date and unit are required');
      }

      const validUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const dayjsObj = dayjs(date).startOf(unit);
      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('Start of unit calculated successfully', { 
        date,
        unit,
        format,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error calculating start of unit', { error: error.message });
      throw new Error(`Failed to calculate start of unit: ${error.message}`);
    }
  }

  /**
   * 获取日期的结束时间
   * Get end of date unit
   * @param {Date|string|number} date - 目标日期
   * @param {string} unit - 单位 (year, month, week, day, hour, minute, second)
   * @param {string} format - 输出格式 (可选)
   * @returns {string|Date} 结束时间
   */
  static endOf(date, unit, format = null) {
    try {
      if (!date || !unit) {
        throw new Error('Date and unit are required');
      }

      const validUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const dayjsObj = dayjs(date).endOf(unit);
      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('End of unit calculated successfully', { 
        date,
        unit,
        format,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error calculating end of unit', { error: error.message });
      throw new Error(`Failed to calculate end of unit: ${error.message}`);
    }
  }

  /**
   * 获取日期信息
   * Get date information
   * @param {Date|string|number} date - 目标日期
   * @returns {Object} 日期信息对象
   */
  static getDateInfo(date) {
    try {
      if (!date) {
        throw new Error('Date is required for getting date information');
      }

      const dayjsObj = dayjs(date);
      
      const result = {
        year: dayjsObj.year(),
        month: dayjsObj.month() + 1, // dayjs month is 0-based
        date: dayjsObj.date(),
        day: dayjsObj.day(), // 0 = Sunday, 1 = Monday, etc.
        hour: dayjsObj.hour(),
        minute: dayjsObj.minute(),
        second: dayjsObj.second(),
        millisecond: dayjsObj.millisecond(),
        week: dayjsObj.week(),
        quarter: dayjsObj.quarter(),
        isLeapYear: dayjsObj.isLeapYear(),
        daysInMonth: dayjsObj.daysInMonth(),
        unix: dayjsObj.unix(),
        iso: dayjsObj.toISOString()
      };
      
      this.logger.info('Date information retrieved successfully', { 
        date,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error getting date information', { error: error.message });
      throw new Error(`Failed to get date information: ${error.message}`);
    }
  }

  /**
   * 验证日期是否有效
   * Validate if date is valid
   * @param {Date|string|number} date - 要验证的日期
   * @returns {boolean} 是否有效
   */
  static isValid(date) {
    try {
      if (!date) {
        return false;
      }

      const result = dayjs(date).isValid();
      
      this.logger.info('Date validation completed', { 
        date,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error validating date', { error: error.message });
      return false;
    }
  }

  /**
   * 获取工作日信息
   * Get working day information
   * @param {Date|string|number} date - 目标日期
   * @returns {Object} 工作日信息
   */
  static getWorkingDayInfo(date) {
    try {
      if (!date) {
        throw new Error('Date is required for working day calculation');
      }

      const dayjsObj = dayjs(date);
      const day = dayjsObj.day();
      
      const result = {
        isWeekend: day === 0 || day === 6,
        isWeekday: day >= 1 && day <= 5,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        dayNameShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
        isWorkingDay: day >= 1 && day <= 5
      };
      
      this.logger.info('Working day information retrieved successfully', { 
        date,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error getting working day information', { error: error.message });
      throw new Error(`Failed to get working day information: ${error.message}`);
    }
  }

  /**
   * 计算年龄
   * Calculate age
   * @param {Date|string|number} birthDate - 出生日期
   * @param {Date|string|number} referenceDate - 参考日期 (默认: 当前日期)
   * @returns {number} 年龄
   */
  static calculateAge(birthDate, referenceDate = null) {
    try {
      if (!birthDate) {
        throw new Error('Birth date is required for age calculation');
      }

      const reference = referenceDate ? dayjs(referenceDate) : dayjs();
      const birth = dayjs(birthDate);
      
      if (birth.isAfter(reference)) {
        throw new Error('Birth date cannot be in the future');
      }

      const result = reference.diff(birth, 'year');
      
      this.logger.info('Age calculated successfully', { 
        birthDate,
        referenceDate,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error calculating age', { error: error.message });
      throw new Error(`Failed to calculate age: ${error.message}`);
    }
  }

  /**
   * 获取日期范围
   * Get date range
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @param {string} unit - 单位 (day, week, month, year)
   * @param {string} format - 输出格式 (可选)
   * @returns {Array} 日期范围数组
   */
  static getDateRange(startDate, endDate, unit = 'day', format = null) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      const validUnits = ['day', 'week', 'month', 'year'];
      if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }

      const start = dayjs(startDate);
      const end = dayjs(endDate);
      
      if (start.isAfter(end)) {
        throw new Error('Start date cannot be after end date');
      }

      const result = [];
      let current = start.clone();
      
      while (current.isSameOrBefore(end, unit)) {
        result.push(format ? current.format(format) : current.toDate());
        current = current.add(1, unit);
      }
      
      this.logger.info('Date range generated successfully', { 
        startDate,
        endDate,
        unit,
        format,
        rangeLength: result.length 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error generating date range', { error: error.message });
      throw new Error(`Failed to generate date range: ${error.message}`);
    }
  }

  /**
   * 转换时区
   * Convert timezone
   * @param {Date|string|number} date - 源日期
   * @param {string} fromTimezone - 源时区
   * @param {string} toTimezone - 目标时区
   * @param {string} format - 输出格式 (可选)
   * @returns {string|Date} 转换后的日期
   */
  static convertTimezone(date, fromTimezone, toTimezone, format = null) {
    try {
      if (!date || !fromTimezone || !toTimezone) {
        throw new Error('Date, fromTimezone, and toTimezone are required');
      }

      const dayjsObj = dayjs.tz(date, fromTimezone).tz(toTimezone);
      const result = format ? dayjsObj.format(format) : dayjsObj.toDate();
      
      this.logger.info('Timezone converted successfully', { 
        date,
        fromTimezone,
        toTimezone,
        format,
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error converting timezone', { error: error.message });
      throw new Error(`Failed to convert timezone: ${error.message}`);
    }
  }
}

module.exports = DayjsUtil;
