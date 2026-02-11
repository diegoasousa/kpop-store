import { UserRole } from "@prisma/client";
import { IsEnum, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
