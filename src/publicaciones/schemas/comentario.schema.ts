import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Publicacion } from './publicacion.schema';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true }) // Para tener createdAt
export class Comentario {
    @Prop({ type: Types.ObjectId, ref: Publicacion.name, required: true })
    publicacion: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    usuario: Types.ObjectId;

    @Prop({ required: true })
    mensaje: string;

    // Se agrega si es modificado para cumplir con el requisito
    @Prop({ default: false })
    modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);