// src/routes/authRoutes.ts
import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// bind para garantir o this, mesmo que hoje não use
router.post('/register', AuthController.register.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));
router.get('/me', authMiddleware, AuthController.me.bind(AuthController));
router.post('/check-email', AuthController.checkEmail.bind(AuthController));

export default router;
