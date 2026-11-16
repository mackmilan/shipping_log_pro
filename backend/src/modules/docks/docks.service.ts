import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dock } from '../../entities/dock.entity';
import { CreateDockDto } from './dto/create-dock.dto';
import { UpdateDockDto } from './dto/update-dock.dto';
import { ScheduleStage } from '../../common/enums/stage.enum';

@Injectable()
export class DocksService {
  constructor(
    @InjectRepository(Dock)
    private readonly dockRepository: Repository<Dock>,
  ) {}

  async findAll() {
    return this.dockRepository.find({
      order: { code: 'ASC' },
      relations: ['schedules', 'schedules.truck'],
    });
  }

  async findOne(id: number) {
    const dock = await this.dockRepository.findOne({
      where: { id },
      relations: ['schedules', 'schedules.truck'],
    });
    if (!dock) {
      throw new NotFoundException(`Doca #${id} não encontrada`);
    }
    return dock;
  }

  async create(dto: CreateDockDto) {
    const existing = await this.dockRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Doca com código ${dto.code} já existe`);
    }

    const dock = this.dockRepository.create(dto);
    return this.dockRepository.save(dock);
  }

  async update(id: number, dto: UpdateDockDto) {
    const dock = await this.findOne(id);

    if (dto.code && dto.code !== dock.code) {
      const existing = await this.dockRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Doca com código ${dto.code} já existe`);
      }
    }

    Object.assign(dock, dto);
    return this.dockRepository.save(dock);
  }

  async remove(id: number) {
    const dock = await this.findOne(id);
    await this.dockRepository.remove(dock);
    return { success: true, message: `Doca #${id} removida com sucesso` };
  }
}
