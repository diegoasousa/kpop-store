import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
