import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding typo patterns...');

  const typoPatterns = [
    // Charizard variants
    { correctSpelling: 'Charizard', commonMisspelling: 'Charizaard', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Charizard', commonMisspelling: 'Charizzard', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Charizard', commonMisspelling: 'Charzard', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Charizard', commonMisspelling: 'Charazard', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Charizard', commonMisspelling: 'Chariard', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Charizard', commonMisspelling: 'Charizrd', category: 'cardName', levenshteinDistance: 1 },

    // Pikachu variants
    { correctSpelling: 'Pikachu', commonMisspelling: 'Pikachuu', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Pikachu', commonMisspelling: 'Pikchu', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Pikachu', commonMisspelling: 'Pikacu', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Pikachu', commonMisspelling: 'Pikahcu', category: 'cardName', levenshteinDistance: 1 },

    // Mewtwo variants
    { correctSpelling: 'Mewtwo', commonMisspelling: 'Mewto', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Mewtwo', commonMisspelling: 'Mewtoo', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Mewtwo', commonMisspelling: 'Mewtwoo', category: 'cardName', levenshteinDistance: 1 },

    // Blastoise variants
    { correctSpelling: 'Blastoise', commonMisspelling: 'Blastois', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Blastoise', commonMisspelling: 'Blastiose', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Blastoise', commonMisspelling: 'Blastose', category: 'cardName', levenshteinDistance: 1 },

    // Venusaur variants
    { correctSpelling: 'Venusaur', commonMisspelling: 'Venasaur', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Venusaur', commonMisspelling: 'Venusuar', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Venusaur', commonMisspelling: 'Vensaur', category: 'cardName', levenshteinDistance: 1 },

    // Gyarados variants
    { correctSpelling: 'Gyarados', commonMisspelling: 'Gyrados', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Gyarados', commonMisspelling: 'Gyardos', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Gyarados', commonMisspelling: 'Garados', category: 'cardName', levenshteinDistance: 2 },

    // Dragonite variants
    { correctSpelling: 'Dragonite', commonMisspelling: 'Dragonit', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Dragonite', commonMisspelling: 'Dragonnite', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Dragonite', commonMisspelling: 'Dragnite', category: 'cardName', levenshteinDistance: 1 },

    // Lugia variants
    { correctSpelling: 'Lugia', commonMisspelling: 'Lugai', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Lugia', commonMisspelling: 'Luiga', category: 'cardName', levenshteinDistance: 1 },

    // Rayquaza variants
    { correctSpelling: 'Rayquaza', commonMisspelling: 'Rayquasa', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Rayquaza', commonMisspelling: 'Rayquazza', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Rayquaza', commonMisspelling: 'Raquaza', category: 'cardName', levenshteinDistance: 1 },

    // Umbreon variants
    { correctSpelling: 'Umbreon', commonMisspelling: 'Umbroen', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Umbreon', commonMisspelling: 'Umbrean', category: 'cardName', levenshteinDistance: 1 },

    // Alakazam variants
    { correctSpelling: 'Alakazam', commonMisspelling: 'Alakzam', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Alakazam', commonMisspelling: 'Alkazam', category: 'cardName', levenshteinDistance: 1 },

    // Gengar variants
    { correctSpelling: 'Gengar', commonMisspelling: 'Genger', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Gengar', commonMisspelling: 'Genger', category: 'cardName', levenshteinDistance: 1 },

    // Garchomp variants
    { correctSpelling: 'Garchomp', commonMisspelling: 'Garchopm', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Garchomp', commonMisspelling: 'Garchom', category: 'cardName', levenshteinDistance: 1 },

    // Sylveon variants
    { correctSpelling: 'Sylveon', commonMisspelling: 'Slyveon', category: 'cardName', levenshteinDistance: 1 },
    { correctSpelling: 'Sylveon', commonMisspelling: 'Sylvon', category: 'cardName', levenshteinDistance: 1 },

    // Set name typos
    { correctSpelling: 'Evolving Skies', commonMisspelling: 'Evovling Skies', category: 'setName', levenshteinDistance: 1 },
    { correctSpelling: 'Brilliant Stars', commonMisspelling: 'Brillant Stars', category: 'setName', levenshteinDistance: 1 },
    { correctSpelling: 'Vivid Voltage', commonMisspelling: 'Vivd Voltage', category: 'setName', levenshteinDistance: 1 },
    { correctSpelling: 'Shining Fates', commonMisspelling: 'Shinning Fates', category: 'setName', levenshteinDistance: 1 },
  ];

  for (const pattern of typoPatterns) {
    await prisma.typoPattern.upsert({
      where: { commonMisspelling: pattern.commonMisspelling },
      update: pattern,
      create: pattern
    });
  }

  console.log(`Seeded ${typoPatterns.length} typo patterns`);
  console.log('Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
