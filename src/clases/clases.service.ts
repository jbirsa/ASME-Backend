import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Inscripcion } from '../cursos/entities/inscripcion.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';
import { ClaseArchivo } from './entities/clase-archivo.entity';
import { Clase } from './entities/clase.entity';

type UploadedArchivoData = {
  nombreOriginal: string;
  storagePath: string;
  mimeType: string;
  size: number;
};

type ViewerContext = {
  userId: string;
  rol: string;
};

@Injectable()
export class ClasesService {
  constructor(
    @InjectRepository(Clase)
    private readonly clasesRepo: Repository<Clase>,
    @InjectRepository(ClaseArchivo)
    private readonly claseArchivosRepo: Repository<ClaseArchivo>,
    @InjectRepository(Curso)
    private readonly cursosRepo: Repository<Curso>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async create(dto: CreateClaseDto, archivos: Express.Multer.File[] = []) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: dto.cursoId },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const uploadedStoragePaths: string[] = [];

    try {
      const archivosSubidos = await this.uploadArchivos(
        archivos,
        'clases/archivos',
        uploadedStoragePaths,
      );

      let createdClaseId: number | null = null;

      await this.clasesRepo.manager.transaction(async (manager) => {
        const clasesRepo = manager.getRepository(Clase);
        const claseArchivosRepo = manager.getRepository(ClaseArchivo);

        const clase = clasesRepo.create({
          curso,
          titulo: dto.titulo,
          descripcion: dto.descripcion ?? null,
          videoUrl: dto.videoUrl ?? null,
          orden: dto.orden ?? null,
        });

        const savedClase = await clasesRepo.save(clase);
        createdClaseId = savedClase.claseId;

        if (archivosSubidos.length > 0) {
          await claseArchivosRepo.save(
            archivosSubidos.map((archivo) =>
              claseArchivosRepo.create({ ...archivo, clase: savedClase }),
            ),
          );
        }
      });

      return this.findOne(createdClaseId!);
    } catch (error) {
      await this.removeStoragePathsQuietly(uploadedStoragePaths);
      throw error;
    }
  }

  async findAll(viewer: ViewerContext) {
    const clases = this.isAdminViewer(viewer)
      ? await this.clasesRepo.find({
          relations: { curso: true, archivos: true },
        })
      : await this.findClassesForEnrolledCourses(viewer.userId);

    return this.serializeClases(clases, true);
  }

  async findOne(id: number, viewer?: ViewerContext) {
    const clase = await this.clasesRepo.findOne({
      where: { claseId: id },
      relations: { curso: true, archivos: true },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada');

    if (viewer && !this.isAdminViewer(viewer)) {
      await this.assertViewerCanAccessCurso(viewer.userId, clase.curso.cursoId);
    }

    const [serializedClase] = await this.serializeClases([clase], true);
    return serializedClase;
  }

  async update(
    id: number,
    dto: UpdateClaseDto,
    archivos: Express.Multer.File[] = [],
  ) {
    const existing = await this.clasesRepo.findOne({
      where: { claseId: id },
      relations: { curso: true, archivos: true },
    });
    if (!existing) throw new NotFoundException('Clase no encontrada');

    let nextCurso = existing.curso;
    if (dto.cursoId !== undefined) {
      const curso = await this.cursosRepo.findOne({
        where: { cursoId: dto.cursoId },
      });
      if (!curso) throw new NotFoundException('Curso no encontrado');
      nextCurso = curso;
    }

    const archivosAEliminar = this.resolveArchivosAEliminar(
      existing.archivos ?? [],
      dto.archivoIdsAEliminar,
    );

    const uploadedStoragePaths: string[] = [];

    try {
      const archivosSubidos = await this.uploadArchivos(
        archivos,
        'clases/archivos',
        uploadedStoragePaths,
      );

      await this.clasesRepo.manager.transaction(async (manager) => {
        const clasesRepo = manager.getRepository(Clase);
        const claseArchivosRepo = manager.getRepository(ClaseArchivo);

        existing.curso = nextCurso;
        if (dto.titulo !== undefined) existing.titulo = dto.titulo;
        if (dto.descripcion !== undefined)
          existing.descripcion = dto.descripcion;
        if (dto.videoUrl !== undefined) existing.videoUrl = dto.videoUrl;
        if (dto.orden !== undefined) existing.orden = dto.orden;

        const savedClase = await clasesRepo.save(existing);

        if (archivosSubidos.length > 0) {
          await claseArchivosRepo.save(
            archivosSubidos.map((archivo) =>
              claseArchivosRepo.create({ ...archivo, clase: savedClase }),
            ),
          );
        }

        if (archivosAEliminar.length > 0) {
          await claseArchivosRepo.delete(
            archivosAEliminar.map((archivo) => archivo.claseArchivoId),
          );
        }
      });

      await this.removeStoragePathsQuietly(
        archivosAEliminar.map((archivo) => archivo.storagePath),
      );

      return this.findOne(id);
    } catch (error) {
      await this.removeStoragePathsQuietly(uploadedStoragePaths);
      throw error;
    }
  }

  async remove(id: number) {
    const clase = await this.clasesRepo.findOne({
      where: { claseId: id },
      relations: { archivos: true },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada');

    const storagePaths = (clase.archivos ?? []).map(
      (archivo) => archivo.storagePath,
    );

    await this.clasesRepo.remove(clase);
    await this.removeStoragePathsQuietly(storagePaths);

    return { deleted: true };
  }

  async findByCurso(cursoId: number, viewer?: ViewerContext) {
    if (viewer && !this.isAdminViewer(viewer)) {
      await this.assertViewerCanAccessCurso(viewer.userId, cursoId);
    }

    const clases = await this.clasesRepo.find({
      where: { curso: { cursoId } },
      relations: { archivos: true },
      order: { orden: 'ASC', claseId: 'ASC' },
    });

    return this.serializeClases(clases);
  }

  private async serializeClases(clases: Clase[], includeCurso = false) {
    const signedUrlMap = await this.createSignedUrlMapForClases(clases);
    return clases.map((clase) =>
      this.serializeClase(clase, signedUrlMap, includeCurso),
    );
  }

  private serializeClase(
    clase: Clase,
    signedUrlMap: Map<string, string>,
    includeCurso = false,
  ) {
    return {
      claseId: clase.claseId,
      titulo: clase.titulo,
      descripcion: clase.descripcion,
      videoUrl: clase.videoUrl,
      orden: clase.orden,
      ...(includeCurso && clase.curso
        ? {
            curso: {
              cursoId: clase.curso.cursoId,
              nombre: clase.curso.nombre,
              descripcion: clase.curso.descripcion,
              imagenUrl: clase.curso.imagenStoragePath
                ? (signedUrlMap.get(clase.curso.imagenStoragePath) ?? null)
                : clase.curso.imagenUrl,
              estado: clase.curso.estado,
              createdAt: clase.curso.createdAt,
              updatedAt: clase.curso.updatedAt,
            },
          }
        : {}),
      archivos: (clase.archivos ?? []).map((archivo) => ({
        claseArchivoId: archivo.claseArchivoId,
        nombreOriginal: archivo.nombreOriginal,
        mimeType: archivo.mimeType,
        size: archivo.size,
        createdAt: archivo.createdAt,
        url: signedUrlMap.get(archivo.storagePath) ?? null,
      })),
    };
  }

  private async createSignedUrlMapForClases(clases: Clase[]) {
    const storagePaths = clases.flatMap((clase) => [
      ...(clase.curso?.imagenStoragePath
        ? [clase.curso.imagenStoragePath]
        : []),
      ...(clase.archivos ?? []).map((archivo) => archivo.storagePath),
    ]);

    return this.storageService.createSignedUrlMap(storagePaths);
  }

  private isAdminViewer(viewer?: ViewerContext) {
    return viewer?.rol === 'admin';
  }

  private async findClassesForEnrolledCourses(userId: string) {
    const enrollments = await this.inscripcionesRepo.find({
      where: { usuarioId: userId },
    });

    const enrolledCourseIds = [...new Set(enrollments.map((item) => item.cursoId))];
    if (enrolledCourseIds.length === 0) return [];

    return this.clasesRepo.find({
      where: { curso: { cursoId: In(enrolledCourseIds) } },
      relations: { curso: true, archivos: true },
      order: { orden: 'ASC', claseId: 'ASC' },
    });
  }

  private async assertViewerCanAccessCurso(userId: string, cursoId: number) {
    const enrollment = await this.inscripcionesRepo.findOne({
      where: { usuarioId: userId, cursoId },
    });

    if (!enrollment) {
      throw new ForbiddenException('Acceso denegado al material del curso');
    }
  }

  private resolveArchivosAEliminar(
    archivosActuales: ClaseArchivo[],
    archivoIdsAEliminar?: number[],
  ) {
    if (!archivoIdsAEliminar?.length) return [];

    const archivosPorId = new Map(
      archivosActuales.map((archivo) => [archivo.claseArchivoId, archivo]),
    );

    const archivosAEliminar = archivoIdsAEliminar
      .map((archivoId) => archivosPorId.get(archivoId))
      .filter((archivo): archivo is ClaseArchivo => Boolean(archivo));

    if (archivosAEliminar.length !== archivoIdsAEliminar.length) {
      const missingIds = archivoIdsAEliminar.filter(
        (archivoId) => !archivosPorId.has(archivoId),
      );
      throw new NotFoundException(
        `Archivos de clase no encontrados: ${missingIds.join(', ')}`,
      );
    }

    return archivosAEliminar;
  }

  private async uploadArchivos(
    archivos: Express.Multer.File[],
    folder: string,
    uploadedStoragePaths: string[],
  ) {
    const archivosSubidos: UploadedArchivoData[] = [];

    for (const archivo of archivos) {
      const storagePath = await this.storageService.uploadFile(archivo, folder);
      uploadedStoragePaths.push(storagePath);
      archivosSubidos.push({
        nombreOriginal: archivo.originalname,
        storagePath,
        mimeType: archivo.mimetype || 'application/octet-stream',
        size: archivo.size,
      });
    }

    return archivosSubidos;
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
}
