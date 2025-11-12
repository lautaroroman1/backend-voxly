import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PublicacionesService {
	constructor(
		@InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
		private cloudinaryService: CloudinaryService,
	) {}

	// Crear publicación
  async create(createPublicacionDto: CreatePublicacionDto, userId: string, file?: Express.Multer.File): Promise<PublicacionDocument> {
    let imageUrl = null;
    let publicId = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    const newPost = new this.publicacionModel({
      ...createPublicacionDto,
      usuario: userId,
      imageUrl,
      cloudinaryPublicId: publicId,
      likes: [],
      alta: true,
      createdAt: new Date(),
    });

    return newPost.save();
  }

	// Listar publicaciones
  async findAll(userId?: string, sortBy: 'date' | 'likes' = 'date', offset = 0,
    limit = 10, ): Promise<PublicacionDocument[]> {
    const filter: any = { alta: true };
    if (userId) filter.user = userId;

    const sort: any = sortBy === 'date' ? { createdAt: -1 } : { likesCount: -1 };

    return this.publicacionModel
      .find(filter)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .exec();
  }

	// Baja lógica de publicación
  async eliminar(postId: string, userId: string, perfil: string): Promise<void> {
    const post = await this.publicacionModel.findById(postId);
    if (!post) throw new NotFoundException('Publicación no encontrada');

    // Solo el dueño o un administrador puede eliminar
    const esAdmin = perfil === 'administrador';

    if (post.usuario.toString() !== userId && !esAdmin) {
      throw new ForbiddenException('No tienes permisos para eliminar esta publicación');
    }
    
    post.eliminado = true;
    await post.save();
  }

  // Dar me gusta
  async like(postId: string, userId: string): Promise<PublicacionDocument> {
    const post = await this.publicacionModel.findById(postId);
    if (!post) throw new NotFoundException('Publicación no encontrada');

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    }

    return post.save();
  }

  // Quitar me gusta
  async unlike(postId: string, userId: string): Promise<PublicacionDocument> {
    const post = await this.publicacionModel.findById(postId);
    if (!post) throw new NotFoundException('Publicación no encontrada');

    post.likes = post.likes.filter((id) => id.toString() !== userId);
    return post.save();
  }

}
