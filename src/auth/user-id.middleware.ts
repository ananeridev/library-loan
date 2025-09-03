import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedRequest extends Request {
  userId: string;
  user: {
    id: string;
    userId: string;
  };
}

@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userIdHeader = req.headers['x-user-id'] as string;

    if (!userIdHeader) {
      throw new BadRequestException('Header x-user-id is required');
    }

    req.userId = userIdHeader;

    let user = await this.prisma.user.findUnique({
      where: { userId: userIdHeader },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { userId: userIdHeader },
      });
    }

    req.user = user;
    next();
  }
}
