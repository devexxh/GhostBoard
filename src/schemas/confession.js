import { z } from 'zod';

export const confessionSchema = z.object({
    title: z.string().min(3).max(80),
    body: z.string().min(10),
    mood: z.enum(['happy', 'sad', 'angry', 'confused', 'excited']),
    ghostId: z.uuid()
})