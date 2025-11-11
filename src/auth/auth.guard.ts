import {
  CanActivate,          // Interfaz que debe implementar cualquier Guard
  ExecutionContext,     // Proporciona detalles sobre la solicitud entrante (request, response, etc.)
  Injectable,           // Permite que NestJS inyecte dependencias (como JwtService)
  UnauthorizedException,// Excepción estándar para errores 401 (No autorizado)
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // Servicio para manejar JWT (verificar, firmar)
import { jwtConstants } from './constants'; // Importa las constantes (como la clave secreta)
import { Request } from 'express'; // Tipado para el objeto Request de Express

@Injectable() // Marca la clase para que pueda ser gestionada por el sistema de inyección de dependencias de NestJS
export class AuthGuard implements CanActivate {
  // Inyectamos JwtService en el constructor para poder usarlo dentro de la clase
  constructor(private jwtService: JwtService) { }

  /**
   * Método principal del Guard. Decide si la solicitud actual tiene permiso para continuar.
   * @param context El contexto de ejecución actual (contiene el objeto request).
   * @returns Una promesa que resuelve a `true` si la solicitud está autorizada, o lanza `UnauthorizedException` si no lo está.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtenemos el objeto 'request' (la solicitud HTTP entrante) desde el contexto
    const request = context.switchToHttp().getRequest();
    // Extraemos el token JWT del encabezado 'Authorization' de la solicitud
    const token = this.extractTokenFromHeader(request);

    // Si no se encontró ningún token en el encabezado...
    if (!token) {
      // Lanzamos una excepción indicando que el usuario no está autorizado (error 401)
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    try {
      // Verificamos el token usando JwtService.
      // Esto comprueba si la firma es válida y si el token no ha expirado.
      // Usamos la clave secreta definida en nuestras constantes.
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret // La clave secreta para verificar la firma del token
        }
      );

      // 💡 Si la verificación es exitosa, el 'payload' contiene la información
      //    que se incluyó al crear el token (ej: userId, username).
      //    Asignamos este payload al objeto 'request' (bajo la clave 'user').
      //    Esto permite que los controladores de ruta accedan fácilmente
      //    a la información del usuario autenticado (ej: @Request() req -> req.user).
      request['user'] = payload;

    } catch (error) {
      // Si jwtService.verifyAsync lanza un error (ej: token inválido, expirado, firma incorrecta)...
      // Lanzamos una excepción indicando que el usuario no está autorizado (error 401)
      // Podrías loggear el 'error' aquí si necesitas depurar problemas con los tokens
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Si llegamos hasta aquí, significa que el token es válido.
    // Devolvemos 'true' para permitir que la solicitud continúe hacia el controlador.
    return true;
  }

  /**
   * Función auxiliar para extraer el token JWT del encabezado 'Authorization'.
   * Espera el formato "Bearer <token>".
   * @param request El objeto de solicitud HTTP.
   * @returns El token (string) si se encuentra y tiene el formato correcto, o `undefined` si no.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    // Obtenemos el valor del encabezado 'Authorization'. Si no existe, usamos '?? []' para evitar errores.
    // Usamos ?. (optional chaining) por si 'authorization' no existe.
    // Hacemos split(' ') para separar "Bearer" del token.
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    // Verificamos si el tipo es 'Bearer' (ignorando mayúsculas/minúsculas podría ser más robusto, pero aquí es estricto).
    // Si es 'Bearer', devolvemos el token; si no, devolvemos undefined.
    return type === 'Bearer' ? token : undefined;
  }
}

// (10) FILES_ORDER: 10) src/auth/auth.guard.ts