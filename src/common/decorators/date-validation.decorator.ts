import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * 验证日期不能是过去的日期
 */
export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotPastDate', // 验证器名称
      target: object.constructor, // 目标构造函数
      propertyName: propertyName, // 属性名称
      options: validationOptions, // 验证选项
      constraints: [], // 约束，使用
      validator: {
        validate(value: string) {
          if (!value) return true; // 如果没有值，跳过验证（由 @IsOptional 处理）

          try {
            const inputDate = dayjs(value);
            const today = dayjs().startOf('day'); // 今天的开始时间

            return inputDate.isSameOrAfter(today);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 不能是过去的日期`;
        },
      },
    });
  };
}

/**
 * 验证结束日期必须晚于开始日期
 */
export function IsAfterStartDate(startDateProperty: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [startDateProperty],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          if (!value) return true; // 如果没有值，跳过验证

          try {
            const relatedPropertyName = args.constraints[0] as string;
            const relatedValue = (args.object as Record<string, any>)[relatedPropertyName] as string;

            if (!relatedValue) return true; // 如果开始日期没有值，跳过验证

            const startDate = dayjs(relatedValue);
            const endDate = dayjs(value);

            return endDate.isAfter(startDate);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0] as string;
          return `${args.property} 必须晚于 ${relatedPropertyName}`;
        },
      },
    });
  };
}

/**
 * 验证日期不能超过指定天数
 */
export function IsWithinDays(maxDays: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWithinDays',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxDays],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          if (!value) return true;

          try {
            const maxDaysConstraint = args.constraints[0] as number;
            const inputDate = dayjs(value);
            const maxAllowedDate = dayjs().add(maxDaysConstraint, 'day');

            return inputDate.isSameOrBefore(maxAllowedDate);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const maxDaysConstraint = args.constraints[0] as number;
          return `${args.property} 不能超过 ${maxDaysConstraint} 天后`;
        },
      },
    });
  };
}
