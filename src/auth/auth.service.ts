import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hash, verify } from 'argon2';
import { AuthDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // Sign up a single user
  async signup(dto: AuthDto) {
    // generate password hash
    const passwordHash = await hash(dto.password);

    try {
      // save new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash: passwordHash,
        },

        // Inclusive select
        // select: {
        //   email: true,
        //   id: true,
        //   createdAt: true,
        // },
      });

      // Exclusive "select"
      // Do not return the password hash
      delete user.hash;

      // return the saved user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Email already in use',
          );
        }
      }
      throw error;
    }
  }

  // Sign in a user
  async signin(dto: AuthDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // if not found, throw an error
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    // if found, compare the password hash
    const passwordMatches = await verify(
      user.hash,
      dto.password,
    );

    // if the password hash does not match, throw an error
    if (!passwordMatches) {
      throw new ForbiddenException('Invalid credentials');
    }

    // if the password hash matches, return the user
    delete user.hash;
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    return {
      access_token: this.jwt.sign(payload, {
        expiresIn: '15m',
        secret: this.config.get('JWT_SECRET'),
      }),
    };
  }
}
