import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsNotEmpty()
    @IsString()
    apellido: string;

    @IsNotEmpty()
    @IsEmail({}, { message: 'Debe ser un correo válido' })
    correo: string;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe tener al menos una mayúscula y un número',
    })
    password: string;

    @IsOptional()
    @IsDateString({}, { message: 'Debe ser una fecha válida (YYYY-MM-DD)' })
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    fotoPerfil?: string;

    @IsOptional()
    @IsString()
    cloudinaryPublicId?: string;
}