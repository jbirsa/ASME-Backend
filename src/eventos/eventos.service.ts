import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';
import { PatrocinadoresService } from './patrocinadores.service';

const EVENTO_FOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventosRepo: Repository<Evento>,
    private readonly patrocinadoresService: PatrocinadoresService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async create(dto: CreateEventoDto, foto?: Express.Multer.File) {
    this.assertFotoValida(foto);

    const uploadedStoragePaths: string[] = [];

    try {
      const imagenStoragePath = foto
        ? await this.storageService.uploadFile(foto, 'eventos/fotos')
        : null;

      if (imagenStoragePath) uploadedStoragePaths.push(imagenStoragePath);

      const evento = this.eventosRepo.create({
        nombre: dto.nombre,
        tipo: dto.tipo,
        fecha: dto.fecha,
        direccion: dto.direccion,
        sede: dto.sede,
        barrio: dto.barrio,
        provincia: dto.provincia,
        descripcion: dto.descripcion,
        link: dto.link,
        imagenUrl: imagenStoragePath ? null : (dto.imagenUrl ?? null),
        imagenStoragePath,
        paginaEvento: dto.paginaEvento,
      });

      if (dto.patrocinadorIds !== undefined) {
        evento.patrocinadores =
          await this.patrocinadoresService.findManyByIdsOrFail(
            dto.patrocinadorIds,
          );
      }

      const savedEvento = await this.eventosRepo.save(evento);
      return this.findOne(savedEvento.eventoId);
    } catch (error) {
      await this.removeStoragePathsQuietly(uploadedStoragePaths);
      throw error;
    }
  }

  async findAll() {
    const eventos = await this.eventosRepo.find({
      relations: { patrocinadores: true },
    });

    return this.serializeEventos(eventos);
  }

  async findOne(id: number) {
    const evento = await this.eventosRepo.findOne({
      where: { eventoId: id },
      relations: { patrocinadores: true },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const [serializedEvento] = await this.serializeEventos([evento]);
    return serializedEvento;
  }

  async update(id: number, dto: UpdateEventoDto, foto?: Express.Multer.File) {
    const evento = await this.eventosRepo.findOne({
      where: { eventoId: id },
      relations: { patrocinadores: true },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    this.assertFotoValida(foto);

    const uploadedStoragePaths: string[] = [];

    try {
      const nuevaImagenStoragePath = foto
        ? await this.storageService.uploadFile(foto, 'eventos/fotos')
        : null;

      if (nuevaImagenStoragePath) {
        uploadedStoragePaths.push(nuevaImagenStoragePath);
      }

      const oldImagePathToDelete =
        nuevaImagenStoragePath ||
        dto.imagenUrl !== undefined ||
        dto.eliminarFoto
          ? evento.imagenStoragePath
          : null;

      const nextImagenStoragePath = nuevaImagenStoragePath
        ? nuevaImagenStoragePath
        : dto.imagenUrl !== undefined || dto.eliminarFoto
          ? null
          : evento.imagenStoragePath;

      const nextImagenUrl = nuevaImagenStoragePath
        ? null
        : dto.imagenUrl !== undefined
          ? (dto.imagenUrl ?? null)
          : dto.eliminarFoto
            ? null
            : evento.imagenUrl;

      Object.assign(evento, {
        nombre: dto.nombre ?? evento.nombre,
        tipo: dto.tipo ?? evento.tipo,
        fecha: dto.fecha ?? evento.fecha,
        direccion: dto.direccion ?? evento.direccion,
        sede: dto.sede ?? evento.sede,
        barrio: dto.barrio ?? evento.barrio,
        provincia: dto.provincia ?? evento.provincia,
        descripcion: dto.descripcion ?? evento.descripcion,
        link: dto.link ?? evento.link,
        imagenUrl: nextImagenUrl,
        imagenStoragePath: nextImagenStoragePath,
        paginaEvento: dto.paginaEvento ?? evento.paginaEvento,
      });

      if (dto.patrocinadorIds !== undefined) {
        evento.patrocinadores =
          await this.patrocinadoresService.findManyByIdsOrFail(
            dto.patrocinadorIds,
          );
      }

      await this.eventosRepo.save(evento);
      await this.removeStoragePathsQuietly(
        oldImagePathToDelete ? [oldImagePathToDelete] : [],
      );

      return this.findOne(id);
    } catch (error) {
      await this.removeStoragePathsQuietly(uploadedStoragePaths);
      throw error;
    }
  }

  async remove(id: number) {
    const evento = await this.eventosRepo.findOne({ where: { eventoId: id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const storagePaths = evento.imagenStoragePath ? [evento.imagenStoragePath] : [];

    await this.eventosRepo.remove(evento);
    await this.removeStoragePathsQuietly(storagePaths);
    return { deleted: true };
  }

  private async serializeEventos(eventos: Evento[]) {
    const signedUrlMap = await this.createSignedUrlMapForEventos(eventos);
    return eventos.map((evento) => ({
      eventoId: evento.eventoId,
      nombre: evento.nombre,
      tipo: evento.tipo,
      fecha: evento.fecha,
      direccion: evento.direccion,
      sede: evento.sede,
      barrio: evento.barrio,
      provincia: evento.provincia,
      descripcion: evento.descripcion,
      link: evento.link,
      imagenUrl: evento.imagenStoragePath
        ? (signedUrlMap.get(evento.imagenStoragePath) ?? null)
        : evento.imagenUrl,
      paginaEvento: evento.paginaEvento,
      patrocinadores: evento.patrocinadores ?? [],
    }));
  }

  private async createSignedUrlMapForEventos(eventos: Evento[]) {
    const storagePaths = eventos
      .map((evento) => evento.imagenStoragePath)
      .filter((storagePath): storagePath is string => Boolean(storagePath));

    return this.storageService.createSignedUrlMap(storagePaths);
  }

  private async removeStoragePathsQuietly(storagePaths: string[]) {
    const uniqueStoragePaths = [...new Set(storagePaths.filter(Boolean))];
    if (uniqueStoragePaths.length === 0) return;

    try {
      await this.storageService.removeFiles(uniqueStoragePaths);
    } catch {
      return;
    }
  }

  private assertFotoValida(foto?: Express.Multer.File) {
    if (!foto) return;

    if (!EVENTO_FOTO_MIME_TYPES.has(foto.mimetype)) {
      throw new BadRequestException(
        'La foto del evento solo admite JPG, PNG o WEBP',
      );
    }
  }
}
