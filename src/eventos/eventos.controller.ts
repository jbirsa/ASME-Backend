import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@ApiTags('eventos')
@Controller('eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @ApiOperation({ summary: 'Crear evento' })
  @ApiResponse({ status: 201 })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateEventoDto,
    examples: {
      evento: {
        summary: 'Evento presencial con patrocinadores',
        value: {
          nombre: 'Feria de Proyectos ASME',
          tipo: 'presencial',
          fecha: '2026-05-20',
          direccion: 'Av. Siempre Viva 123',
          barrio: 'Centro',
          provincia: 'Cordoba',
          descripcion: 'Evento institucional abierto para la comunidad.',
          link: 'https://meet.example.com/asme-feria',
          imagenUrl: 'https://example.com/eventos/feria.jpg',
          paginaEvento: 'https://asme.org/eventos/feria-2026',
          patrocinadorIds: [1, 2],
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateEventoDto) {
    return this.service.create(dto);
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
  @ApiBody({
    type: UpdateEventoDto,
    examples: {
      actualizacion: {
        summary: 'Actualizar descripcion o patrocinadores',
        value: {
          nombre: 'Feria de Proyectos ASME 2026',
          descripcion: 'Version actualizada del evento.',
          patrocinadorIds: [1],
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) {
    return this.service.update(id, dto);
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
