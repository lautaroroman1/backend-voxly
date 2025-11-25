import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);

    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      role: user.perfil,
      sub: user._id.toString(),
      username: user.username,
      perfil: user.perfil
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getUpdatedProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    const { passwordHash, ...result } = user.toObject();
    return result;
  }

  async autorizarToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret, // Clave para verificación
      });

      // Si es válido, devolver los datos del usuario (buscamos el perfil actualizado)
      return this.getUpdatedProfile(payload.sub); 

    } catch (error) {
      // Si hay un error (vencido, inválido), lanza 401
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async refrescarToken(oldToken: string): Promise<{ access_token: string }> {
    if (!oldToken) {
        throw new UnauthorizedException('Token no proporcionado');
    }

    try {
        // Usamos verifyAsync con `ignoreExpiration: true` para obtener el payload de un token expirado
        const payload = await this.jwtService.verifyAsync(oldToken, {
            secret: jwtConstants.secret,
            ignoreExpiration: true, // Permite obtener el payload incluso si está vencido
        });

        // Asegurarse de que el usuario todavía existe y está activo
        const user = await this.usersService.findById(payload.sub);
        if (!user || user.alta === false) { 
             throw new UnauthorizedException('Usuario deshabilitado o no encontrado');
        }

        // Crear un nuevo payload con los datos necesarios (sub, username, perfil)
        const newPayload = {
            sub: user._id.toString(),
            username: user.username,
            perfil: user.perfil
        };
        
        // Generar un nuevo token con el vencimiento de 15m (definido en auth.module.ts)
        return {
            access_token: await this.jwtService.signAsync(newPayload),
        };

    } catch (error) {
        // Si el token es inválido (no solo expirado), lanzar 401
        throw new UnauthorizedException('Token inválido');
    }
  }
}