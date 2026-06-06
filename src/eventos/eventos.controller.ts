import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

const EVENTO_UPLOAD_FIELDS = [{ name: 'foto', maxCount: 1 }];

const EVENTO_UPLOAD_LIMITS = {
  fileSize: 25 * 1024 * 1024,
  files: 1,
};

@ApiTags('eventos')
@Controller('eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @ApiOperation({ summary: 'Crear evento' })
  @ApiResponse({ status: 201 })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'tipo', 'fecha', 'direccion', 'descripcion'],
      properties: {
        nombre: { type: 'string', example: 'Feria de Proyectos ASME' },
        tipo: {
          type: 'string',
          enum: ['Charla', 'Visita', 'Competencia', 'Evento especial'],
          example: 'Charla',
        },
        fecha: { type: 'string', example: '2026-05-20' },
        direccion: { type: 'string', example: 'Av. Siempre Viva 123' },
        sede: {
          type: 'string',
          enum: [
            'Sede Distrito Financiero (SDF)',
            'Sede Distrito Rectorado (SDR)',
            'Sede Distrito Tecnologico (SDT)',
          ],
          example: 'Sede Distrito Financiero (SDF)',
        },
        descripcion: {
          type: 'string',
          example: 'Evento institucional abierto para la comunidad.',
        },
        link: {
          type: 'string',
          example: 'https://forms.gle/tu-formulario',
          description: 'Link opcional de inscripcion o streaming',
        },
        patrocinadorIds: {
          type: 'string',
          example: '[1,2]',
          description:
            'IDs de patrocinadores. En multipart enviar como JSON string',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Foto opcional del evento. Solo admite JPG, PNG o WEBP.',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(EVENTO_UPLOAD_FIELDS, { limits: EVENTO_UPLOAD_LIMITS }),
  )
  create(
    @Body() dto: CreateEventoDto,
    @UploadedFiles() files: { foto?: Express.Multer.File[] },
  ) {
    return this.service.create(dto, files?.foto?.[0]);
  }

  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: 200 })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Obtener evento por id' })
  @ApiResponse({ status: 200 })
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del evento' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar evento' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del evento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Feria de Proyectos ASME 2026' },
        tipo: {
          type: 'string',
          enum: ['Charla', 'Visita', 'Competencia', 'Evento especial'],
          example: 'Visita',
        },
        fecha: { type: 'string', example: '2026-05-20' },
        direccion: { type: 'string', example: 'Av. Siempre Viva 123' },
        sede: {
          type: 'string',
          enum: [
            'Sede Distrito Financiero (SDF)',
            'Sede Distrito Rectorado (SDR)',
            'Sede Distrito Tecnologico (SDT)',
          ],
          example: 'Sede Distrito Rectorado (SDR)',
        },
        descripcion: {
          type: 'string',
          example: 'Version actualizada del evento.',
        },
        link: {
          type: 'string',
          example: 'https://forms.gle/tu-formulario',
          description: 'Link opcional de inscripcion o streaming',
        },
        patrocinadorIds: {
          type: 'string',
          example: '[1]',
          description:
            'IDs de patrocinadores. En multipart enviar como JSON string',
        },
        eliminarFoto: {
          type: 'boolean',
          example: true,
          description: 'Quita la foto actual del evento',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description: 'Nueva foto del evento',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(EVENTO_UPLOAD_FIELDS, { limits: EVENTO_UPLOAD_LIMITS }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
    @UploadedFiles() files: { foto?: Express.Multer.File[] },
  ) {
    return this.service.update(id, dto, files?.foto?.[0]);
  }

  @ApiOperation({ summary: 'Eliminar evento' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del evento' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
