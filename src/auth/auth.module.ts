import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { CheckStatusUseCase, EmailLoginUseCase, FindUserUseCase, PasswordRestoreUseCase, PreviousRegistrationUseCase, RegisterUserUseCase, ResetPasswordUseCase, SocialRegisterUseCase } from './use-cases';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionSerializer } from './serializers/session.serializer';
import { JWtUtil } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import { MailjetModule } from 'src/common/mailjet/mailjet.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Service } from 'src/usage/entities';
import { Suscription } from 'src/usage/entities/suscription.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Service, Suscription]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MailjetModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    
    FindUserUseCase,
    RegisterUserUseCase,
    EmailLoginUseCase,
    PasswordRestoreUseCase,
    ResetPasswordUseCase,
    CheckStatusUseCase,
    PreviousRegistrationUseCase,
    SocialRegisterUseCase,

    JWtUtil,
    JwtService,
    JwtStrategy,

    GoogleStrategy,
    SessionSerializer,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
  ],
  exports: [JwtStrategy, JWtUtil, FindUserUseCase]
})
export class AuthModule {}
