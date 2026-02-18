import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../../models/User.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.use(requireAdmin);

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await UserModel.findAll();
    res.json(users);
  })
);

usersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    });
  })
);

usersRouter.post(
  '/',
  body('email').isEmail(),
  body('name').isString().notEmpty(),
  body('password').isString().isLength({ min: 8 }),
  body('role').optional().isIn(['ADMIN', 'USER']),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const existing = await UserModel.findByEmail(req.body.email);
    if (existing) {
      throw new AppError(409, 'Email already exists');
    }

    const user = await UserModel.create(req.body);
    res.status(201).json(user);
  })
);

usersRouter.patch(
  '/:id',
  body('name').optional().isString().notEmpty(),
  body('role').optional().isIn(['ADMIN', 'USER']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    if (req.params.id === req.user!.id && req.body.role === 'USER') {
      throw new AppError(400, 'Cannot demote yourself');
    }

    const user = await UserModel.update(req.params.id, req.body);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json(user);
  })
);

usersRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, 'Cannot delete yourself');
    }

    const deleted = await UserModel.delete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'User not found');
    }
    res.status(204).send();
  })
);

usersRouter.post(
  '/:id/reset-password',
  body('newPassword').isString().isLength({ min: 8 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const updated = await UserModel.updatePassword(req.params.id, req.body.newPassword);
    if (!updated) {
      throw new AppError(404, 'User not found');
    }
    res.json({ message: 'Password reset successfully' });
  })
);
