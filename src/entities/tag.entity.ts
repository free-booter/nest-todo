import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { TaskTagEntity } from './taskTag.entity';

@Entity()
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  color: string;

  @Column()
  userId: number;

  // 自动生成创建时间
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => TaskTagEntity, (taskTag) => taskTag.tag)
  taskTag: TaskTagEntity[];
}
