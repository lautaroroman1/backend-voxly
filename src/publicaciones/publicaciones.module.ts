import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema';
import { ComentariosController } from './comentarios.controller';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    CloudinaryModule,
    UsersModule, // UsersModule para poder acceder a los usuarios
    AuthModule,
  ],
  providers: [PublicacionesService],
  exports: [PublicacionesService],
  controllers: [PublicacionesController, ComentariosController],

})
export class PublicacionesModule {}
