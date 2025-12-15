-- CreateTable
CREATE TABLE "enderecos" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "apelido" VARCHAR(60) NOT NULL,
    "destinatario" VARCHAR(120) NOT NULL,
    "telefone" VARCHAR(20),
    "cep" VARCHAR(10),
    "logradouro" VARCHAR(160) NOT NULL,
    "numero" VARCHAR(20),
    "bairro" VARCHAR(80),
    "cidade" VARCHAR(80),
    "uf" VARCHAR(2),
    "complemento" VARCHAR(160),
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualiza" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enderecos_id_usuario_idx" ON "enderecos"("id_usuario");

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
