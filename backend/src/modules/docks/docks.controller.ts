import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DocksService } from './docks.service';
import { CreateDockDto } from './dto/create-dock.dto';
import { UpdateDockDto } from './dto/update-dock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Docks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('docks')
export class DocksController {
  constructor(private readonly docksService: DocksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as docas' })
  findAll() {
    return this.docksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar doca por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.docksService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Cadastrar nova doca (Admin ou Operador)' })
  create(@Body() dto: CreateDockDto) {
    return this.docksService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Atualizar doca (Admin ou Operador)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDockDto) {
    return this.docksService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir doca (Apenas Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.docksService.remove(id);
  }
}
