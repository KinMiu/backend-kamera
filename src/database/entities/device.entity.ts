import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';
import { RecordingEntity } from './recording.entity';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  macAddress: string;

  @Column({ type: 'varchar' })
  rtspEndpoint: string;

  @Column({ type: 'varchar', nullable: true })
  mediamtxEndpoint: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @OneToMany(() => RecordingEntity, (recording) => recording.device)
  recordings: RecordingEntity[];
}
