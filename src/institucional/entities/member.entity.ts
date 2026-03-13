import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'id' })
  usuario?: User | null;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  apellido: string;

  @Column({ nullable: true })
  departamento: string;

  @Column({ name: 'role', nullable: true })
  role: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ name: 'mail', nullable: true })
  mail: string;
}
