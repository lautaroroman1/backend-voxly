import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from 'src/publicaciones/schemas/publicacion.schema';
import { Comentario, ComentarioDocument } from 'src/publicaciones/schemas/comentario.schema';

@Injectable()
export class EstadisticasService {

    constructor(
        @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
        @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
    ) {}
    
    async postPorUsuario(from: Date, to: Date) {
        return this.publicacionModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: from, $lte: to },
                    eliminado: false   // 👈 solo publicaciones activas
                }
            },
            {
                $group: {
                _id: "$usuario",
                total: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    usuarioId: { $toObjectId: "$_id" }
                }
            },
            {
                $lookup: {
                from: "users",
                localField: "usuarioId",
                foreignField: "_id",
                as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            {
                $project: {
                _id: 0,
                usuario: "$usuario.nombre",
                total: 1
                }
            }
        ]);
    }

    async totalComentarios(from: Date, to: Date) {
        return this.comentarioModel.countDocuments({
            createdAt: { $gte: from, $lte: to },
        });
    }

    async comentariosPorPost(from: Date, to: Date) {
        return this.comentarioModel.aggregate([
            {
            $match: {
                createdAt: { $gte: from, $lte: to }
            }
            },
            {
            $group: {
                _id: "$publicacion",
                totalComments: { $sum: 1 }
            }
            },
            {
            $lookup: {
                from: "publicacions",
                localField: "_id",
                foreignField: "_id",
                as: "publicacionInfo"
            }
            },
            { $unwind: "$publicacionInfo" },
            {
                $match: {
                    "publicacionInfo.createdAt": { $gte: from, $lte: to } // filtro por fecha de publicación
                }
            },
            {
            $project: {
                id: "$publicacionInfo._id",
                contenido: "$publicacionInfo.titulo",
                totalComments: 1,
                _id: 0
            }
            }
        ]);
    }

}
