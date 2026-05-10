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
  @ApiBody({
    type: CreateCursoDto,
    examples: {
      curso: {
        summary: 'Curso activo',
        value: {
          nombre: 'Introduccion a CAD',
          descripcion: 'Curso inicial de modelado 3D para estudiantes.',
          imagenUrl: 'https://example.com/cursos/intro-cad.jpg',
          estado: 'activo',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Listar cursos' })
  @ApiResponse({ status: 200, description: 'Listado de cursos' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get()
  findAll() {
    return this.service.findAll();
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar curso' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 1, description: 'ID numerico del curso' })
  @ApiBody({
    type: UpdateCursoDto,
    examples: {
      actualizacion: {
        summary: 'Actualizar nombre o estado',
        value: {
          nombre: 'Introduccion a CAD - Edicion 2026',
          estado: 'activo',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCursoDto) {
    return this.service.update(id, dto);
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
