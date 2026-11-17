import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((user) => Promise.resolve({ id: 1, ...user })),
    };

    mockJwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user info on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Administrador',
        email: 'admin@shippinglog.local',
        password: hashedPassword,
        role: UserRole.ADMIN,
        active: true,
      });

      const result = await service.login({
        email: 'admin@shippinglog.local',
        password: 'admin123',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).toEqual({
        id: 1,
        name: 'Administrador',
        email: 'admin@shippinglog.local',
        role: UserRole.ADMIN,
      });
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10);
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Administrador',
        email: 'admin@shippinglog.local',
        password: hashedPassword,
        role: UserRole.ADMIN,
        active: true,
      });

      await expect(
        service.login({
          email: 'admin@shippinglog.local',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@shippinglog.local',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.register({
        name: 'Novo Usuário',
        email: 'novo@shippinglog.local',
        password: 'password123',
        role: UserRole.USER,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('novo@shippinglog.local');
    });

    it('should throw ConflictException if user email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'existente@test.com' });

      await expect(
        service.register({
          name: 'Existente',
          email: 'existente@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
