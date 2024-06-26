import { BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { DataSource, Repository } from 'typeorm';
import { Tenant, User } from '../entities';
import { RegisterDto } from '../dtos';
import { Suscription } from 'src/usage/entities/suscription.entity';
import { AuthProviderEnum } from '../interfaces/auth-provider.enum';

export class RegisterUserUseCase {
  private readonly logger = new Logger('RegisterUserUseCase');

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Suscription)
    private readonly suscriptionRepository: Repository<Suscription>,

    private readonly dataSource: DataSource,
  ) {}

  async execute(registerDto: RegisterDto) {

    const { email, fullName, password } = registerDto;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const userExist = await queryBuilder
      .where({ email })
      .leftJoinAndSelect('user.tenant', 'tenant')
      .getOne();


    if (userExist) {
      throw new BadRequestException(`The User with email ${email} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const monthsToAdd = parseInt(process.env.SUSCRIPTION_TIME_MONTHS_EXPIRE || '1',10);
      const currentDate = new Date();
      

      // Create Tenant
      const tenant: Tenant = {
        fullName,
        createdAt: new Date(),
        
      };
      const newTenant = this.tenantRepository.create(tenant);
      const newTenantSaved = await queryRunner.manager.save(newTenant);

      const passwordHash = password?  await bcrypt.hash(password, +process.env.HASH_SALT): null;

      // Create User
      const user: User = {
        email,
        authProvider: AuthProviderEnum.EMAIL,
        createdAt: new Date(),
        password: passwordHash,
        tenantId: newTenantSaved.id,
      };

      const newUser = this.userRepository.create(user);
      await queryRunner.manager.save(newUser);

      // Create Suscription
      const expirationDate = new Date(
        currentDate.setMonth(currentDate.getMonth() + monthsToAdd),
      );

      const suscription: Suscription = {
        receivedDate: new Date(),
        cash: +process.env.FREE_CASH,
        expirationDate,
        tenantId: newTenantSaved.id
      }

      const newSuscription = this.suscriptionRepository.create(suscription);
      await queryRunner.manager.save(newSuscription);


      // ********** Commit Transaction **********
      await queryRunner.commitTransaction();
      await queryRunner.release();

      const returnUser: User = {
        email,
        authProvider: newUser.authProvider,
        tenantId: newTenant.id,
        id: newUser.id,
        tenant: newTenant,
      };

      return returnUser;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.logger.error(error);
      throw new BadRequestException(`${error.message}`);
    }
  }
}
