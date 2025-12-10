// src/routes/pedidoRoutes.ts
import { Router } from 'express';
import PedidoController from '../controllers/PedidoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Pedidos recebidos nas lojas do vendedor logado
router.get(
  '/minha-loja',
  authMiddleware,
  PedidoController.listByVendedor.bind(PedidoController)
);

// Detalhes de um pedido específico (opcional)
router.get(
  '/:id',
  authMiddleware,
  PedidoController.getById.bind(PedidoController)
);

// Atualizar status do pedido
router.patch(
  '/:id/status',
  authMiddleware,
  PedidoController.updateStatus.bind(PedidoController)
);

export default router;
