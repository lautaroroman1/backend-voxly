import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(createUserDto: CreateUserDto, file: Express.Multer.File): Promise<UserDocument> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    let imageUrl = null;
    let publicId = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }
    
    const createdUser = new this.userModel({
      ...createUserDto,
      passwordHash: hashedPassword,
      fotoPerfil: imageUrl,
      cloudinaryPublicId: publicId,
    });
    
    return createdUser.save();
  }

  async updateProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.cloudinaryPublicId) {
      await this.cloudinaryService.deleteImage(user.cloudinaryPublicId);
    }

    const uploadResult = await this.cloudinaryService.uploadImage(file);
    
    user.fotoPerfil = uploadResult.secure_url;
    user.cloudinaryPublicId = uploadResult.public_id;
    
    return user.save();
  }

  //Listar usuarios
  async findAll(): Promise<UserDocument[]> {
    // Excluye la contraseña y ordna por nombre de usuario
    return this.userModel
        .find()
        .sort({ username: 1 }) 
        .select('-passwordHash')
        .exec();
  }
  
  // Alta y baja de usuario
  async toggleAlta(userId: string, isAlta: boolean): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
        throw new NotFoundException('Usuario no encontrado');
    }

    //Prevenir que se deshabilite un admin
    if (user.perfil === 'admin' && !isAlta) {
        throw new ForbiddenException('No puedes deshabilitar una cuenta de administrador');
    }
    
    user.alta = isAlta;
    return user.save();
  }
}

