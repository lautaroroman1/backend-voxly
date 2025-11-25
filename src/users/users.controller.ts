import { Controller, Get, Post, Body, HttpCode, Delete, Param, Query, HttpStatus, UseInterceptors, UploadedFile, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @HttpCode(HttpStatus.CREATED)
  async register(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: any,
  ) {
    console.log(body); // qué está llegando
    console.log(file); // info del archivo
    const createUserDto: CreateUserDto = { ...body }
    const user = await this.usersService.create(createUserDto, file);
    const { passwordHash, ...result } = user.toObject();
    return result;
  }

  // Listar publicaciones
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async disableUser(@Param('id') userId: string) {
    // El servicio realiza la baja lógica (alta = false)
    return this.usersService.toggleAlta(userId, false); 
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async enableUser(@Param('id') userId: string) {
    // El servicio realiza la alta lógica (alta = true)
    return this.usersService.toggleAlta(userId, true); 
  }

}
