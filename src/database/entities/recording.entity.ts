import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { DeviceEntity } from './device.entity';

@Entity('recordings')
@Index(['deviceId', 'createdAt'])
export class RecordingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) =>
        value !== null && value !== undefined ? Number(value) : null,
    },
  })
  size: number | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => DeviceEntity, (device) => device.recordings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deviceId' })
  device: DeviceEntity;
}
