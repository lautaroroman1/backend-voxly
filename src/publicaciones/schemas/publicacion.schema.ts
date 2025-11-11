import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true }) // agrega createdAt y updatedAt automáticos
export class Publicacion {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  usuario: string;

  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  // Campo para almacenar URL de imagen de perfil de Cloudinary
  @Prop({ default: null })
  imagenUrl?: string;

  // Campo para almacenar public_id de Cloudinary (necesario para eliminar imagen)
  @Prop({ default: null })
  cloudinaryPublicId?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  likes: string[];

  @Prop({ default: false })
  eliminado: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
