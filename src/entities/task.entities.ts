import { TaskDateType, TaskPriority, TaskRemindType, TaskRepeatType, TaskStatus } from 'src/task/types';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json' })
  tagIds: number[];

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskDateType })
  dateType: TaskDateType;

  @Column({ nullable: true, type: 'date' })
  date?: string;

  @Column({ nullable: true, type: 'date' })
  startDate?: string;

  @Column({ nullable: true, type: 'date' })
  endDate?: string;

  @Column({ nullable: true, type: 'time' })
  specificTime?: string;

  @Column({ nullable: true, type: 'enum', enum: TaskRemindType })
  remindType?: TaskRemindType;

  @Column({ nullable: true, type: 'int' })
  remindValue?: number;

  @Column({ nullable: true, type: 'time' })
  remindTime?: string;

  @Column({ nullable: true, type: 'enum', enum: TaskRepeatType })
  repeatType?: TaskRepeatType;

  // 自动生成创建时间
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  // 更新时间
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
