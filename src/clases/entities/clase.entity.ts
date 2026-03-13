import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ nullable: true })
  descripcion: string;

  @Column({ name: 'video_url', nullable: true })
  videoUrl: string;

  @Column({ type: 'int', nullable: true })
  orden: number | null;
}

