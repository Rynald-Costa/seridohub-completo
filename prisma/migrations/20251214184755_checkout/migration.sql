/*
  Warnings:

  - Added the required column `id_loja` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'RECUSADO', 'ESTORNADO');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "id_loja" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "metodo" "FormaPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "valor" DECIMAL(10,2) NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_pago" TIMESTAMP(3),

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_id_pedido_key" ON "pagamentos"("id_pedido");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "itens_pedido_produtoId_idx" ON "itens_pedido"("produtoId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_id_loja_idx" ON "pedidos"("id_loja");

-- CreateIndex
CREATE INDEX "produtos_lojaId_idx" ON "produtos"("lojaId");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
