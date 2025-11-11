import { Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ required: true }) nombre: string;
    @Prop({ required: true }) apellido: string;
    @Prop({ required: true, unique: true, index: true }) correo: string;
    @Prop({ required: true, unique: true, index: true }) username: string;
    @Prop({ required: true }) passwordHash: string; // hashed
    @Prop() fechaNacimiento: Date;
    @Prop() descripcion: string;
    // Campo para almacenar URL de imagen de perfil de Cloudinary
    @Prop({ default: null }) fotoPerfil?: string;
    // Campo para almacenar public_id de Cloudinary (necesario para eliminar imagen)
    @Prop({ default: null }) cloudinaryPublicId?: string;
    @Prop({ default: 'usuario' }) perfil: string; // 'usuario' | 'administrador'
    @Prop() avatarUrl: string;
    @Prop({ default: true }) alta: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

