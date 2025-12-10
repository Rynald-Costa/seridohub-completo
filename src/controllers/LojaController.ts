// src/controllers/LojaController.ts
import { Request, Response } from 'express';
import LojaService from '../services/LojaService';

class LojaController {
  // GET /api/lojas?search=Pizza
  async list(req: Request, res: Response) {
    try {
      const searchParam = req.query.search;
      const search =
        typeof searchParam === 'string' && searchParam.trim().length > 0
          ? searchParam.trim()
          : undefined;

      const lojas = await LojaService.listarLojas(search);
      return res.json(lojas);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao listar lojas' });
    }
  }

  // GET /api/lojas/:id
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const loja = await LojaService.getById(id);
      return res.json(loja);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Loja não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar loja' });
    }
  }

  // GET /api/lojas/:id/produtos
  async getProdutos(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const produtos = await LojaService.listarProdutosDaLoja(id);
      return res.json(produtos);
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Erro ao listar produtos da loja' });
    }
  }

  // GET /api/lojas/minha → loja única do vendedor logado (1:1)
  async getMinhaLoja(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const loja = await LojaService.buscarPorUsuario(Number(userId));

      if (!loja) {
        return res
          .status(404)
          .json({ message: 'Nenhuma loja encontrada para este vendedor' });
      }

      return res.json(loja);
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Erro ao buscar loja do vendedor' });
    }
  }

  // GET /api/lojas/minhas → compatível com a página minha_loja.js
  async getMinhasLojas(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const lojas = await LojaService.listarLojasDoVendedor(Number(userId));

      if (!lojas || lojas.length === 0) {
        return res
          .status(404)
          .json({ message: 'Nenhuma loja encontrada para este vendedor' });
      }

      return res.json(lojas);
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Erro ao buscar lojas do vendedor' });
    }
  }

  // POST /api/lojas → cadastro de loja pelo vendedor logado
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const {
        nome,
        descricao,
        endereco,
        telefone,
        imagemLogo,          // URL da logo / imagem da loja
        horarioAbertura,     // esperado "HH:mm"
        horarioFechamento,   // esperado "HH:mm"
      } = req.body;

      if (!nome || typeof nome !== 'string') {
        return res
          .status(400)
          .json({ message: 'Nome da loja é obrigatório' });
      }

      const loja = await LojaService.criarLoja({
        usuarioId: Number(userId),
        nome,
        descricao,
        endereco,
        telefone,
        imagemLogo,
        horarioAbertura,
        horarioFechamento,
      });

      return res.status(201).json(loja);
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ message: error.message || 'Erro ao criar loja' });
    }
  }

  // PUT /api/lojas/:id → atualizar dados da loja (somente dono)
  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number | undefined;
      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const {
        nome,
        descricao,
        endereco,
        telefone,
        imagemLogo,
        horarioAbertura,
        horarioFechamento,
        status, // opcional: 'PENDENTE' | 'APROVADA' | 'INATIVA'
      } = req.body;

      const lojaAtualizada = await LojaService.atualizarLoja({
        id,
        usuarioId: Number(userId),
        nome,
        descricao,
        endereco,
        telefone,
        imagemLogo,
        horarioAbertura,
        horarioFechamento,
        status,
      });

      return res.json(lojaAtualizada);
    } catch (error: any) {
      console.error(error);

      if (error.message === 'Loja não encontrada') {
        return res.status(404).json({ message: error.message });
      }

      if (error.message === 'Você não tem permissão para editar esta loja') {
        return res.status(403).json({ message: error.message });
      }

      return res
        .status(400)
        .json({ message: error.message || 'Erro ao atualizar loja' });
    }
  }
}

export default new LojaController();
