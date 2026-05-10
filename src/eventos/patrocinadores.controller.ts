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
import { CreatePatrocinadorDto } from './dto/create-patrocinador.dto';
import { UpdatePatrocinadorDto } from './dto/update-patrocinador.dto';
import { PatrocinadoresService } from './patrocinadores.service';

@ApiTags('patrocinadores')
@Controller('patrocinadores')
export class PatrocinadoresController {
  constructor(private readonly service: PatrocinadoresService) {}

  @ApiOperation({ summary: 'Crear patrocinador' })
  @ApiResponse({ status: 201, description: 'Patrocinador creado' })
  @ApiBearerAuth()
  @ApiBody({
    type: CreatePatrocinadorDto,
    examples: {
      patrocinador: {
        summary: 'Patrocinador institucional',
        value: {
          nombre: 'SolidWorks',
          email: 'contacto@solidworks.com',
          link: 'https://www.solidworks.com/',
          imagenUrl: 'https://example.com/patrocinadores/solidworks.png',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreatePatrocinadorDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Listar patrocinadores' })
  @ApiResponse({ status: 200, description: 'Listado de patrocinadores' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Obtener patrocinador por id' })
  @ApiResponse({ status: 200, description: 'Patrocinador encontrado' })
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'ID numerico del patrocinador',
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar patrocinador' })
  @ApiResponse({ status: 200, description: 'Patrocinador actualizado' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'ID numerico del patrocinador',
  })
  @ApiBody({
    type: UpdatePatrocinadorDto,
    examples: {
      actualizacion: {
        summary: 'Actualizar nombre o link',
        value: {
          nombre: 'Dassault Systemes',
          link: 'https://www.3ds.com/',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatrocinadorDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar patrocinador' })
  @ApiResponse({ status: 200, description: 'Patrocinador eliminado' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'ID numerico del patrocinador',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
