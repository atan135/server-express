# Date Utilities (DayjsUtil)

This directory contains comprehensive tests for the date utilities (`DayjsUtil` class) located in `../src/utils/dayjs.util.js`.

## 📅 **Date Features**

The `DayjsUtil` class provides a comprehensive set of date manipulation functions built on top of Day.js:

### **Date Formatting & Parsing**
- **`formatDate`** - Format dates with custom patterns and timezone support
- **`parseDate`** - Parse date strings with format validation and timezone support
- **`now`** - Get current date/time with optional formatting and timezone

### **Date Arithmetic**
- **`addTime`** - Add time units (years, months, weeks, days, hours, minutes, seconds)
- **`subtractTime`** - Subtract time units from dates
- **`diff`** - Calculate difference between two dates in various units

### **Date Validation & Information**
- **`isValid`** - Validate date strings and objects
- **`getDateInfo`** - Extract comprehensive date information (year, month, day, etc.)
- **`getWorkingDayInfo`** - Check if date is a working day or weekend

### **Date Range Operations**
- **`isBetween`** - Check if date falls within a range
- **`startOf`** - Get start of time unit (day, month, year, etc.)
- **`endOf`** - Get end of time unit
- **`getDateRange`** - Generate array of dates between two dates

### **Advanced Features**
- **`fromNow`** - Get relative time descriptions ("2 days ago", "in 3 hours")
- **`calculateAge`** - Calculate age from birth date
- **`convertTimezone`** - Convert dates between different timezones

## 🧪 **Test Coverage**

The test suite covers all major functionality with **64 test cases**:

### **Core Function Tests**
- ✅ Date formatting and parsing
- ✅ Time arithmetic (add/subtract)
- ✅ Date difference calculations
- ✅ Date validation and information extraction
- ✅ Working day calculations
- ✅ Age calculations
- ✅ Date range generation
- ✅ Timezone conversions

### **Test Categories**
- **Unit Tests** - Individual function testing
- **Edge Cases** - Boundary conditions and unusual inputs
- **Error Handling** - Graceful error management
- **Integration Tests** - End-to-end workflows
- **Timezone Tests** - Cross-timezone operations

## 🚀 **Usage Examples**

### **Basic Date Formatting**
```javascript
const DayjsUtil = require('./src/utils/dayjs.util');

// Format current date
const now = DayjsUtil.formatDate(new Date());
console.log('Current time:', now); // 2023-12-25 15:30:45

// Custom format
const dateOnly = DayjsUtil.formatDate(new Date(), 'YYYY/MM/DD');
console.log('Date only:', dateOnly); // 2023/12/25

// With timezone
const shanghaiTime = DayjsUtil.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss', 'Asia/Shanghai');
console.log('Shanghai time:', shanghaiTime);
```

### **Date Parsing**
```javascript
// Parse ISO string
const date1 = DayjsUtil.parseDate('2023-12-25T15:30:45Z');
console.log('Parsed date:', date1);

// Parse with custom format
const date2 = DayjsUtil.parseDate('25/12/2023', 'DD/MM/YYYY');
console.log('Custom format date:', date2);

// Parse with timezone
const date3 = DayjsUtil.parseDate('2023-12-25 15:30:00', null, 'Asia/Shanghai');
console.log('Timezone date:', date3);
```

### **Date Arithmetic**
```javascript
const today = new Date();

// Add time
const tomorrow = DayjsUtil.addTime(today, 1, 'day');
const nextMonth = DayjsUtil.addTime(today, 1, 'month');
const nextYear = DayjsUtil.addTime(today, 1, 'year');

// Subtract time
const yesterday = DayjsUtil.subtractTime(today, 1, 'day');
const lastWeek = DayjsUtil.subtractTime(today, 1, 'week');

// With formatting
const nextWeek = DayjsUtil.addTime(today, 7, 'day', 'YYYY-MM-DD');
console.log('Next week:', nextWeek);
```

### **Date Calculations**
```javascript
const startDate = new Date('2023-12-01');
const endDate = new Date('2023-12-31');

// Calculate difference
const daysDiff = DayjsUtil.diff(endDate, startDate, 'day');
console.log('Days between:', daysDiff); // 30

// Check if date is in range
const checkDate = new Date('2023-12-15');
const isInRange = DayjsUtil.isBetween(checkDate, startDate, endDate);
console.log('Is in range:', isInRange); // true

// Get relative time
const relativeTime = DayjsUtil.fromNow(startDate);
console.log('Relative time:', relativeTime); // "25 days ago"
```

