import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from '../../entities/truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async findAll() {
    return this.truckRepository.find({
      order: { plate: 'ASC' },
    });
  }

  async findOne(id: number) {
    const truck = await this.truckRepository.findOne({
      where: { id },
    });
    if (!truck) {
      throw new NotFoundException(`Caminhão #${id} não encontrado`);
    }
    return truck;
  }

  async create(dto: CreateTruckDto) {
    const plateFormatted = dto.plate.toUpperCase().trim();
    const existing = await this.truckRepository.findOne({
      where: { plate: plateFormatted },
    });
    if (existing) {
      throw new ConflictException(`Caminhão com placa ${plateFormatted} já cadastrado`);
    }

    const truck = this.truckRepository.create({
      ...dto,
      plate: plateFormatted,
    });
    return this.truckRepository.save(truck);
  }

  async update(id: number, dto: Partial<CreateTruckDto>) {
    const truck = await this.findOne(id);
    if (dto.plate) {
      dto.plate = dto.plate.toUpperCase().trim();
      if (dto.plate !== truck.plate) {
        const existing = await this.truckRepository.findOne({
          where: { plate: dto.plate },
        });
        if (existing) {
          throw new ConflictException(`Caminhão com placa ${dto.plate} já cadastrado`);
        }
      }
    }
    Object.assign(truck, dto);
    return this.truckRepository.save(truck);
  }

  async remove(id: number) {
    const truck = await this.findOne(id);
    await this.truckRepository.remove(truck);
    return { success: true, message: `Caminhão #${id} removido com sucesso` };
  }
}
