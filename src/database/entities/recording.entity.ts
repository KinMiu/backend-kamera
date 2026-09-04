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
  generateDefaults(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.updatedAt) {
      this.updatedAt = now;
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

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => DeviceEntity, (device) => device.recordings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deviceId' })
  device: DeviceEntity;
}
