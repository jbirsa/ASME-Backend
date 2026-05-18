import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clase } from '../clases/entities/clase.entity';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { UsersService } from '../users/users.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { CursoArchivo } from './entities/curso-archivo.entity';
import { Curso } from './entities/curso.entity';
import { Inscripcion } from './entities/inscripcion.entity';

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

type SerializeCursoOptions = {
  includeCourseFiles: boolean;
  includeClases: boolean;
  includeClassFiles: boolean;
};

const FULL_CURSO_SERIALIZATION: SerializeCursoOptions = {
  includeCourseFiles: true,
  includeClases: true,
  includeClassFiles: true,
};

const CATALOG_CURSO_SERIALIZATION: SerializeCursoOptions = {
  includeCourseFiles: false,
  includeClases: true,
  includeClassFiles: false,
};

const LOCKED_CURSO_SERIALIZATION: SerializeCursoOptions = {
  includeCourseFiles: false,
  includeClases: false,
  includeClassFiles: false,
};

const CURSO_FOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursosRepo: Repository<Curso>,
    @InjectRepository(CursoArchivo)
    private readonly cursoArchivosRepo: Repository<CursoArchivo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
    private readonly userService: UsersService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async create(
    dto: CreateCursoDto,
    foto?: Express.Multer.File,
    archivos: Express.Multer.File[] = [],
  ) {
    this.assertFotoValida(foto);

    const uploadedStoragePaths: string[] = [];

    try {
      const imagenStoragePath = foto
        ? await this.storageService.uploadFile(foto, 'cursos/fotos')
        : null;

      if (imagenStoragePath) uploadedStoragePaths.push(imagenStoragePath);

      const archivosSubidos = await this.uploadArchivos(
        archivos,
        'cursos/archivos',
        uploadedStoragePaths,
      );

      let createdCursoId: number | null = null;

      await this.cursosRepo.manager.transaction(async (manager) => {
        const cursoRepo = manager.getRepository(Curso);
        const cursoArchivoRepo = manager.getRepository(CursoArchivo);

        const curso = cursoRepo.create({
          nombre: dto.nombre,
          descripcion: dto.descripcion ?? null,
          imagenUrl: imagenStoragePath ? null : (dto.imagenUrl ?? null),
          imagenStoragePath,
          estado: dto.estado ?? null,
        });

        const savedCurso = await cursoRepo.save(curso);
        createdCursoId = savedCurso.cursoId;

        if (archivosSubidos.length > 0) {
          await cursoArchivoRepo.save(
            archivosSubidos.map((archivo) =>
              cursoArchivoRepo.create({ ...archivo, curso: savedCurso }),
            ),
          );
        }
      });

      return this.findOne(createdCursoId!);
    } catch (error) {
      await this.removeStoragePathsQuietly(uploadedStoragePaths);
      throw error;
    }
  }

  async findAll(viewer?: ViewerContext) {
    const cursos = await this.cursosRepo.find({
      relations: { clases: { archivos: true }, archivos: true },
    });

    return this.serializeCursos(
      cursos,
      this.isAdminViewer(viewer)
        ? FULL_CURSO_SERIALIZATION
        : CATALOG_CURSO_SERIALIZATION,
    );
  }

  async enroll(userId: string, cursoId: number) {
    const curso = await this.cursosRepo.findOne({ where: { cursoId } });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existing = await this.inscripcionesRepo.findOne({
      where: { usuarioId: userId, cursoId },
    });

    if (existing) {
      return {
        enrolled: true,
        alreadyEnrolled: true,
        cursoId,
      };
    }

    const inscripcion = this.inscripcionesRepo.create({
      usuarioId: userId,
      cursoId,
      estado: 'en_progreso',
    });

    await this.inscripcionesRepo.save(inscripcion);

    return {
      enrolled: true,
      alreadyEnrolled: false,
      cursoId,
    };
  }

  async findMyCourses(userId: string) {
    const inscripciones = await this.inscripcionesRepo.find({
      where: { usuarioId: userId },
      relations: { curso: { clases: { archivos: true }, archivos: true } },
      order: { fechaInscripcion: 'DESC' },
    });

    const cursos = inscripciones
      .map((inscripcion) => inscripcion.curso)
      .filter((curso): curso is Curso => Boolean(curso));

    const signedUrlMap = await this.createSignedUrlMapForCursos(
      cursos,
      FULL_CURSO_SERIALIZATION,
    );

    return inscripciones
      .filter((inscripcion) => inscripcion.curso)
      .map((inscripcion) => ({
        ...this.serializeCurso(
          inscripcion.curso!,
          signedUrlMap,
          FULL_CURSO_SERIALIZATION,
        ),
        inscripcion: {
          estado: inscripcion.estado,
          fechaInscripcion: inscripcion.fechaInscripcion,
        },
      }));
  }

  async findOne(id: number) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: id },
      relations: { clases: { archivos: true }, archivos: true },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const [serializedCurso] = await this.serializeCursos(
      [curso],
      FULL_CURSO_SERIALIZATION,
    );
    return serializedCurso;
  }

  async findOneForViewer(id: number, viewer: ViewerContext) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: id },
      relations: { clases: { archivos: true }, archivos: true },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    if (this.isAdminViewer(viewer)) {
      const [serializedCurso] = await this.serializeCursos(
        [curso],
        FULL_CURSO_SERIALIZATION,
      );
      return serializedCurso;
    }

    const serializationOptions = (await this.isViewerEnrolledInCurso(
      viewer.userId,
      id,
    ))
      ? FULL_CURSO_SERIALIZATION
      : LOCKED_CURSO_SERIALIZATION;

    const [serializedCurso] = await this.serializeCursos(
      [curso],
      serializationOptions,
    );
    return serializedCurso;
  }

  async update(
    id: number,
    dto: UpdateCursoDto,
    foto?: Express.Multer.File,
    archivos: Express.Multer.File[] = [],
  ) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: id },
      relations: { archivos: true },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    this.assertFotoValida(foto);

    const archivosAEliminar = this.resolveArchivosAEliminar(
      curso.archivos ?? [],
      dto.archivoIdsAEliminar,
    );

    const newlyUploadedStoragePaths: string[] = [];

    try {
      const nuevaImagenStoragePath = foto
        ? await this.storageService.uploadFile(foto, 'cursos/fotos')
        : null;

      if (nuevaImagenStoragePath) {
        newlyUploadedStoragePaths.push(nuevaImagenStoragePath);
      }

      const archivosSubidos = await this.uploadArchivos(
        archivos,
        'cursos/archivos',
        newlyUploadedStoragePaths,
      );

      const oldImagePathToDelete =
        nuevaImagenStoragePath ||
        dto.imagenUrl !== undefined ||
        dto.eliminarFoto
          ? curso.imagenStoragePath
          : null;

      const nextImagenStoragePath = nuevaImagenStoragePath
        ? nuevaImagenStoragePath
        : dto.imagenUrl !== undefined || dto.eliminarFoto
          ? null
          : curso.imagenStoragePath;

      const nextImagenUrl = nuevaImagenStoragePath
        ? null
        : dto.imagenUrl !== undefined
          ? (dto.imagenUrl ?? null)
          : dto.eliminarFoto
            ? null
            : curso.imagenUrl;

      await this.cursosRepo.manager.transaction(async (manager) => {
        const cursoRepo = manager.getRepository(Curso);
        const cursoArchivoRepo = manager.getRepository(CursoArchivo);

        if (dto.nombre !== undefined) curso.nombre = dto.nombre;
        if (dto.descripcion !== undefined) curso.descripcion = dto.descripcion;
        if (dto.estado !== undefined) curso.estado = dto.estado;

        curso.imagenUrl = nextImagenUrl;
        curso.imagenStoragePath = nextImagenStoragePath;

        const savedCurso = await cursoRepo.save(curso);

        if (archivosSubidos.length > 0) {
          await cursoArchivoRepo.save(
            archivosSubidos.map((archivo) =>
              cursoArchivoRepo.create({ ...archivo, curso: savedCurso }),
            ),
          );
        }

        if (archivosAEliminar.length > 0) {
          await cursoArchivoRepo.delete(
            archivosAEliminar.map((archivo) => archivo.cursoArchivoId),
          );
        }
      });

      await this.removeStoragePathsQuietly([
        ...(oldImagePathToDelete ? [oldImagePathToDelete] : []),
        ...archivosAEliminar.map((archivo) => archivo.storagePath),
      ]);

      return this.findOne(id);
    } catch (error) {
      await this.removeStoragePathsQuietly(newlyUploadedStoragePaths);
      throw error;
    }
  }

  async remove(id: number) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: id },
      relations: { archivos: true, clases: { archivos: true } },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const storagePaths = [
      ...(curso.imagenStoragePath ? [curso.imagenStoragePath] : []),
      ...(curso.archivos ?? []).map((archivo) => archivo.storagePath),
      ...(curso.clases ?? []).flatMap((clase) =>
        (clase.archivos ?? []).map((archivo) => archivo.storagePath),
      ),
    ];

    await this.cursosRepo.remove(curso);
    await this.removeStoragePathsQuietly(storagePaths);

    return { deleted: true };
  }

  private async serializeCursos(
    cursos: Curso[],
    options: SerializeCursoOptions = FULL_CURSO_SERIALIZATION,
  ) {
    const signedUrlMap = await this.createSignedUrlMapForCursos(cursos, options);
    return cursos.map((curso) => this.serializeCurso(curso, signedUrlMap, options));
  }

  private serializeCurso(
    curso: Curso,
    signedUrlMap: Map<string, string>,
    options: SerializeCursoOptions,
  ) {
    return {
      cursoId: curso.cursoId,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      imagenUrl: curso.imagenStoragePath
        ? (signedUrlMap.get(curso.imagenStoragePath) ?? null)
        : curso.imagenUrl,
      estado: curso.estado,
      createdAt: curso.createdAt,
      updatedAt: curso.updatedAt,
      archivos: options.includeCourseFiles
        ? (curso.archivos ?? []).map((archivo) => ({
            cursoArchivoId: archivo.cursoArchivoId,
            nombreOriginal: archivo.nombreOriginal,
            mimeType: archivo.mimeType,
            size: archivo.size,
            createdAt: archivo.createdAt,
            url: signedUrlMap.get(archivo.storagePath) ?? null,
          }))
        : [],
      clases: options.includeClases
        ? this.sortClases(curso.clases ?? []).map((clase) => ({
            claseId: clase.claseId,
            titulo: clase.titulo,
            descripcion: clase.descripcion,
            videoUrl: clase.videoUrl,
            orden: clase.orden,
            archivos: options.includeClassFiles
              ? (clase.archivos ?? []).map((archivo) => ({
                  claseArchivoId: archivo.claseArchivoId,
                  nombreOriginal: archivo.nombreOriginal,
                  mimeType: archivo.mimeType,
                  size: archivo.size,
                  createdAt: archivo.createdAt,
                  url: signedUrlMap.get(archivo.storagePath) ?? null,
                }))
              : [],
          }))
        : [],
    };
  }

  private async createSignedUrlMapForCursos(
    cursos: Curso[],
    options: SerializeCursoOptions,
  ) {
    const storagePaths = cursos.flatMap((curso) => [
      ...(curso.imagenStoragePath ? [curso.imagenStoragePath] : []),
      ...(options.includeCourseFiles
        ? (curso.archivos ?? []).map((archivo) => archivo.storagePath)
        : []),
      ...(options.includeClassFiles
        ? (curso.clases ?? []).flatMap((clase) =>
            (clase.archivos ?? []).map((archivo) => archivo.storagePath),
          )
        : []),
    ]);

    return this.storageService.createSignedUrlMap(storagePaths);
  }

  private isAdminViewer(viewer?: ViewerContext) {
    return viewer?.rol === 'admin';
  }

  private async isViewerEnrolledInCurso(userId: string, cursoId: number) {
    const enrollment = await this.inscripcionesRepo.findOne({
      where: { usuarioId: userId, cursoId },
    });

    return Boolean(enrollment);
  }

  private resolveArchivosAEliminar(
    archivosActuales: CursoArchivo[],
    archivoIdsAEliminar?: number[],
  ) {
    if (!archivoIdsAEliminar?.length) return [];

    const archivosPorId = new Map(
      archivosActuales.map((archivo) => [archivo.cursoArchivoId, archivo]),
    );

    const archivosAEliminar = archivoIdsAEliminar
      .map((archivoId) => archivosPorId.get(archivoId))
      .filter((archivo): archivo is CursoArchivo => Boolean(archivo));

    if (archivosAEliminar.length !== archivoIdsAEliminar.length) {
      const missingIds = archivoIdsAEliminar.filter(
        (archivoId) => !archivosPorId.has(archivoId),
      );
      throw new NotFoundException(
        `Archivos de curso no encontrados: ${missingIds.join(', ')}`,
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

  private sortClases(clases: Clase[]) {
    return [...clases].sort((a, b) => {
      const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
      const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.claseId - b.claseId;
    });
  }

  private assertFotoValida(foto?: Express.Multer.File) {
    if (!foto) return;

    if (!CURSO_FOTO_MIME_TYPES.has(foto.mimetype)) {
      throw new BadRequestException(
        'La foto del curso solo admite JPG, PNG o WEBP',
      );
    }
  }
}
