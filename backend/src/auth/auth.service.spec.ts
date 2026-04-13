import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaServiceMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs in with a case-insensitive, trimmed email', async () => {
    prismaServiceMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'player@example.com',
      role: 'CUSTOMER',
      passwordHash: 'stored-hash',
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({
        email: '  Player@Example.com  ',
        password: 'secret123',
      }),
    ).resolves.toEqual({ access_token: 'signed-token' });

    expect(prismaServiceMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'player@example.com',
          mode: 'insensitive',
        },
      },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'stored-hash');
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'player@example.com',
      role: 'CUSTOMER',
    });
  });

  it('rejects invalid credentials', async () => {
    prismaServiceMock.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
