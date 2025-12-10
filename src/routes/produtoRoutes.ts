// src/routes/produtoRoutes.ts
import { Router } from 'express';
import ProdutoController from '../controllers/ProdutoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * ROTAS DO VENDEDOR
 * (precisam vir ANTES das rotas públicas com :id mais genéricas)
 */

// lista produtos da loja do vendedor logado
router.get(
  '/minha-loja',
  authMiddleware,
  ProdutoController.listMine.bind(ProdutoController)
);

// cadastra novo produto para a loja do vendedor logado
router.post(
  '/',
  authMiddleware,
  ProdutoController.createForSeller.bind(ProdutoController)
);

// atualizar produto da loja do vendedor logado
router.put(
  '/:id',
  authMiddleware,
  ProdutoController.updateForSeller.bind(ProdutoController)
);

// 🔴 NOVO: remover produto da loja do vendedor logado
router.delete(
  '/:id',
  authMiddleware,
  ProdutoController.deleteForSeller.bind(ProdutoController)
);

/**
 * ROTAS PÚBLICAS
 */

// lista geral de produtos (usado na home)
router.get('/', ProdutoController.listAll.bind(ProdutoController));

// produtos de uma loja específica (usado em produtos.html)
router.get('/loja/:lojaId', ProdutoController.listByLoja.bind(ProdutoController));

// detalhes de um produto (usado em produto.html)
router.get('/:id', ProdutoController.getById.bind(ProdutoController));

export default router;
