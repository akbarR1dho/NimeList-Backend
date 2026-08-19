import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/UserModule/user/dto/create-user.dto';
import { UserService } from 'src/UserModule/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    private readonly configService: ConfigService,
  ) {}

  // Fungsi untuk validasi user
  async validateUser(email: string, password: string): Promise<any> {
    // Mencari user berdasarkan email
    const userResult = await this.usersService.findOneByEmail(email);
    const user = userResult?.data;

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    throw new BadRequestException('Invalid credentials');
  }

  // Fungsi untuk login
  async login(user: any) {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    const tokens = await this.getTokens(payload);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      message: 'login successful',
      data: tokens
    };
  }

  // Fungsi untuk generate token
  async getTokens(payload: any) {
    const secret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || secret;

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: secret,
        expiresIn: '20m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  // Fungsi untuk refresh token
  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET');
      const decoded = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const userResult = await this.usersService.getUserWithRefreshToken(decoded.userId);
      const user = userResult?.data;
      
      if (!user.refresh_token) {
        throw new BadRequestException('Access Denied');
      }

      const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.refresh_token);
      if (!isRefreshTokenMatching) {
        throw new BadRequestException('Access Denied');
      }

      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
      };

      const tokens = await this.getTokens(payload);
      await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

      return {
        message: 'token refreshed',
        data: tokens
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  // Fungsi untuk register
  async register(user: CreateUserDto) {
    await this.usersService.create(user);
    return { message: 'register successfully' };
  }
}
