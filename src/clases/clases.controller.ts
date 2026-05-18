import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ClasesService } from './clases.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

const CLASE_UPLOAD_FIELDS = [{ name: 'archivos', maxCount: 10 }];

const CLASE_UPLOAD_LIMITS = {
  fileSize: 25 * 1024 * 1024,
  files: 10,
};

@ApiTags('clases')
@Controller('clases')
export class ClasesController {
  constructor(private readonly service: ClasesService) {}

  @ApiOperation({ summary: 'Crear clase' })
  @ApiResponse({ status: 201 })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cursoId', 'titulo'],
      properties: {
        cursoId: {
          type: 'integer',
          example: 1,
          description: 'ID numerico del curso al que pertenece la clase',
        },
        titulo: {
          type: 'string',
          example: 'Clase 1 - Interfaz y primeros pasos',
          description: 'Titulo visible de la clase',
        },
        descripcion: {
          type: 'string',
          example: 'Recorrido inicial por el entorno de trabajo.',
          description: 'Descripcion de la clase',
        },
        videoUrl: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=abcd1234',
          description: 'URL del video de YouTube usado como material principal',
        },
        orden: {
          type: 'integer',
          example: 1,
          description: 'Orden de aparicion de la clase dentro del curso',
        },
        archivos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Archivos opcionales asociados a la clase',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(CLASE_UPLOAD_FIELDS, { limits: CLASE_UPLOAD_LIMITS }),
  )
  create(
    @Body() dto: CreateClaseDto,
    @UploadedFiles() files: { archivos?: Express.Multer.File[] },
  ) {
    return this.service.create(dto, files?.archivos ?? []);
  }

  @ApiOperation({ summary: 'Listar clases' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @ApiOperation({ summary: 'Listar clases por curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({
    name: 'cursoId',
    example: 1,
    description: 'ID numerico del curso',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get('curso/:cursoId')
  findByCurso(@Param('cursoId', ParseIntPipe) cursoId: number, @Req() req: any) {
    return this.service.findByCurso(cursoId, req.user);
  }

  @ApiOperation({ summary: 'Obtener clase por id' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico de la clase' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Actualizar clase' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico de la clase' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cursoId: {
          type: 'integer',
          example: 1,
          description: 'Nuevo ID del curso si la clase cambia de curso',
        },
        titulo: {
          type: 'string',
          example: 'Clase 1 - Interfaz actualizada',
          description: 'Nuevo titulo de la clase',
        },
        descripcion: {
          type: 'string',
          example: 'Contenido actualizado de la clase.',
          description: 'Nueva descripcion de la clase',
        },
        videoUrl: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=wxyz5678',
          description: 'Nuevo video principal de la clase',
        },
        orden: {
          type: 'integer',
          example: 2,
          description: 'Nuevo orden de la clase',
        },
        archivoIdsAEliminar: {
          type: 'string',
          example: '[1,2]',
          description:
            'IDs de archivos a eliminar. En multipart enviar como JSON string',
        },
        archivos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Nuevos archivos a agregar a la clase',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(CLASE_UPLOAD_FIELDS, { limits: CLASE_UPLOAD_LIMITS }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClaseDto,
    @UploadedFiles() files: { archivos?: Express.Multer.File[] },
  ) {
    return this.service.update(id, dto, files?.archivos ?? []);
  }

  @ApiOperation({ summary: 'Eliminar clase' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico de la clase' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
