import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Evento } from './evento.entity';

@Entity('patrocinador')
export class Patrocinador {
  @PrimaryGeneratedColumn('increment', { name: 'patrocinador_id' })
  patrocinadorId: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'imagen_url', nullable: true })
  imagenUrl: string;

  @ManyToMany(() => Evento, (evento) => evento.patrocinadores)
  eventos: Evento[];
}