### **Date Information**
```javascript
const date = new Date('2023-12-25T15:30:45Z');
const info = DayjsUtil.getDateInfo(date);

console.log('Year:', info.year);           // 2023
console.log('Month:', info.month);         // 12
console.log('Day:', info.date);            // 25
console.log('Hour:', info.hour);           // 15
console.log('Minute:', info.minute);       // 30
console.log('Second:', info.second);       // 45
console.log('Is leap year:', info.isLeapYear); // false
console.log('Days in month:', info.daysInMonth); // 31
console.log('Week of year:', info.week);   // 52
console.log('Quarter:', info.quarter);     // 4
console.log('Unix timestamp:', info.unix); // 1703521845
console.log('ISO string:', info.iso);      // "2023-12-25T15:30:45.000Z"
```

### **Working Day Operations**
```javascript
const monday = new Date('2023-12-25'); // Monday
const sunday = new Date('2023-12-24'); // Sunday

const mondayInfo = DayjsUtil.getWorkingDayInfo(monday);
console.log('Is weekend:', mondayInfo.isWeekend);     // false
console.log('Is weekday:', mondayInfo.isWeekday);     // true
console.log('Is working day:', mondayInfo.isWorkingDay); // true
console.log('Day name:', mondayInfo.dayName);         // "Monday"
console.log('Day short:', mondayInfo.dayNameShort);   // "Mon"

const sundayInfo = DayjsUtil.getWorkingDayInfo(sunday);
console.log('Is weekend:', sundayInfo.isWeekend);     // true
console.log('Is working day:', sundayInfo.isWorkingDay); // false
```

### **Age Calculations**
```javascript
const birthDate = new Date('1990-06-15');
const referenceDate = new Date('2023-12-25');

// Calculate age
const age = DayjsUtil.calculateAge(birthDate, referenceDate);
console.log('Age:', age); // 33

// Calculate age from now
const currentAge = DayjsUtil.calculateAge(birthDate);
console.log('Current age:', currentAge);
```

### **Date Ranges**
```javascript
const startDate = new Date('2023-12-25');
const endDate = new Date('2023-12-29');

// Generate date range
const dateRange = DayjsUtil.getDateRange(startDate, endDate, 'day');
console.log('Date range:', dateRange); // Array of 5 Date objects

// With formatting
const formattedRange = DayjsUtil.getDateRange(startDate, endDate, 'day', 'YYYY-MM-DD');
console.log('Formatted range:', formattedRange);
// ["2023-12-25", "2023-12-26", "2023-12-27", "2023-12-28", "2023-12-29"]
```

### **Timezone Conversions**
```javascript
const utcDate = new Date('2023-12-25T10:00:00Z');

// Convert to Shanghai time
const shanghaiDate = DayjsUtil.convertTimezone(utcDate, 'UTC', 'Asia/Shanghai');
console.log('Shanghai time:', shanghaiDate);

// Convert with formatting
const formattedShanghai = DayjsUtil.convertTimezone(
  utcDate, 
  'UTC', 
  'Asia/Shanghai', 
  'YYYY-MM-DD HH:mm:ss'
);
console.log('Formatted Shanghai time:', formattedShanghai);
```

### **Start and End of Time Units**
```javascript
const date = new Date('2023-12-25T15:30:45Z');

// Start of day
const startOfDay = DayjsUtil.startOf(date, 'day');
console.log('Start of day:', startOfDay); // 2023-12-25T00:00:00.000Z

// End of day
const endOfDay = DayjsUtil.endOf(date, 'day');
console.log('End of day:', endOfDay); // 2023-12-25T23:59:59.999Z

// Start of month
const startOfMonth = DayjsUtil.startOf(date, 'month');
console.log('Start of month:', startOfMonth); // 2023-12-01T00:00:00.000Z

// With formatting
const startOfYear = DayjsUtil.startOf(date, 'year', 'YYYY-MM-DD');
console.log('Start of year:', startOfYear); // "2023-01-01"
```

## 🔧 **Configuration Options**

### **Date Formats**
```javascript
// Common format patterns
const formats = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  iso: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  custom: 'DD/MM/YYYY HH:mm'
};
```

### **Time Units**
```javascript
// Valid time units for arithmetic
const timeUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

// Valid units for date ranges
const rangeUnits = ['day', 'week', 'month', 'year'];
```

### **Timezone Support**
```javascript
// Common timezones
const timezones = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney'
];
```

## 🧪 **Running Tests**

From the **root directory** of your project:

