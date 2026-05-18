import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clase } from '../../clases/entities/clase.entity';
import { CursoArchivo } from './curso-archivo.entity';
import { Inscripcion } from './inscripcion.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('increment', { name: 'curso_id' })
  cursoId: number;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', name: 'imagen_url', nullable: true })
  imagenUrl: string | null;

  @Column({ type: 'varchar', name: 'imagen_storage_path', nullable: true })
  imagenStoragePath: string | null;

  @Column({ type: 'varchar', nullable: true })
  estado: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Clase, (clase) => clase.curso)
  clases?: Clase[];

  @OneToMany(() => CursoArchivo, (archivo) => archivo.curso)
  archivos?: CursoArchivo[];

  @OneToMany(() => Inscripcion, (ins) => ins.curso)
  inscripciones?: Inscripcion[];
}
