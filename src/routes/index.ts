// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import lojaRoutes from './lojaRoutes';
import produtoRoutes from './produtoRoutes';
import pedidoRoutes from './pedidoRoutes';  // 👈 importa as rotas de pedidos

const router = Router();

router.use('/auth', authRoutes);
router.use('/lojas', lojaRoutes);
router.use('/produtos', produtoRoutes);
router.use('/pedidos', pedidoRoutes);      // 👈 registra /api/pedidos/...

export default router;
