import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Curso } from './curso.entity';

@Entity('curso_archivos')
@Index('IDX_curso_archivos_curso_id', ['curso'])
export class CursoArchivo {
  @PrimaryGeneratedColumn('increment', { name: 'curso_archivo_id' })
  cursoArchivoId: number;

  @ManyToOne(() => Curso, (curso) => curso.archivos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'curso_id', referencedColumnName: 'cursoId' })
  curso: Curso;

  @Column({ name: 'nombre_original' })
  nombreOriginal: string;

  @Column({ name: 'storage_path', unique: true })
  storagePath: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
