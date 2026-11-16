import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { FilterScheduleDto } from './dto/filter-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos com filtros e métricas de tempo' })
  findAll(@Query() filter: FilterScheduleDto) {
    return this.schedulesService.findAll(filter);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obter KPIs e métricas consolidadas (Parados, Em Trânsito, Médias)' })
  getMetrics() {
    return this.schedulesService.getMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes do agendamento com histórico de etapas' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Criar nova janela de descarga (Admin ou Operador)' })
  create(
    @Body() dto: CreateScheduleDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.schedulesService.create(dto, userId);
  }

  @Post(':id/stage')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Avançar ou alterar etapa do caminhão (Em Trânsito, Parado, Doca, Descarga, etc.)',
  })
  updateStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStageDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.schedulesService.updateStage(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir agendamento (Apenas Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }
}
