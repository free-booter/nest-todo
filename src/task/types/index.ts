export enum TaskPriority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}
export enum TaskStatus {
  todo = 1,
  doing = 2,
  done = 3,
}

export enum TaskDateType {
  NONE = 0, // 无截止日期
  TODAY = 1, // 今天
  TOMORROW = 2, // 明天
  SPECIFIC = 3, // 指定日期
  RANGE = 4, // 时间段
}

export enum TaskRemindType {
  ON_TIME = 0, // 准时
  ONE_DAY_BEFORE = 1, // 提前一天
  TWO_DAYS_BEFORE = 2, // 提前2天
  ONE_WEEK_BEFORE = 3, // 提前一周
  CUSTOM = 4, // 自定义
}

export enum TaskRepeatType {
  NONE = 0, // 不重复
  DAILY = 1, // 每天
  WEEKLY = 2, // 每周
  MONTHLY = 3, // 每月
  YEARLY = 4, // 每年
  WORKDAY = 5, // 工作日
  LEGAL_WORKDAY = 6, // 法定工作日
}
