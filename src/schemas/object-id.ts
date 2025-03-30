import mongoose from 'mongoose';
import z from 'zod';

// Object ID Schema
const objectIDSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid request ID',
  }),
});

export default objectIDSchema;
