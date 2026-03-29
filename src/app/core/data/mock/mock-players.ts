import { Player } from '../../models';

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', firstName: 'Martín', lastName: 'García', email: 'martin@test.com', phone: '+5491155001234', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 150, isActive: true, createdAt: '2025-06-01' },
  { id: 'p2', firstName: 'Lucas', lastName: 'Rodríguez', email: 'lucas@test.com', phone: '+5491155005678', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 120, isActive: true, createdAt: '2025-06-15' },
  { id: 'p3', firstName: 'Sofía', lastName: 'López', email: 'sofia@test.com', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', ranking: 200, isActive: true, createdAt: '2025-07-01' },
  { id: 'p4', firstName: 'Valentina', lastName: 'Martínez', email: 'valentina@test.com', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', ranking: 180, isActive: true, createdAt: '2025-07-10' },
  { id: 'p5', firstName: 'Diego', lastName: 'Fernández', email: 'diego@test.com', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 95, isActive: true, createdAt: '2025-08-01' },
  { id: 'p6', firstName: 'Nicolás', lastName: 'Pérez', email: 'nicolas@test.com', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 110, isActive: true, createdAt: '2025-08-15' },
  { id: 'p7', firstName: 'Camila', lastName: 'Torres', email: 'camila@test.com', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', ranking: 160, isActive: true, createdAt: '2025-09-01' },
  { id: 'p8', firstName: 'Joaquín', lastName: 'Sánchez', email: 'joaquin@test.com', categoryId: 'cat3', categoryName: '6ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 75, isActive: true, createdAt: '2025-09-15' },
  { id: 'p9', firstName: 'María', lastName: 'González', email: 'maria@test.com', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', ranking: 140, isActive: true, createdAt: '2025-10-01' },
  { id: 'p10', firstName: 'Tomás', lastName: 'Ramírez', email: 'tomas@test.com', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', ranking: 130, isActive: true, createdAt: '2025-10-15' }
];
