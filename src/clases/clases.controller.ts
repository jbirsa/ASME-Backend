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
import { ClasesService } from './clases.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

@ApiTags('clases')
@Controller('clases')
export class ClasesController {
  constructor(private readonly service: ClasesService) {}

  @ApiOperation({ summary: 'Crear clase' })
  @ApiResponse({ status: 201 })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateClaseDto,
    examples: {
      clase: {
        summary: 'Clase inicial de curso',
        value: {
          cursoId: 1,
          titulo: 'Clase 1 - Interfaz y primeros pasos',
          descripcion: 'Recorrido inicial por el entorno de trabajo.',
          videoUrl: 'https://www.youtube.com/watch?v=abcd1234',
          orden: 1,
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateClaseDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Listar clases' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get()
  findAll() {
    return this.service.findAll();
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
  findByCurso(@Param('cursoId', ParseIntPipe) cursoId: number) {
    return this.service.findByCurso(cursoId);
  }

  @ApiOperation({ summary: 'Obtener clase por id' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico de la clase' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar clase' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico de la clase' })
  @ApiBody({
    type: UpdateClaseDto,
    examples: {
      actualizacion: {
        summary: 'Actualizar titulo u orden',
        value: {
          titulo: 'Clase 1 - Interfaz actualizada',
          orden: 2,
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClaseDto) {
    return this.service.update(id, dto);
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
