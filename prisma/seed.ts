import { PrismaClient } from '@prisma/client';
import { logger } from './src/shared/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.$executeRaw`TRUNCATE TABLE "content_interaction_logs" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "user_tips_history" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "content_progress" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "content_topics" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "tips" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "content" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "topics" CASCADE`;

  logger.info('🗑️  Cleared existing data');

  // Create topics
  const topics = await prisma.topics.createMany({
    data: [
      { name: 'Matemáticas', description: 'Contenido relacionado con matemáticas' },
      { name: 'Ciencias', description: 'Contenido relacionado con ciencias' },
      { name: 'Historia', description: 'Contenido relacionado con historia' },
      { name: 'Literatura', description: 'Contenido relacionado con literatura' },
      { name: 'Programación', description: 'Contenido relacionado con programación' },
    ],
    skipDuplicates: true,
  });

  logger.info(`📚 Created ${topics.count} topics`);

  // Get topic IDs
  const mathTopic = await prisma.topics.findFirst({ where: { name: 'Matemáticas' } });
  const scienceTopic = await prisma.topics.findFirst({ where: { name: 'Ciencias' } });
  const historyTopic = await prisma.topics.findFirst({ where: { name: 'Historia' } });
  const literatureTopic = await prisma.topics.findFirst({ where: { name: 'Literatura' } });
  const programmingTopic = await prisma.topics.findFirst({ where: { name: 'Programación' } });

  // Create content
  const contents = await prisma.content.createMany({
    data: [
      {
        title: 'Introducción al Álgebra',
        description: 'Conceptos básicos de álgebra para principiantes',
        content_type: 'ARTICLE',
        difficulty_level: 'BEGINNER',
        estimated_reading_time: 15,
        content: JSON.stringify({
          sections: [
            { title: '¿Qué es el álgebra?', content: 'El álgebra es una rama de las matemáticas...' },
            { title: 'Ecuaciones básicas', content: 'Una ecuación es una igualdad entre dos expresiones...' },
          ],
        }),
        status: 'PUBLISHED',
        published_at: new Date(),
      },
      {
        title: 'El Ciclo del Agua',
        description: 'Explicación detallada del ciclo hidrológico',
        content_type: 'VIDEO',
        difficulty_level: 'INTERMEDIATE',
        estimated_reading_time: 10,
        content: JSON.stringify({
          video_url: 'https://example.com/videos/ciclo-agua',
          transcript: 'El ciclo del agua es el proceso de circulación del agua...',
        }),
        status: 'PUBLISHED',
        published_at: new Date(),
      },
      {
        title: 'Revolución Francesa',
        description: 'Un análisis detallado de la Revolución Francesa',
        content_type: 'ARTICLE',
        difficulty_level: 'ADVANCED',
        estimated_reading_time: 25,
        content: JSON.stringify({
          sections: [
            { title: 'Causas', content: 'Las causas de la Revolución Francesa fueron múltiples...' },
            { title: 'Desarrollo', content: 'El desarrollo de la revolución puede dividirse en varias fases...' },
          ],
        }),
        status: 'PUBLISHED',
        published_at: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  logger.info(`📝 Created ${contents.count} content items`);

  // Get content IDs
  const algebraContent = await prisma.content.findFirst({ where: { title: 'Introducción al Álgebra' } });
  const waterCycleContent = await prisma.content.findFirst({ where: { title: 'El Ciclo del Agua' } });
  const revolutionContent = await prisma.content.findFirst({ where: { title: 'Revolución Francesa' } });

  // Associate content with topics
  if (algebraContent && mathTopic) {
    await prisma.content_topics.create({
      data: {
        content_id: algebraContent.id,
        topic_id: mathTopic.id,
        is_primary: true,
      },
    });
  }

  if (waterCycleContent && scienceTopic) {
    await prisma.content_topics.create({
      data: {
        content_id: waterCycleContent.id,
        topic_id: scienceTopic.id,
        is_primary: true,
      },
    });
  }

  if (revolutionContent && historyTopic) {
    await prisma.content_topics.create({
      data: {
        content_id: revolutionContent.id,
        topic_id: historyTopic.id,
        is_primary: true,
      },
    });
  }

  // Create some user progress
  if (algebraContent) {
    await prisma.content_progress.create({
      data: {
        user_id: 'user-1',
        content_id: algebraContent.id,
        progress_percentage: 75,
        last_accessed: new Date(),
        completed: false,
      },
    });
  }

  // Create some tips
  await prisma.tips.createMany({
    data: [
      {
        title: 'Consejo de estudio',
        description: 'Toma descansos regulares para mejorar la retención',
        content_type: 'STUDY_TIP',
        status: 'ACTIVE',
      },
      {
        title: 'Consejo de motivación',
        description: 'Recuerda que el aprendizaje es un viaje, no una carrera',
        content_type: 'MOTIVATIONAL_TIP',
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });

  logger.info('✅ Database seeding completed');
}

main()
  .catch((e) => {
    logger.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
