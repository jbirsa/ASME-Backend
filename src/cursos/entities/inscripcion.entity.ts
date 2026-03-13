import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Curso } from './curso.entity';

@Entity('inscripciones')
export class Inscripcion {
  @PrimaryColumn('uuid', { name: 'usuario_id' })
  usuarioId: string;

  @PrimaryColumn('int', { name: 'curso_id' })
  cursoId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'id' })
  usuario: User;

  @ManyToOne(() => Curso, (curso) => curso.inscripciones, { eager: false })
  @JoinColumn({ name: 'curso_id', referencedColumnName: 'cursoId' })
  curso: Curso;

  @Column({ default: 'en_progreso' })
  estado: string;

  @Column({ type: 'numeric', nullable: true })
  calificacion: string | null;

  @CreateDateColumn({ name: 'fecha_inscripcion', type: 'timestamptz' })
  fechaInscripcion: Date;
}
