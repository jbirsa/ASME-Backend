import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clase } from '../../clases/entities/clase.entity';
import { Inscripcion } from './inscripcion.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('increment', { name: 'curso_id' })
  cursoId: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', nullable: true })
  imagenUrl: string;

  @Column({ nullable: true })
  estado: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Clase, (clase) => clase.curso)
  clases?: Clase[];

  @OneToMany(() => Inscripcion, (ins) => ins.curso)
  inscripciones?: Inscripcion[];
}

