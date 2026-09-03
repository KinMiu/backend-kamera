import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { DeviceEntity } from '../entities/device.entity';
import { RecordingEntity } from '../entities/recording.entity';

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: [UserEntity, DeviceEntity, RecordingEntity],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const userRepository = dataSource.getRepository(UserEntity);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  let admin = await userRepository.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
    });
    await userRepository.save(admin);
    console.log('Seeding sukses: Akun Super Admin berhasil dibuat!');
  } else {
    console.log('Seeding: Akun Super Admin sudah ada.');
  }

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('Seeding error:', e);
  process.exit(1);
});
