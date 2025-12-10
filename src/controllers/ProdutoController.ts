// src/controllers/ProdutoController.ts
import { Request, Response } from 'express';
import ProdutoService from '../services/ProdutoService';

class ProdutoController {
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const produto = await ProdutoService.getById(id);
      return res.json(produto);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Produto não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar produto' });
    }
  }

  async listByLoja(req: Request, res: Response) {
    try {
      const lojaId = Number(req.params.lojaId);
      if (Number.isNaN(lojaId)) {
        return res.status(400).json({ message: 'ID de loja inválido' });
      }

      const produtos = await ProdutoService.listarPorLoja(lojaId);
      return res.json(produtos);
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Erro ao listar produtos da loja' });
    }
  }

  // ✅ GET /api/produtos → lista geral de produtos (para home)
  async listAll(req: Request, res: Response) {
    try {
      // pega ?search=Pizza, se vier
      const searchParam = req.query.search;
      const search =
        typeof searchParam === 'string' && searchParam.trim().length > 0
          ? searchParam.trim()
          : undefined;

      const produtos = await ProdutoService.listarTodos(search);
      return res.json(produtos);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao listar produtos' });
    }
  }

  // POST /api/produtos (vendedor) → cria novo produto
  async createForSeller(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const {
        nome,
        preco,
        descricao,
        imagemUrl,
        estoque,
        idCategoria,
        ativo,
      } = req.body;

      if (!nome || typeof nome !== 'string') {
        return res
          .status(400)
          .json({ message: 'Nome do produto é obrigatório' });
      }

      const precoNumber = Number(preco);
      if (!preco || Number.isNaN(precoNumber) || precoNumber <= 0) {
        return res.status(400).json({ message: 'Preço inválido' });
      }

      // --------- ESTOQUE ----------
      let estoqueNumber = 0;
      if (estoque !== undefined && estoque !== null && estoque !== '') {
        estoqueNumber = Number(estoque);
        if (Number.isNaN(estoqueNumber) || estoqueNumber < 0) {
          return res
            .status(400)
            .json({ message: 'Estoque inválido (deve ser zero ou maior)' });
        }
      }

      // --------- CATEGORIA (sempre number | null) ----------
      let idCategoriaNumber: number | null = null;
      if (idCategoria !== undefined && idCategoria !== null && idCategoria !== '') {
        const parsed = Number(idCategoria);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ message: 'Categoria inválida' });
        }
        idCategoriaNumber = parsed;
      }

      // --------- ATIVO ----------
      const ativoFlag = typeof ativo === 'boolean' ? ativo : true;

      const produto = await ProdutoService.criarParaVendedor({
        usuarioId: userId,
        nome,
        preco: precoNumber,
        descricao,
        imagemUrl,
        estoque: estoqueNumber,
        idCategoria: idCategoriaNumber, // <- number | null, nunca undefined
        ativo: ativoFlag,
      });

      return res.status(201).json(produto);
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ message: error.message || 'Erro ao cadastrar produto' });
    }
  }

  async deleteForSeller(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;
      const produtoId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      if (Number.isNaN(produtoId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      await ProdutoService.removerDoVendedor(userId, produtoId);

      // 204 = sucesso, sem corpo
      return res.status(204).send();
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ message: error.message || 'Erro ao remover produto' });
    }
  }

  // GET /api/produtos/minha-loja (vendedor)
  async listMine(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const result = await ProdutoService.listarDoVendedor(userId);
      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ message: error.message || 'Erro ao listar produtos' });
    }
  }

  // ✅ PUT /api/produtos/:id (vendedor) → atualizar produto da loja do vendedor logado
  async updateForSeller(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;
      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID do produto inválido' });
      }

      const {
        nome,
        descricao,
        preco,
        estoque,
        imagemUrl,
        idCategoria,
        ativo,
      } = req.body;

      if (!nome || typeof nome !== 'string') {
        return res
          .status(400)
          .json({ message: 'Nome do produto é obrigatório' });
      }

      const precoNumber = Number(preco);
      if (!preco && preco !== 0 || Number.isNaN(precoNumber) || precoNumber <= 0) {
        return res.status(400).json({ message: 'Preço inválido' });
      }

      const estoqueNumber = Number(estoque);
      if (Number.isNaN(estoqueNumber) || estoqueNumber < 0) {
        return res
          .status(400)
          .json({ message: 'Estoque inválido (deve ser zero ou maior)' });
      }

      const produtoAtualizado = await ProdutoService.atualizarParaVendedor({
        usuarioId: userId,
        produtoId: id,
        nome,
        descricao,
        preco: precoNumber,
        estoque: estoqueNumber,
        imagemUrl,
        idCategoria,
        ativo,
      });

      return res.json(produtoAtualizado);
    } catch (error: any) {
      console.error(error);

      if (
        error.message === 'Produto não encontrado' ||
        error.message === 'Produto não encontrado para este vendedor'
      ) {
        return res.status(404).json({ message: error.message });
      }

      return res
        .status(400)
        .json({ message: error.message || 'Erro ao atualizar produto' });
    }
  }
}

export default new ProdutoController();
