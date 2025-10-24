import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TaskTagEntity } from './taskTag.entity';

@Entity()
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'int' })
  status: number;

  @Column({ type: 'int' })
  priority: number;

  @Column({ type: 'int' })
  dateType: number;

  @Column({ nullable: true, type: 'date' })
  dueDate?: string;

  @Column({ nullable: true, type: 'date' })
  startDate?: string;

  @Column({ nullable: true, type: 'int' })
  remindType?: number;

  @Column({ nullable: true, type: 'time' })
  remindTime?: string;

  @Column({ nullable: true, type: 'int' })
  advanceType?: number;

  @Column({ nullable: true, type: 'int' })
  advanceValue?: number;

  @Column({ nullable: true, type: 'int' })
  repeatType?: number;

  @Column({ nullable: true, type: 'int' })
  isOverdue: number;

  @Column()
  userId: number;

  @OneToMany(() => TaskTagEntity, (taskTag) => taskTag.task)
  taskTag: TaskTagEntity[];

  // 状态时间节点
  @Column({ nullable: true, type: 'datetime', comment: '开始处理时间 - 状态从 todo 变为 inprogress 的时间' })
  startedAt?: Date;

  @Column({ nullable: true, type: 'datetime', comment: '完成时间 - 状态变为 done 的时间' })
  finishedAt?: Date;

  @Column({ nullable: true, type: 'datetime', comment: '暂停时间 - 从 inprogress 变回 todo 的时间' })
  pausedAt?: Date;

  // 自动生成创建时间
  @CreateDateColumn({ type: 'datetime', comment: '任务创建时间' })
  createdAt: Date;

  // 更新时间
  @UpdateDateColumn({ type: 'datetime', comment: '任务最后更新时间' })
  updatedAt: Date;
}
