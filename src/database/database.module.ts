import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { DeviceEntity } from './entities/device.entity';
import { RecordingEntity } from './entities/recording.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: dbUrl,
          entities: [UserEntity, DeviceEntity, RecordingEntity],
          synchronize: false,
          logging:
            configService.get<string>('NODE_ENV') === 'development'
              ? ['error', 'warn']
              : ['error'],
        };
      },
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed to dataSourceFactory');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    TypeOrmModule.forFeature([UserEntity, DeviceEntity, RecordingEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
