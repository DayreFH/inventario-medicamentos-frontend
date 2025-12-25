import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validación
const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

// GET /users - Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Remover contraseñas del resultado
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.json({ data: usersWithoutPassword });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// GET /users/:id - Obtener un usuario
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// POST /users - Crear usuario
router.post('/', async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        roleId: validatedData.roleId || null,
        isActive: validatedData.isActive !== false
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const { password, ...userWithoutPassword } = user;
    res.status(201).json({ data: userWithoutPassword, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
});

// PUT /users/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Si se envía contraseña, hashearla
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const { password, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
});

// DELETE /users/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});

export default router;


