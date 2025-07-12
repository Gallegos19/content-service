import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.$executeRaw`TRUNCATE TABLE "ContentInteractionLog" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "UserTipsHistory" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ContentProgress" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ContentTopic" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Tip" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Content" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Topic" CASCADE`;

  logger.info('🗑️  Cleared existing data');

  // Create topics
  const topics = await prisma.topic.createMany({
    data: [
      { 
        name: 'Matemáticas', 
        description: 'Contenido relacionado con matemáticas',
        slug: 'matematicas',
        difficulty_level: 'BEGINNER',
        target_age_min: 8,
        target_age_max: 18,
        is_active: true,
        sort_order: 1,
        color_hex: '#4CAF50'
      },
      { 
        name: 'Ciencias', 
        description: 'Contenido relacionado con ciencias',
        slug: 'ciencias',
        difficulty_level: 'BEGINNER',
        target_age_min: 8,
        target_age_max: 18,
        is_active: true,
        sort_order: 2,
        color_hex: '#2196F3'
      },
      { 
        name: 'Historia', 
        description: 'Contenido relacionado con historia',
        slug: 'historia',
        difficulty_level: 'BEGINNER',
        target_age_min: 10,
        target_age_max: 18,
        is_active: true,
        sort_order: 3,
        color_hex: '#FF9800'
      },
      { 
        name: 'Literatura', 
        description: 'Contenido relacionado con literatura',
        slug: 'literatura',
        difficulty_level: 'BEGINNER',
        target_age_min: 12,
        target_age_max: 18,
        is_active: true,
        sort_order: 4,
        color_hex: '#9C27B0'
      },
      { 
        name: 'Programación', 
        description: 'Contenido relacionado con programación',
        slug: 'programacion',
        difficulty_level: 'INTERMEDIATE',
        target_age_min: 14,
        target_age_max: 25,
        is_active: true,
        sort_order: 5,
        color_hex: '#607D8B'
      },
    ],
    skipDuplicates: true,
  });

  logger.info(`📚 Created ${topics.count} topics`);

  // Get topic IDs
  const mathTopic = await prisma.topic.findFirst({ where: { name: 'Matemáticas' } });
  const scienceTopic = await prisma.topic.findFirst({ where: { name: 'Ciencias' } });
  const historyTopic = await prisma.topic.findFirst({ where: { name: 'Historia' } });
  const literatureTopic = await prisma.topic.findFirst({ where: { name: 'Literatura' } });
  const programmingTopic = await prisma.topic.findFirst({ where: { name: 'Programación' } });

  // Create content
  const contents = await prisma.content.createMany({
    data: [
      {
        title: 'Introducción al Álgebra',
        description: 'Conceptos básicos de álgebra para principiantes',
        content_type: 'ARTICLE',
        difficulty_level: 'BEGINNER',
        target_age_min: 12,
        target_age_max: 16,
        reading_time_minutes: 15,
        duration_minutes: null,
        is_downloadable: false,
        is_featured: true,
        view_count: 0,
        completion_count: 0,
        rating_average: 0,
        rating_count: 0,
        metadata: JSON.stringify({
          sections: [
            { title: '¿Qué es el álgebra?', content: 'El álgebra es una rama de las matemáticas...' },
            { title: 'Ecuaciones básicas', content: 'Una ecuación es una igualdad entre dos expresiones...' },
          ],
        }),
        is_published: true,
        published_at: new Date(),
      },
      {
        title: 'El Ciclo del Agua',
        description: 'Explicación detallada del ciclo hidrológico',
        content_type: 'VIDEO',
        difficulty_level: 'INTERMEDIATE',
        target_age_min: 10,
        target_age_max: 14,
        reading_time_minutes: null,
        duration_minutes: 10,
        is_downloadable: true,
        is_featured: false,
        view_count: 0,
        completion_count: 0,
        rating_average: 0,
        rating_count: 0,
        metadata: JSON.stringify({
          video_url: 'https://example.com/videos/ciclo-agua',
          transcript: 'El ciclo del agua es el proceso de circulación del agua...',
        }),
        is_published: true,
        published_at: new Date(),
      },
      {
        title: 'Revolución Francesa',
        description: 'Un análisis detallado de la Revolución Francesa',
        content_type: 'ARTICLE',
        difficulty_level: 'ADVANCED',
        target_age_min: 16,
        target_age_max: 18,
        reading_time_minutes: 25,
        duration_minutes: null,
        is_downloadable: false,
        is_featured: true,
        view_count: 0,
        completion_count: 0,
        rating_average: 0,
        rating_count: 0,
        metadata: JSON.stringify({
          sections: [
            { title: 'Causas', content: 'Las causas de la Revolución Francesa fueron múltiples...' },
            { title: 'Desarrollo', content: 'El desarrollo de la revolución puede dividirse en varias fases...' },
          ],
        }),
        is_published: true,
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
    await prisma.contentTopic.create({
      data: {
        content_id: algebraContent.id,
        topic_id: mathTopic.id,
        is_primary: true,
      },
    });
  }

  if (waterCycleContent && scienceTopic) {
    await prisma.contentTopic.create({
      data: {
        content_id: waterCycleContent.id,
        topic_id: scienceTopic.id,
        is_primary: true,
      },
    });
  }

  if (revolutionContent && historyTopic) {
    await prisma.contentTopic.create({
      data: {
        content_id: revolutionContent.id,
        topic_id: historyTopic.id,
        is_primary: true,
      },
    });
  }

  // Create some user progress
  if (algebraContent) {
    await prisma.contentProgress.create({
      data: {
        user_id: 'user-1',
        content_id: algebraContent.id,
        status: 'in_progress',
        progress_percentage: 75,
        time_spent_seconds: 900,
        last_position_seconds: 0,
        first_accessed_at: new Date(),
        last_accessed_at: new Date(),
      },
    });
  }

  // Create some tips
  await prisma.tip.createMany({
    data: [
      {
        title: 'Consejo de estudio',
        content: 'Toma descansos regulares para mejorar la retención',
        tip_type: 'STUDY_TIP',
        target_age_min: 8,
        target_age_max: 18,
        difficulty_level: 'easy',
        action_required: false,
        impact_level: 'medium',
        is_active: true,
        usage_count: 0,
      },
      {
        title: 'Consejo de motivación',
        content: 'Recuerda que el aprendizaje es un viaje, no una carrera',
        tip_type: 'MOTIVATIONAL_TIP',
        target_age_min: 10,
        target_age_max: 25,
        difficulty_level: 'easy',
        action_required: false,
        impact_level: 'high',
        is_active: true,
        usage_count: 0,
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