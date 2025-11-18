import { Controller, Post, Get, Put, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { PublicacionesService } from './publicaciones.service';
import { CreateComentarioDto, UpdateComentarioDto } from './dto/create-comentario.dto';

@UseGuards(AuthGuard)
@Controller('publicaciones/:publicacionId/comentarios') 
export class ComentariosController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // Por POST: agrega un comentario a una publicación
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('publicacionId') publicacionId: string,
    @Body() createComentarioDto: CreateComentarioDto,
    @Request() req,
  ) {
    const userId = req.user.sub; // ID del usuario logueado (desde el JWT)
    return this.publicacionesService.addComment(publicacionId, userId, createComentarioDto.mensaje);
  }

  // Por GET: trae los comentarios de una publicación específica
  @Get()
  @HttpCode(HttpStatus.OK)
  // Quitamos @UseGuards(AuthGuard) para que sea público si es necesario, 
  // pero lo mantenemos por ahora si la ruta está protegida
  async findAll(
    @Param('publicacionId') publicacionId: string,
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
  ) {
    const offsetNumber = Number(offset);
    const limitNumber = Number(limit);

    return this.publicacionesService.findCommentsByPost(publicacionId, offsetNumber, limitNumber);
  }

  // Por PUT: modifica el mensaje del comentario
  @Put(':comentarioId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('publicacionId') publicacionId: string, 
    @Param('comentarioId') comentarioId: string,
    @Body() updateComentarioDto: UpdateComentarioDto,
    @Request() req,
  ) {
    const userId = req.user.sub; // ID del usuario logueado
    return this.publicacionesService.updateComment(comentarioId, userId, updateComentarioDto.mensaje);
  }
}