import User from '@/models/user';
import type { IUserProps } from '@/types';

export const findAndUpdateUser = async (userId: string, props: Partial<IUserProps>) =>
  await User.findByIdAndUpdate(userId, { ...props }, { new: true }).lean();
