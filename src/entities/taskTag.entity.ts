import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskEntity } from './task.entity';
import { TagEntity } from './tag.entity';

@Entity()
export class TaskTagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taskId: number;

  @Column()
  tagId: number;

  // 自动生成创建时间
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => TaskEntity, (task) => task.taskTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: TaskEntity;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: TagEntity;
}
