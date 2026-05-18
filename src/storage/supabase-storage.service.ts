import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient | null;
  private readonly bucketName: string | null;
  private readonly signedUrlTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')?.trim();
    const serviceRoleKey = this.configService
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();

    this.bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET')?.trim() ?? null;

    const rawSignedUrlTtl = this.configService.get<string>(
      'SUPABASE_SIGNED_URL_TTL_SECONDS',
    );
    const parsedSignedUrlTtl = Number(rawSignedUrlTtl);

    this.signedUrlTtlSeconds =
      Number.isFinite(parsedSignedUrlTtl) && parsedSignedUrlTtl > 0
        ? parsedSignedUrlTtl
        : 300;

    this.client =
      supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          })
        : null;
  }

  async uploadFile(file: Express.Multer.File, folder: string) {
    this.ensureConfigured();

    if (!file.buffer) {
      throw new InternalServerErrorException(
        'El archivo recibido no contiene contenido para subir',
      );
    }

    const storagePath = `${folder}/${randomUUID()}-${this.sanitizeFileName(file.originalname)}`;
    const { error } = await this.client!.storage.from(this.bucketName!).upload(
      storagePath,
      file.buffer,
      {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      },
    );

    if (error) {
      throw new InternalServerErrorException(
        `No se pudo subir el archivo ${file.originalname}`,
      );
    }

    return storagePath;
  }

  async createSignedUrlMap(storagePaths: Array<string | null | undefined>) {
    const uniqueStoragePaths = [
      ...new Set(
        storagePaths.filter((storagePath): storagePath is string =>
          Boolean(storagePath),
        ),
      ),
    ];
    if (uniqueStoragePaths.length === 0) return new Map<string, string>();

    this.ensureConfigured();

    const { data, error } = await this.client!.storage.from(
      this.bucketName!,
    ).createSignedUrls(uniqueStoragePaths, this.signedUrlTtlSeconds);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudieron generar las URLs firmadas de los archivos',
      );
    }

    const signedEntries: Array<[string, string]> = data.flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [],
    );

    return new Map<string, string>(signedEntries);
  }

  async removeFiles(storagePaths: string[]) {
    const uniqueStoragePaths = [...new Set(storagePaths.filter(Boolean))];
    if (uniqueStoragePaths.length === 0) return;

    this.ensureConfigured();

    const { error } = await this.client!.storage.from(this.bucketName!).remove(
      uniqueStoragePaths,
    );

    if (error) {
      throw new InternalServerErrorException(
        'No se pudieron eliminar archivos del storage',
      );
    }
  }

  private ensureConfigured() {
    if (this.client && this.bucketName) return;

    throw new InternalServerErrorException(
      'Storage no configurado. Define SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET.',
    );
  }

  private sanitizeFileName(fileName: string) {
    const trimmedFileName = fileName.trim();
    const sanitizedFileName = trimmedFileName.replace(/[^A-Za-z0-9._-]/g, '_');
    return sanitizedFileName || 'archivo';
  }
}
