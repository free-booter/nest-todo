// 前端使用的字符串枚举（用于API接口）
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'inprogress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum DateType {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  SPECIFIC = 'specific',
  RANGE = 'range',
  NONE = 'none',
}

export enum RemindType {
  NONE = 'none',
  ON_TIME = 'on_time',
  ONE_DAY_BEFORE = 'one_day_before',
  TWO_DAYS_BEFORE = 'two_days_before',
  ONE_WEEK_BEFORE = 'one_week_before',
  CUSTOM = 'custom',
}

export enum RepeatType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  WORKDAY = 'workday',
  LEGAL_WORKDAY = 'legal_workday',
}
