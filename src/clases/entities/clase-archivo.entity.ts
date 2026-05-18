import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Clase } from './clase.entity';

@Entity('clase_archivos')
@Index('IDX_clase_archivos_clase_id', ['clase'])
export class ClaseArchivo {
  @PrimaryGeneratedColumn('increment', { name: 'clase_archivo_id' })
  claseArchivoId: number;

  @ManyToOne(() => Clase, (clase) => clase.archivos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'clase_id', referencedColumnName: 'claseId' })
  clase: Clase;

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
