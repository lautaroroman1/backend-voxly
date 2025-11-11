import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Request, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, } from '@nestjs/common';
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
}
