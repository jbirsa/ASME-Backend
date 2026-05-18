import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClaseArchivo } from './clase-archivo.entity';
import { Curso } from '../../cursos/entities/curso.entity';

@Entity('clases')
export class Clase {
  @PrimaryGeneratedColumn('increment', { name: 'clase_id' })
  claseId: number;

  @ManyToOne(() => Curso, (curso) => curso.clases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curso_id', referencedColumnName: 'cursoId' })
  curso: Curso;

  @Column()
  titulo: string;

  @Column({ type: 'varchar', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', name: 'video_url', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'int', nullable: true })
  orden: number | null;

  @OneToMany(() => ClaseArchivo, (archivo) => archivo.clase)
  archivos?: ClaseArchivo[];
}
