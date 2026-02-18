import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../../models/User.js';
import { config } from '../../config/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user || !(await UserModel.verifyPassword(user, password))) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as string }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  })
);

authRouter.post(
  '/change-password',
  authenticate,
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8 }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user!.id);

    if (!user || !(await UserModel.verifyPassword(user, currentPassword))) {
      throw new AppError(401, 'Current password is incorrect');
    }

    await UserModel.updatePassword(user.id, newPassword);
    res.json({ message: 'Password updated successfully' });
  })
);
