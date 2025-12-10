// prisma/seed.ts
import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco...');

  // 1) Cria/garante alguns usuários vendedores
  const vendedor1 = await prisma.usuario.upsert({
    where: { email: 'vendedor1@seridohub.dev' },
    update: {},
    create: {
      nome: 'Vendedor 1 Mercado',
      email: 'vendedor1@seridohub.dev',
      senha: 'senha_fake_hash', // só pra ocupar o campo, login você testa com outros usuários
      telefone: '84999990001',
      tipo: UserType.VENDEDOR,
      status: true,
    },
  });

  const vendedor2 = await prisma.usuario.upsert({
    where: { email: 'vendedor2@seridohub.dev' },
    update: {},
    create: {
      nome: 'Vendedor 2 Padaria',
      email: 'vendedor2@seridohub.dev',
      senha: 'senha_fake_hash',
      telefone: '84999990002',
      tipo: UserType.VENDEDOR,
      status: true,
    },
  });

  console.log('✔ Vendedores prontos:', vendedor1.id, vendedor2.id);

  // 2) Remove lojas/produtos antigos ligados a esses vendedores (pra não dar conflito de unique)
  await prisma.produto.deleteMany({
    where: { loja: { usuarioId: { in: [vendedor1.id, vendedor2.id] } } },
  });
  await prisma.loja.deleteMany({
    where: { usuarioId: { in: [vendedor1.id, vendedor2.id] } },
  });

  // 3) Cria lojas para esses vendedores
  const loja1 = await prisma.loja.create({
    data: {
      nome: 'Mercadinho São João',
      descricao:
        'Mercado de bairro com variedade em hortifruti, mercearia e produtos de limpeza.',
      usuarioId: vendedor1.id,
    },
  });

  const loja2 = await prisma.loja.create({
    data: {
      nome: 'Padaria Pão Quentinho',
      descricao:
        'Pães, bolos, salgados e lanches especiais, tudo sempre fresquinho.',
      usuarioId: vendedor2.id,
    },
  });

  console.log('✔ Lojas criadas:', loja1.id, loja2.id);

  // 4) Cria alguns produtos para cada loja
  await prisma.produto.createMany({
    data: [
      {
        nome: 'Arroz Branco 5kg',
        descricao: 'Arroz tipo 1, ideal para o dia a dia.',
        preco: 24.9,
        estoque: 50,
        imagemUrl: null,
        lojaId: loja1.id,
      },
      {
        nome: 'Feijão Carioca 1kg',
        descricao: 'Feijão selecionado, grãos inteiros.',
        preco: 9.5,
        estoque: 80,
        imagemUrl: null,
        lojaId: loja1.id,
      },
      {
        nome: 'Detergente Neutro 500ml',
        descricao: 'Limpeza eficiente para sua pia.',
        preco: 3.2,
        estoque: 100,
        imagemUrl: null,
        lojaId: loja1.id,
      },
      {
        nome: 'Pão Francês (Kg)',
        descricao: 'Pão fresquinho assado no dia.',
        preco: 19.9,
        estoque: 30,
        imagemUrl: null,
        lojaId: loja2.id,
      },
      {
        nome: 'Bolo de Chocolate',
        descricao: 'Bolo de chocolate caseiro, cobertura cremosa.',
        preco: 32.0,
        estoque: 10,
        imagemUrl: null,
        lojaId: loja2.id,
      },
      {
        nome: 'Coxinha de Frango',
        descricao: 'Coxinha recheada com frango temperado.',
        preco: 5.0,
        estoque: 60,
        imagemUrl: null,
        lojaId: loja2.id,
      },
    ],
  });

  console.log('✔ Produtos criados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🌱 Seed finalizado.');
  });
