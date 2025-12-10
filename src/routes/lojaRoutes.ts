// src/routes/lojaRoutes.ts
import { Router } from 'express';
import LojaController from '../controllers/LojaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * Rotas públicas
 */

// lista todas as lojas (público)
router.get('/', LojaController.list.bind(LojaController));

// produtos da loja (público)
router.get('/:id/produtos', LojaController.getProdutos.bind(LojaController));

/**
 * Rotas que exigem autenticação de vendedor
 */

// loja única do vendedor logado (1 vendedor -> 1 loja)
router.get(
  '/minha',
  authMiddleware,
  LojaController.getMinhaLoja.bind(LojaController)
);

// (opcional) lista de lojas do vendedor – hoje na prática sempre 0 ou 1
router.get(
  '/minhas',
  authMiddleware,
  LojaController.getMinhasLojas.bind(LojaController)
);

// detalhes de uma loja por ID (precisa vir DEPOIS de /minha e /minhas)
router.get('/:id', LojaController.getById.bind(LojaController));

// cadastro de loja (apenas vendedor autenticado)
router.post('/', authMiddleware, LojaController.create.bind(LojaController));

// atualização de loja (apenas dono da loja)
router.put('/:id', authMiddleware, LojaController.update.bind(LojaController));

export default router;
