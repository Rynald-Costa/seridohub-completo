// src/controllers/PedidoController.ts
import { Request, Response } from 'express';
import { PedidoService } from '../services/PedidoService';

class PedidoController {
  // Lista pedidos das lojas do vendedor logado
  async listByVendedor(req: Request, res: Response) {
    try {
      // 👇 aceita tanto req.usuario quanto req.user
      const usuario = (req as any).usuario || (req as any).user;

      if (!usuario || !usuario.id) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const vendedorId = Number(usuario.id);
      const pedidos = await PedidoService.listarPedidosPorVendedor(vendedorId);

      if (!pedidos || pedidos.length === 0) {
        // 204 = sem conteúdo (front trata como "sem pedidos")
        return res.status(204).send();
      }

      return res.json(pedidos);
    } catch (error: any) {
      console.error('Erro ao listar pedidos do vendedor:', error);
      return res.status(500).json({
        message: 'Erro ao listar pedidos do vendedor.',
        error: error.message || String(error),
      });
    }
  }

  // Detalhes de um pedido específico
  async getById(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario || (req as any).user;
      const pedidoId = Number(req.params.id);

      if (!usuario || !usuario.id) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      if (Number.isNaN(pedidoId)) {
        return res.status(400).json({ message: 'ID de pedido inválido.' });
      }

      const pedido = await PedidoService.buscarPorIdParaVendedor({
        pedidoId,
        vendedorId: Number(usuario.id),
      });

      if (!pedido) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }

      return res.json(pedido);
    } catch (error: any) {
      console.error('Erro ao buscar pedido:', error);
      return res.status(500).json({
        message: 'Erro ao buscar pedido.',
        error: error.message || String(error),
      });
    }
  }

  // Atualizar status de um pedido
  async updateStatus(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario || (req as any).user;
      const pedidoId = Number(req.params.id);
      const { status } = req.body;

      if (!usuario || !usuario.id) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      if (Number.isNaN(pedidoId)) {
        return res.status(400).json({ message: 'ID de pedido inválido.' });
      }

      if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório.' });
      }

      const pedidoAtualizado = await PedidoService.atualizarStatus({
        pedidoId,
        vendedorId: Number(usuario.id),
        status,
      });

      return res.json(pedidoAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar status do pedido:', error);

      if (error.code === 'FORBIDDEN') {
        return res.status(403).json({ message: 'Você não pode alterar este pedido.' });
      }

      return res.status(500).json({
        message: 'Erro ao atualizar status do pedido.',
        error: error.message || String(error),
      });
    }
  }
}

export default new PedidoController();
