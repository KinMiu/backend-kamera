# [Refactor] Align Backend with PT. LSKK Backend Development Standard Stack (v1.0)

## 📌 Background & Objective
Refactoring the core API backend of Way Kambas Wildlife Surveillance System to comply 100% with the official **PT. LSKK Backend Development Standard Stack v1.0** (dated 20 July 2026).

This issue encompasses migrating the ORM layer from Prisma to **TypeORM** (`typeorm` + `typeorm-transactional`), implementing standardized response wrappers (`IResponseEntity<T>`, `ResponseInterceptor`), setting up centralized exception handling (`AllExceptionsFilter`), enforcing NestJS `Logger` middleware, and configuring rate limiting (`@nestjs/throttler`).

---

## 🏗️ Target Architectural Blueprint

```text
backend/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   └── public.decorator.ts      # @Public() route decorator
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts # @Catch() centralized Exception Filter (LSKK Section 2)
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts  # Standard IResponseEntity[T] response wrapper (LSKK Section 4)
│   │   ├── interfaces/
│   │   │   ├── pagination.interface.ts  # ImetaPagination & IResponsePageWrapper[T] (LSKK Section 3)
│   │   │   ├── request.interface.ts     # JwtPayload & AuthenticatedRequest (LSKK Section 3)
│   │   │   └── response.interface.ts    # IResponseEntity[T] interface (LSKK Section 3)
│   │   ├── middleware/
│   │   │   └── http-logger.middleware.ts# NestJS Logger HTTP request logger
│   │   └── services/
│   │       └── message.service.ts       # MessageService for dynamic response messages
│   ├── config/
│   │   └── typeorm.config.ts            # TypeORM DataSource & database configuration
│   ├── database/
│   │   ├── seeds/
│   │   │   └── seed.ts                  # TypeORM Super Admin seeder
│   │   └── entities/
│   │       ├── user.entity.ts           # TypeORM User entity (users table)
│   │       ├── device.entity.ts         # TypeORM Device entity (devices table)
│   │       └── recording.entity.ts      # TypeORM Recording entity (recordings table)
│   ├── auth/
│   │   ├── auth.controller.ts           # Authentication routes (Login, Register, Profile)
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts              # Authentication logic via User repository
│   │   └── dto/
│   ├── devices/
│   │   ├── devices.controller.ts        # Device CRUD & snapshot endpoints
│   │   ├── devices.module.ts
│   │   ├── devices.service.ts           # Device management via TypeORM repository + MQTT sync
│   │   └── dto/
│   ├── recordings/
│   │   ├── recordings.controller.ts     # Video recording query endpoints
│   │   ├── recordings.module.ts
│   │   ├── recordings.service.ts        # Recording storage via TypeORM repository
│   │   └── dto/
│   ├── mqtt/
│   │   ├── mqtt.module.ts
│   │   └── mqtt.service.ts              # Real-time worker sync publisher (MQTT)
│   ├── guard/
│   │   ├── api-key.guard.ts             # Header API Key guard
│   │   └── jwt-auth.guard.ts            # Passport JWT guard
│   ├── app.module.ts                    # Root module with TypeORM, Throttler, ConfigModule
│   └── main.ts                          # Bootstrap with initializeTransactionalContext, Filter, Interceptor
├── .env.example                         # Safe configuration template
├── package.json                         # Dependencies (@nestjs/typeorm, typeorm, typeorm-transactional, @nestjs/throttler)
└── tsconfig.json
```

---

## 📋 Task Checklist & Phased Implementation

### Phase 1: Dependencies Setup
- [x] Install TypeORM & PostgreSQL dependencies:
  - `@nestjs/typeorm`, `typeorm`, `typeorm-transactional`, `pg`
- [x] Install Security, Auth & Rate Limiting dependencies:
  - `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`
  - `@nestjs/throttler` (Rate Limiting)
- [x] Clean removal of `@prisma/client`, `@prisma/adapter-pg`, and `prisma`.

### Phase 2: Response Wrapper & Centralized Exception Handling (`src/common/`)
- [x] Implement `IResponseEntity<T>`, `ImetaPagination`, `IResponsePageWrapper<T>` in `src/common/interfaces/`:
  - Enforce response contract: `{ code, status: boolean, message, data, meta }`.
- [x] Implement `MessageService` in `src/common/services/message.service.ts`.
- [x] Implement `ResponseInterceptor` in `src/common/interceptors/response.interceptor.ts` (LSKK Section 4).
- [x] Implement `AllExceptionsFilter` with `HttpAdapterHost` in `src/common/filters/all-exceptions.filter.ts` (LSKK Section 2).

### Phase 3: TypeORM Entity & Database Layer Migration (`src/database/entities/`)
- [x] Implement TypeORM entities with decorators:
  - `UserEntity` (`@Entity('users')`)
  - `DeviceEntity` (`@Entity('devices')`)
  - `RecordingEntity` (`@Entity('recordings')`)
- [x] Configure `TypeOrmModule.forRootAsync` in `AppModule` with `typeorm-transactional`.
- [x] Add `initializeTransactionalContext()` in `src/main.ts`.

### Phase 4: Service Layer Refactoring (Prisma $\to$ TypeORM Repository)
- [x] Refactor `AuthService` to use `@InjectRepository(UserEntity)`.
- [x] Refactor `DevicesService` to use `@InjectRepository(DeviceEntity)` and `@InjectRepository(UserEntity)`.
- [x] Refactor `RecordingsService` to use `@InjectRepository(RecordingEntity)` and `@InjectRepository(DeviceEntity)`.
- [x] Migrate database seeding script to TypeORM DataSource (`src/database/seeds/seed.ts`).

### Phase 5: Middleware, Rate Limiting & Logger Integration
- [x] Create `HttpLoggerMiddleware` implementing NestJS built-in `Logger` (Method, URL, Status, Latency).
- [x] Register `HttpLoggerMiddleware` across all routes in `AppModule`.
- [x] Configure `ThrottlerModule.forRoot` (`@nestjs/throttler`) for DDoS / brute-force protection.
- [x] Replace any residual `console.log` / `console.error` with `new Logger('ServiceName')`.

### Phase 6: Global Registration in `src/main.ts`
- [x] Register `initializeTransactionalContext()` before `NestFactory.create`.
- [x] Register `ValidationPipe({ whitelist: true, transform: true })`.
- [x] Register `AllExceptionsFilter` globally.
- [x] Register `ResponseInterceptor` globally.
- [x] Enable CORS with credentials.

---

## 🎯 Acceptance Criteria
1. `npm run build` compiles with zero TypeScript errors.
2. All REST API endpoints return uniform JSON envelopes:
   - Success: `{ code: 200, status: true, message: "...", data: { ... } }`
   - Error: `{ code: 4xx/5xx, status: false, message: "...", path: "/..." }`
3. Database queries execute via TypeORM repositories against PostgreSQL.
4. HTTP request logs are captured via NestJS `Logger`.
5. 100% compliant with PT. LSKK Backend Development Standard Stack v1.0.
