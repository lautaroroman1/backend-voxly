import { Controller, Get, Query } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';

@Controller('estadisticas')
export class EstadisticasController {
    constructor(private readonly service: EstadisticasService) {}

    @Get('posts-por-usuario')
    getPostsPerUser(
        @Query('from') from: string,
        @Query('to') to: string
    ) {
        return this.service.postPorUsuario(new Date(from), new Date(to));
    }

    @Get('total-comentarios')
    getCommentsTotal(
        @Query('from') from: string,
        @Query('to') to: string
    ) {
        return this.service.totalComentarios(new Date(from), new Date(to));
    }

    @Get('comentarios-por-post')
    getCommentsPerPost(
        @Query('from') from: string,
        @Query('to') to: string
    ) {
        return this.service.comentariosPorPost(new Date(from), new Date(to));
    }
}

