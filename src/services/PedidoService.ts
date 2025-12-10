// src/services/PedidoService.ts
import prisma from '../prisma';
import { StatusPedido } from '@prisma/client';

/**
 * Faz o mapeamento dos valores que vêm do front
 * para o enum StatusPedido do Prisma.
 *
 * No HTML você usa, por exemplo:
 *  - PENDENTE
 *  - EM_PREPARO      -> PREPARO
 *  - SAIU_PARA_ENTREGA -> A_CAMINHO
 *  - ENTREGUE
 *  - CANCELADO
 */
function mapFrontStatusToEnum(status: string): StatusPedido {
  switch (status) {
    case 'EM_PREPARO':
      return StatusPedido.PREPARO;
    case 'SAIU_PARA_ENTREGA':
      return StatusPedido.A_CAMINHO;
    case 'PENDENTE':
      return StatusPedido.PENDENTE;
    case 'ENTREGUE':
      return StatusPedido.ENTREGUE;
    case 'CANCELADO':
      return StatusPedido.CANCELADO;
    default:
      // fallback: tenta converter direto (se já vier no formato do enum)
      return status as StatusPedido;
  }
}

export class PedidoService {
  /**
   * Lista pedidos recebidos por um vendedor específico.
   * Busca pedidos que tenham ao menos um item de produto
   * de loja cujo dono é esse vendedor (Loja.usuarioId).
   */
  static async listarPedidosPorVendedor(idVendedor: number) {
    const pedidos = await prisma.pedido.findMany({
      where: {
        itens: {
          some: {
            produto: {
              loja: {
                usuarioId: idVendedor,
              },
            },
          },
        },
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: {
              include: {
                loja: true,
              },
            },
          },
        },
      },
      orderBy: {
        // campo correto conforme schema.prisma
        dataCriacao: 'desc',
      },
    });

    return pedidos;
  }

  /**
   * Busca um único pedido garantindo que ele pertence
   * a alguma loja do vendedor informado.
   */
  static async buscarPorIdParaVendedor(params: {
    pedidoId: number;
    vendedorId: number;
  }) {
    const { pedidoId, vendedorId } = params;

    const pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        itens: {
          some: {
            produto: {
              loja: {
                usuarioId: vendedorId,
              },
            },
          },
        },
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: {
              include: {
                loja: true,
              },
            },
          },
        },
      },
    });

    return pedido;
  }

  /**
   * Atualiza o status de um pedido, garantindo que o pedido
   * realmente pertence a uma loja desse vendedor.
   */
  static async atualizarStatus(params: {
    pedidoId: number;
    vendedorId: number;
    status: string; // vem como string do front
  }) {
    const { pedidoId, vendedorId, status } = params;

    // Converte string do front para o enum StatusPedido do Prisma
    const statusEnum: StatusPedido = mapFrontStatusToEnum(status);

    // Verifica se o pedido pertence ao vendedor
    const pedidoExistente = await this.buscarPorIdParaVendedor({
      pedidoId,
      vendedorId,
    });

    if (!pedidoExistente) {
      const error: any = new Error('Pedido não encontrado para este vendedor.');
      error.code = 'FORBIDDEN';
      throw error;
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        status: statusEnum, // 👈 agora é StatusPedido, não string
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: {
              include: {
                loja: true,
              },
            },
          },
        },
      },
    });

    return pedidoAtualizado;
  }
}
