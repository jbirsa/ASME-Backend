import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patrocinador } from './patrocinador.entity';

@Entity('evento')
export class Evento {
  @PrimaryGeneratedColumn('increment', { name: 'evento_id' })
  eventoId: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  tipo: string;

  @Column({ type: 'date', nullable: true })
  fecha: string | null;

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  barrio: string;

  @Column({ nullable: true })
  provincia: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'imagen_url', nullable: true })
  imagenUrl: string;

  @Column({ name: 'pagina_evento', nullable: true })
  paginaEvento: string;

  @ManyToMany(() => Patrocinador, (p) => p.eventos, { cascade: false })
  @JoinTable({
    name: 'patrocina_a',
    joinColumn: { name: 'evento_id', referencedColumnName: 'eventoId' },
    inverseJoinColumn: {
      name: 'patrocinador_id',
      referencedColumnName: 'patrocinadorId',
    },
  })
  patrocinadores: Patrocinador[];
}

