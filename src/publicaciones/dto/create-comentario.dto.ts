import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  mensaje: string;
}

// DTO para modificar
export class UpdateComentarioDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  mensaje: string;
}