import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreatePublicacionDto {
  @IsString()
  @MaxLength(100)
  titulo: string;

  @IsString()
  @MaxLength(500)
  descripcion: string;

  @IsOptional()
  @IsUrl()
  imagenUrl?: string;
}
