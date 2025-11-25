import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema';

@Injectable()
export class PublicacionesService {
	constructor(
		@InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
		private cloudinaryService: CloudinaryService,
	) {}

	// Crear publicación
  async create(createPublicacionDto: CreatePublicacionDto, userId: string, file?: Express.Multer.File): Promise<PublicacionDocument> {
    let imagenUrl = null;
    let publicId = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imagenUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    const newPost = new this.publicacionModel({
      ...createPublicacionDto,
      usuario: userId,
      imagenUrl,
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
    const filter: any = { eliminado: false };

    // [MODIFICACIÓN] Convertir userId a Types.ObjectId
    if (userId) {
        // Mongoose espera un objeto ObjectId para la referencia.
        filter.usuario = new Types.ObjectId(userId);
    }

    // 1. ORDENAR POR FECHA (MÁS EFICIENTE CON FIND)
      if (sortBy === 'date') {
          const sort: any = { createdAt: -1 };

          return this.publicacionModel
              .find(filter)
              .sort(sort)
              .skip(offset)
              .limit(limit)
              // Usamos populate para traer datos de usuario
              .populate('usuario', 'username fotoPerfil') 
              .exec();
      } 
      
      // 2. ORDENAR POR LIKES (REQUIERE AGGREGATION)
      if (sortBy === 'likes') {
          return this.publicacionModel.aggregate([
              // 1. Filtrar documentos (por eliminado: false y por userId si existe)
              { $match: filter },
              
              // 2. Proyectar el campo 'likeCount' calculando el tamaño del array 'likes'
              {
                  $addFields: {
                      likeCount: { $size: '$likes' }
                  }
              },
              
              // 3. Ordenar por likeCount (descendente: más likes primero)
              { $sort: { likeCount: -1, createdAt: -1 } }, 

              // 4. Paginación
              { $skip: offset },
              { $limit: limit },

              // 5. Lookup (Join) para popular los datos del usuario (la colección 'users' es el nombre por defecto)
              {
                  $lookup: {
                      from: 'users', 
                      localField: 'usuario',
                      foreignField: '_id',
                      as: 'usuario'
                  }
              },
              // 6. Desestructurar el array 'usuario' creado por $lookup
              { $unwind: '$usuario' },

              // 7. Proyectar solo los campos necesarios (incluyendo el usuario populado)
              {
                  $project: {
                      _id: 1,
                      usuario: { _id: '$usuario._id', username: '$usuario.username', fotoPerfil: '$usuario.fotoPerfil' },
                      titulo: 1,
                      descripcion: 1,
                      imagenUrl: 1,
                      cloudinaryPublicId: 1,
                      likes: 1, 
                      eliminado: 1,
                      createdAt: 1,
                      updatedAt: 1,
                  }
              }
          ]).exec() as unknown as PublicacionDocument[]; // Se requiere un cast
      }

      // Si sortBy no coincide con nada, usamos la opción más eficiente por defecto.
      const sort: any = { createdAt: -1 }; 
      return this.publicacionModel
          .find(filter)
          .sort(sort)
          .skip(offset)
          .limit(limit)
          .populate('usuario', 'username fotoPerfil')
          .exec();
  }

  async findById(postId: string): Promise<PublicacionDocument | null> {
    if (!Types.ObjectId.isValid(postId)) {
        throw new BadRequestException('ID de publicación inválido');
    }
    
    // Usamos .populate() para traer la información del usuario de la publicación
    return this.publicacionModel
        .findById(postId)
        .populate('usuario', 'username fotoPerfil') // Especifica qué campos del usuario quieres
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

  async addComment(publicacionId: string, userId: string, mensaje: string): Promise<ComentarioDocument> {
        if (!Types.ObjectId.isValid(publicacionId)) {
            throw new BadRequestException('ID de publicación inválido');
        }

        const newComment = new this.comentarioModel({
            publicacion: new Types.ObjectId(publicacionId),
            usuario: new Types.ObjectId(userId),
            mensaje,
            modificado: false,
        });

        // 1. Guardar el nuevo comentario
        const savedComment = await newComment.save();
        
        // 2. Ejecutar populate antes de devolverlo al frontend (para traer el usuario y foto)
        await savedComment.populate('usuario', 'username fotoPerfil');

        return savedComment;
    }

    // [NUEVO MÉTODO] Listar comentarios por publicación (GET)
    async findCommentsByPost(publicacionId: string, offset = 0, limit = 10): Promise<ComentarioDocument[]> {
        if (!Types.ObjectId.isValid(publicacionId)) {
            throw new BadRequestException('ID de publicación inválido');
        }

        // Requisito: Ordenar los resultados, los más recientes primero.
        // Requisito: Debe permitir paginar los resultados.
        return this.comentarioModel
            .find({ publicacion: new Types.ObjectId(publicacionId) })
            .sort({ createdAt: -1 }) // Los más recientes primero
            .skip(offset)
            .limit(limit)
            .populate('usuario', 'username fotoPerfil') // Rellenar datos del usuario
            .exec();
    }

    // [NUEVO MÉTODO] Modificar comentario (PUT)
    async updateComment(comentarioId: string, userId: string, nuevoMensaje: string): Promise<ComentarioDocument> {
        const comentario = await this.comentarioModel.findById(comentarioId);

        if (!comentario) {
            throw new NotFoundException('Comentario no encontrado');
        }

        // Validar que solo el dueño del comentario puede editar
        if (comentario.usuario.toString() !== userId) {
            throw new ForbiddenException('No tienes permisos para editar este comentario');
        }

        comentario.mensaje = nuevoMensaje;
        comentario.modificado = true; // Requisito: Agrega el atributo modificado: true

        // 1. Guardar los cambios
        const updatedComment = await comentario.save();
        
        // 2. Ejecutar la población antes de devolverlo al frontend
        await updatedComment.populate('usuario', 'username fotoPerfil'); // [IMPORTANTE]

        return updatedComment;
    }

}
