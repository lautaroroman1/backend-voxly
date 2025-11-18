import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.user, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getUpdatedProfile(req.user.sub);
  }

  // [NUEVA RUTA] Ruta autorizar (POST)
  @HttpCode(HttpStatus.OK)
  @Post('autorizar')
  async authorize(@Body('token') token: string) {
    // La lógica de validación se delega al servicio y lanza 401 si falla
    return this.authService.autorizarToken(token);
  }

  // [NUEVA RUTA] Ruta refrescar (POST)
  @HttpCode(HttpStatus.OK)
  @Post('refrescar')
  async refreshToken(@Body('token') token: string) {
    // Devuelve un nuevo access_token
    return this.authService.refrescarToken(token);
  }
}
