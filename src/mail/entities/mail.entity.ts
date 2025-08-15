import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail } from 'class-validator';

@Entity()
export class VerificationCodes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  code: number;

  @Column({ type: 'datetime' })
  expirationTime: Date;

  @Column({ default: false })
  used: boolean;
}
