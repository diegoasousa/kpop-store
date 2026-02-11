import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.buildAuthResponse(user.id, user.username, user.role);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException("Username already exists");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role ?? UserRole.CUSTOMER,
      },
    });
    return this.buildAuthResponse(user.id, user.username, user.role);
  }

  private buildAuthResponse(id: string, username: string, role: string) {
    const accessToken = this.jwt.sign({ sub: id, role, username });
    return { accessToken, user: { id, username, role } };
  }
}
