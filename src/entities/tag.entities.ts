import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  color?: string;

  @Column()
  userId: number;

  // 自动生成创建时间
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
