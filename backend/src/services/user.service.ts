import { prisma } from '../config/prisma';
import type { PublicUser } from '../types/auth';
import { serializeUser } from '../utils/serializers';

export const userService = {
  listStaff: async (): Promise<PublicUser[]> => {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['ADMIN', 'AGENT'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    return users.map(serializeUser);
  },
};
