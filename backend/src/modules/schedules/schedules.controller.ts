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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { FilterScheduleDto } from './dto/filter-schedule.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AddStageImageDto } from './dto/add-image.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  try {
    mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // Ignore error if already created
  }
}

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
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.DRIVER)
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

  @Post(':id/location')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.DRIVER)
  @ApiOperation({ summary: 'Informar ou atualizar localização GPS atual da etapa' })
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.schedulesService.updateLocation(id, dto, userId);
  }

  @Post(':id/stage-images')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.DRIVER)
  @ApiOperation({ summary: 'Enviar imagem/foto para a etapa atual ou indicada' })
  addStageImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddStageImageDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.schedulesService.addStageImage(id, dto, userId);
  }

  @Post(':id/upload-image')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.DRIVER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Fazer upload de arquivo de imagem para a etapa' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `stage-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fileUrl = `/uploads/${file.filename}`;
    return this.schedulesService.addStageImage(
      id,
      {
        url: fileUrl,
        caption: body.caption,
        stage: body.stage,
        latitude: body.latitude ? parseFloat(body.latitude) : undefined,
        longitude: body.longitude ? parseFloat(body.longitude) : undefined,
        locationName: body.locationName,
      },
      userId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir agendamento (Apenas Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }
}
