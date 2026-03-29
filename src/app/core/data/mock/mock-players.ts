import { Player } from '../../models';

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', firstName: 'Martín', lastName: 'García', email: 'martin@test.com', phone: '+5491155001234', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 150, isActive: true, createdAt: '2025-06-01' },
  { id: 'p2', firstName: 'Lucas', lastName: 'Rodríguez', email: 'lucas@test.com', phone: '+5491155005678', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 120, isActive: true, createdAt: '2025-06-15' },
  { id: 'p3', firstName: 'Sofía', lastName: 'López', email: 'sofia@test.com', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 200, isActive: true, createdAt: '2025-07-01' },
  { id: 'p4', firstName: 'Valentina', lastName: 'Martínez', email: 'valentina@test.com', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 180, isActive: true, createdAt: '2025-07-10' },
  { id: 'p5', firstName: 'Diego', lastName: 'Fernández', email: 'diego@test.com', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 95, isActive: true, createdAt: '2025-08-01' },
  { id: 'p6', firstName: 'Nicolás', lastName: 'Pérez', email: 'nicolas@test.com', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 110, isActive: true, createdAt: '2025-08-15' },
  { id: 'p7', firstName: 'Camila', lastName: 'Torres', email: 'camila@test.com', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 160, isActive: true, createdAt: '2025-09-01' },
  { id: 'p8', firstName: 'Joaquín', lastName: 'Sánchez', email: 'joaquin@test.com', categoryId: 'cat3', categoryName: '3ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 75, isActive: true, createdAt: '2025-09-15' },
  { id: 'p9', firstName: 'María', lastName: 'González', email: 'maria@test.com', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 140, isActive: true, createdAt: '2025-10-01' },
  { id: 'p10', firstName: 'Tomás', lastName: 'Ramírez', email: 'tomas@test.com', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 130, isActive: true, createdAt: '2025-10-15' },
  // Additional players not in any registration (selectable in wizard)
  { id: 'p11', firstName: 'Federico', lastName: 'Álvarez', email: 'fede@test.com', phone: '+5491155009001', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 88, isActive: true, createdAt: '2025-11-01' },
  { id: 'p12', firstName: 'Florencia', lastName: 'Díaz', email: 'flor@test.com', phone: '+5491155009002', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 175, isActive: true, createdAt: '2025-11-05' },
  { id: 'p13', firstName: 'Agustín', lastName: 'Herrera', email: 'agustin@test.com', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 102, isActive: true, createdAt: '2025-11-10' },
  { id: 'p14', firstName: 'Julieta', lastName: 'Castro', email: 'julieta@test.com', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 155, isActive: true, createdAt: '2025-11-15' },
  { id: 'p15', firstName: 'Mateo', lastName: 'Romero', email: 'mateo@test.com', categoryId: 'cat3', categoryName: '3ª', genderId: 'g1', genderLabel: 'Caballeros', ranking: 65, isActive: true, createdAt: '2025-11-20' },
  { id: 'p16', firstName: 'Catalina', lastName: 'Morales', email: 'catalina@test.com', phone: '+5491155009006', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas', ranking: 190, isActive: true, createdAt: '2025-11-25' }
];
