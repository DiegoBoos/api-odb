import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { User } from './user.entity';
import { Suscription } from 'src/usage/entities/suscription.entity';
import { Invoice } from 'src/pay/entities/invoice.entity';

@Entity({ name: 'tenants', schema: 'auth'})
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ApiProperty({
    description: 'Full Name',
  })
  @Column({ name: 'full_name', length: 100 })
  @Length(10, 100)
  @IsNotEmpty()
  fullName: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users?: User[];

  @OneToMany(() => Suscription, (suscription) => suscription.tenant)
  suscriptions?: Suscription[];

  @OneToMany(() => Invoice, (invoice) => invoice.tenant)
  invoices?: Suscription[];
}
