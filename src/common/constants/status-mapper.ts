/**
 * 状态映射工具类
 * 用于前端字符串状态和数据库数字状态之间的转换
 */

// 任务状态映射
export const TaskStatusMap = {
  // 字符串 -> 数字
  STRING_TO_NUMBER: {
    todo: 0,
    inprogress: 1,
    done: 2,
  } as const,

  // 数字 -> 字符串
  NUMBER_TO_STRING: {
    0: 'todo',
    1: 'inprogress',
    2: 'done',
  } as const,
} as const;

// 优先级映射
export const TaskPriorityMap = {
  STRING_TO_NUMBER: {
    low: 0,
    medium: 1,
    high: 2,
  } as const,

  NUMBER_TO_STRING: {
    0: 'low',
    1: 'medium',
    2: 'high',
  } as const,
} as const;

// 日期类型映射
export const DateTypeMap = {
  STRING_TO_NUMBER: {
    none: 0,
    today: 1,
    tomorrow: 2,
    specific: 3,
    range: 4,
  } as const,

  NUMBER_TO_STRING: {
    0: 'none',
    1: 'today',
    2: 'tomorrow',
    3: 'specific',
    4: 'range',
  } as const,
} as const;

// 提醒类型映射
export const RemindTypeMap = {
  STRING_TO_NUMBER: {
    none: 0,
    on_time: 1,
    one_day_before: 2,
    two_days_before: 3,
    one_week_before: 4,
    custom: 5,
  } as const,

  NUMBER_TO_STRING: {
    0: 'none',
    1: 'on_time',
    2: 'one_day_before',
    3: 'two_days_before',
    4: 'one_week_before',
    5: 'custom',
  } as const,
} as const;

// 重复类型映射
export const RepeatTypeMap = {
  STRING_TO_NUMBER: {
    none: 0,
    daily: 1,
    weekly: 2,
    monthly: 3,
    yearly: 4,
    workday: 5,
    legal_workday: 6,
  } as const,

  NUMBER_TO_STRING: {
    0: 'none',
    1: 'daily',
    2: 'weekly',
    3: 'monthly',
    4: 'yearly',
    5: 'workday',
    6: 'legal_workday',
  } as const,
} as const;

/**
 * 状态映射器类
 */
export class StatusMapper {
  /**
   * 将字符串状态转换为数字
   */
  static stringToNumber<T extends Record<string, number>>(value: string, map: T, fieldName: string = '状态'): number {
    const result = map[value];
    if (result === undefined) {
      throw new Error(`无效的${fieldName}: ${value}`);
    }
    return result;
  }

  /**
   * 将数字状态转换为字符串
   */
  static numberToString<T extends Record<number, string>>(value: number, map: T, fieldName: string = '状态'): string {
    const result = map[value];
    if (result === undefined) {
      throw new Error(`无效的${fieldName}: ${value}`);
    }
    return result;
  }

  // 任务状态转换
  static taskStatusToNumber(status: string): number {
    return this.stringToNumber(status, TaskStatusMap.STRING_TO_NUMBER, '任务状态');
  }

  static taskStatusToString(status: number): string {
    return this.numberToString(status, TaskStatusMap.NUMBER_TO_STRING, '任务状态');
  }

  // 优先级转换
  static priorityToNumber(priority: string): number {
    return this.stringToNumber(priority, TaskPriorityMap.STRING_TO_NUMBER, '优先级');
  }

  static priorityToString(priority: number): string {
    return this.numberToString(priority, TaskPriorityMap.NUMBER_TO_STRING, '优先级');
  }

  // 日期类型转换
  static dateTypeToNumber(dateType: string): number {
    return this.stringToNumber(dateType, DateTypeMap.STRING_TO_NUMBER, '日期类型');
  }

  static dateTypeToString(dateType: number): string {
    return this.numberToString(dateType, DateTypeMap.NUMBER_TO_STRING, '日期类型');
  }

  // 提醒类型转换
  static remindTypeToNumber(remindType: string): number {
    return this.stringToNumber(remindType, RemindTypeMap.STRING_TO_NUMBER, '提醒类型');
  }

  static remindTypeToString(remindType: number): string {
    return this.numberToString(remindType, RemindTypeMap.NUMBER_TO_STRING, '提醒类型');
  }

  // 重复类型转换
  static repeatTypeToNumber(repeatType: string): number {
    return this.stringToNumber(repeatType, RepeatTypeMap.STRING_TO_NUMBER, '重复类型');
  }

  static repeatTypeToString(repeatType: number): string {
    return this.numberToString(repeatType, RepeatTypeMap.NUMBER_TO_STRING, '重复类型');
  }
}