```bash
# Run all tests
npm test

# Run only date utility tests
npm test -- test/dayjs.util.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📋 **Test Results Example**

```bash
 PASS  test/dayjs.util.test.js
  DayjsUtil
    formatDate
      ✓ should format date with default format (4 ms)
      ✓ should format date with custom format
      ✓ should format date with timezone (22 ms)
      ✓ should throw error for null date (57 ms)
    parseDate
      ✓ should parse date string without format (4 ms)
      ✓ should parse date string with format (3 ms)
      ✓ should parse date string with timezone (1 ms)
      ✓ should throw error for invalid date string (1 ms)
      ✓ should throw error for null date string (1 ms)
    now
      ✓ should get current date time without format
      ✓ should get current date time with format (1 ms)
      ✓ should get current date time with timezone (1 ms)
    addTime
      ✓ should add days to date
      ✓ should add months to date (1 ms)
      ✓ should add time with format (1 ms)
      ✓ should throw error for invalid unit (2 ms)
      ✓ should throw error for missing parameters (1 ms)
    subtractTime
      ✓ should subtract days from date (1 ms)
      ✓ should subtract months from date (1 ms)
      ✓ should subtract time with format (1 ms)
    diff
      ✓ should calculate difference in days (1 ms)
      ✓ should calculate difference in months (1 ms)
      ✓ should throw error for missing dates (1 ms)
      ✓ should throw error for invalid unit (1 ms)
    fromNow
      ✓ should get relative time from now (1 ms)
      ✓ should get relative time from base date
      ✓ should throw error for null date (1 ms)
    isBetween
      ✓ should check if date is between two dates (1 ms)
      ✓ should check if date is between with unit
      ✓ should check if date is between with inclusivity
      ✓ should throw error for missing dates (1 ms)
    startOf
      ✓ should get start of day
      ✓ should get start of month
      ✓ should get start of unit with format
      ✓ should throw error for invalid unit (1 ms)
    endOf
      ✓ should get end of day
      ✓ should get end of month
    getDateInfo
      ✓ should get date information (2 ms)
      ✓ should throw error for null date
    isValid
      ✓ should validate valid date (1 ms)
      ✓ should validate valid date string
      ✓ should reject invalid date
      ✓ should reject null date (1 ms)
    getWorkingDayInfo
      ✓ should get working day info for weekday (1 ms)
      ✓ should get working day info for weekend (1 ms)
      ✓ should throw error for null date (1 ms)
    calculateAge
      ✓ should calculate age correctly (1 ms)
      ✓ should calculate age from now (1 ms)
      ✓ should throw error for future birth date (1 ms)
      ✓ should throw error for null birth date (1 ms)
    getDateRange
      ✓ should generate date range by days (1 ms)
      ✓ should generate date range with format (1 ms)
      ✓ should throw error for invalid date order (1 ms)
      ✓ should throw error for invalid unit
    convertTimezone
      ✓ should convert timezone (2 ms)
      ✓ should convert timezone with format (1 ms)
      ✓ should throw error for missing parameters (1 ms)
    integration tests
      ✓ should perform complete date workflow (1 ms)
      ✓ should handle business logic workflow (1 ms)
    edge cases
      ✓ should handle leap year correctly (1 ms)
      ✓ should handle year boundary (1 ms)
      ✓ should handle timezone edge cases (2 ms)
      ✓ should handle very old dates
      ✓ should handle very future dates

Test Suites: 1 passed, 1 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        1.191s
```

## 🔧 **Dependencies**

The date utilities require:

```json
{
  "dayjs": "^1.11.13"
}
```

## 📚 **Additional Resources**

- **Day.js Documentation**: https://day.js.org/
- **Day.js Plugins**: https://day.js.org/docs/en/plugin/plugin
- **Date Formatting**: https://day.js.org/docs/en/display/format
- **Timezone Support**: https://day.js.org/docs/en/plugin/timezone

## ⚠️ **Important Notes**

1. **Timezone Handling** - All timezone operations use IANA timezone identifiers
2. **Date Validation** - Invalid dates will throw descriptive errors
3. **Performance** - Day.js is lightweight and optimized for performance
4. **Browser Compatibility** - Day.js works in all modern browsers
5. **Immutable Operations** - All date operations return new Date objects

## 🎯 **Common Use Cases**

### **Business Applications**
- **Working day calculations** for scheduling
- **Age verification** for user registration
- **Date range queries** for reports
- **Timezone conversions** for global applications

### **Web Applications**
- **Relative time display** ("2 hours ago")
- **Date formatting** for user interfaces
- **Form validation** for date inputs
- **Calendar functionality**

### **API Development**
- **Date parsing** from various formats
- **Response formatting** with timezone support
- **Input validation** for date parameters
- **Date arithmetic** for business logic

This comprehensive date utility provides enterprise-grade date handling while maintaining simplicity and performance through the Day.js library.
