import { Injectable } from '@nestjs/common';
import { cloudinary } from './cloudinary.config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'red-social/avatars',
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) resolve(result);
        },
      ).end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }
}