import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

const CURSO_UPLOAD_FIELDS = [
  { name: 'foto', maxCount: 1 },
  { name: 'archivos', maxCount: 10 },
];

const CURSO_UPLOAD_LIMITS = {
  fileSize: 25 * 1024 * 1024,
  files: 11,
};

@ApiTags('cursos')
@Controller('cursos')
export class CursosController {
  constructor(private readonly service: CursosService) {}

  @ApiOperation({ summary: 'Crear curso' })
  @ApiResponse({ status: 201, description: 'Curso creado' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: {
        nombre: {
          type: 'string',
          example: 'Introduccion a CAD',
          description: 'Nombre publico del curso',
        },
        descripcion: {
          type: 'string',
          example: 'Curso inicial de modelado 3D para estudiantes.',
          description: 'Descripcion breve del curso',
        },
        imagenUrl: {
          type: 'string',
          example: 'https://example.com/cursos/intro-cad.jpg',
          description:
            'URL externa opcional de la portada si no se sube el archivo foto',
        },
        estado: {
          type: 'string',
          example: 'activo',
          description: 'Estado visible del curso',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Foto opcional del curso que se guarda en Supabase Storage. Solo admite JPG, PNG o WEBP.',
        },
        archivos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Archivos opcionales asociados al curso',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(CURSO_UPLOAD_FIELDS, { limits: CURSO_UPLOAD_LIMITS }),
  )
  create(
    @Body() dto: CreateCursoDto,
    @UploadedFiles()
    files: { foto?: Express.Multer.File[]; archivos?: Express.Multer.File[] },
  ) {
    return this.service.create(dto, files?.foto?.[0], files?.archivos ?? []);
  }

  @ApiOperation({ summary: 'Listar cursos' })
  @ApiResponse({ status: 200, description: 'Listado de cursos' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @ApiOperation({ summary: 'Inscribirse a un curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del curso' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Post(':id/inscribirme')
  enroll(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.enroll(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Listar mis cursos' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get('mis-cursos')
  findMyCourses(@Req() req: any) {
    return this.service.findMyCourses(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtener curso por id' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del curso' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOneForViewer(id, req.user);
  }

  @ApiOperation({ summary: 'Actualizar curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del curso' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          example: 'Introduccion a CAD - Edicion 2026',
          description: 'Nuevo nombre del curso',
        },
        descripcion: {
          type: 'string',
          example: 'Curso actualizado con nuevo material.',
          description: 'Nueva descripcion del curso',
        },
        imagenUrl: {
          type: 'string',
          example: 'https://example.com/cursos/intro-cad-2026.jpg',
          description:
            'URL externa opcional. Si se envia, reemplaza la foto privada actual',
        },
        estado: {
          type: 'string',
          example: 'activo',
          description: 'Nuevo estado del curso',
        },
        eliminarFoto: {
          type: 'boolean',
          example: true,
          description:
            'Quita la foto actual cuando no se desea reemplazarla por otra',
        },
        archivoIdsAEliminar: {
          type: 'string',
          example: '[1,2]',
          description:
            'IDs de archivos a eliminar. En multipart enviar como JSON string',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Nueva foto privada del curso. Solo admite JPG, PNG o WEBP.',
        },
        archivos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Nuevos archivos a agregar al curso',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(CURSO_UPLOAD_FIELDS, { limits: CURSO_UPLOAD_LIMITS }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCursoDto,
    @UploadedFiles()
    files: { foto?: Express.Multer.File[]; archivos?: Express.Multer.File[] },
  ) {
    return this.service.update(
      id,
      dto,
      files?.foto?.[0],
      files?.archivos ?? [],
    );
  }

  @ApiOperation({ summary: 'Eliminar curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del curso' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
