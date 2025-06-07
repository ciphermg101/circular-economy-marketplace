import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator";

export class AuthCredentialsDto {
  @ApiProperty({
    example: "user@gmail.com",
    description: "The email address of the user",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Password@123",
    description: "The password for the user account",
  })
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}