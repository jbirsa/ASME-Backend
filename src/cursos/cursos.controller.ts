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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@ApiTags('cursos')
@Controller('cursos')
export class CursosController {
  constructor(private readonly service: CursosService) {}

  @ApiOperation({ summary: 'Crear curso' })
  @ApiResponse({ status: 201, description: 'Curso creado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Listar cursos' })
  @ApiResponse({ status: 200, description: 'Listado de cursos' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Obtener curso por id' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCursoDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
