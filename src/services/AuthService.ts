// src/services/AuthService.ts
import prisma from '../prisma';
import { UserType, Usuario } from '@prisma/client';
import { comparePassword, generateToken, hashPassword } from '../utils/helpers';

class AuthService {
  async checkEmail(email: string) {
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      status: user.status,  // true/false
      tipo: user.tipo,      // CLIENTE / VENDEDOR / ADMIN
    };
  }
  
  async register(data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    tipo?: UserType; // CLIENTE | VENDEDOR | ADMIN
  }) {
    const existing = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('E-mail já cadastrado');
    }

    const hashed = await hashPassword(data.senha);

    const user = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: hashed,
        telefone: data.telefone ?? null,
        // se não vier tipo, usa o default lógico do sistema
        tipo: data.tipo ?? UserType.CLIENTE,
        // status e dataCriacao já têm default no schema
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    const { senha, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async login(email: string, senha: string) {
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Se o usuário estiver desativado, bloqueia o login
    if (!user.status) {
      throw new Error('Usuário desativado');
    }

    const ok = await comparePassword(senha, user.senha);
    if (!ok) {
      throw new Error('Credenciais inválidas');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    const { senha: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async getProfile(userId: number) {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { senha, ...safeUser } = user;
    return safeUser;
  }
}

export default new AuthService();
