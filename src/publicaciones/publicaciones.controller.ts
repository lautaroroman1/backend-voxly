import { Controller, Get, Post, Delete, Param, Body, Query, UploadedFile, UseInterceptors, Request, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, HttpCode, HttpStatus, Req, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { AuthGuard } from 'src/auth/auth.guard';


@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: any,
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    const userId = req.user.sub;
    return this.publicacionesService.create(body, userId, file)
  }

  // Listar publicaciones
  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy: 'date' | 'likes' = 'date',
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
  ) {
    //Convertimos offset y limit a número, porque query params siempre vienen como string
    const offsetNumber = Number(offset);
    const limitNumber = Number(limit);

    return this.publicacionesService.findAll(
      userId,
      sortBy,
      offsetNumber,
      limitNumber
    );
  }

  // Obtener publicación por ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const publicacion = await this.publicacionesService.findById(id);
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return publicacion;
  }

  // Eliminar publicación (protegido)
  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub;
    const perfil = req.user.perfil; // 'usuario' o 'administrador'
    return this.publicacionesService.eliminar(id, userId, perfil);
  }

  // Dar me gusta
  @UseGuards(AuthGuard)
  @Post(':id/like')
  async like(@Request() req, @Param('id') postId: string) {
    const userId = req.user.sub; // viene del payload del JWT
    return this.publicacionesService.like(postId, userId);
  }

  // Quitar me gusta (protegido)
  @UseGuards(AuthGuard)
  @Delete(':id/like')
  async unlike(@Request() req, @Param('id') postId: string) {
    const userId = req.user.sub;
    return this.publicacionesService.unlike(postId, userId);
  }

}
