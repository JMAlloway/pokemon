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

  // Seed Phantasmal Flames set cards
  console.log('Seeding Phantasmal Flames set cards...');

  const phantasmalFlamesCards = [
    // Regular set (001-094)
    { cardNumber: '001/094', cardName: 'Bulbasaur', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '002/094', cardName: 'Ivysaur', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '003/094', cardName: 'Venusaur', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.50 },
    { cardNumber: '004/094', cardName: 'Charmander', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '005/094', cardName: 'Charmeleon', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '006/094', cardName: 'Charizard ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 18.50 },
    { cardNumber: '007/094', cardName: 'Squirtle', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '008/094', cardName: 'Wartortle', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '009/094', cardName: 'Blastoise ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 8.75 },
    { cardNumber: '010/094', cardName: 'Caterpie', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '011/094', cardName: 'Butterfree', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '012/094', cardName: 'Gastly', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '013/094', cardName: 'Haunter', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '014/094', cardName: 'Gengar ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 22.00 },
    { cardNumber: '015/094', cardName: 'Vulpix', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '016/094', cardName: 'Ninetales', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '017/094', cardName: 'Growlithe', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '018/094', cardName: 'Arcanine', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.00 },
    { cardNumber: '019/094', cardName: 'Poliwag', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '020/094', cardName: 'Poliwrath', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '021/094', cardName: 'Abra', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.15 },
    { cardNumber: '022/094', cardName: 'Kadabra', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.40 },
    { cardNumber: '023/094', cardName: 'Alakazam ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 6.50 },
    { cardNumber: '024/094', cardName: 'Machop', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '025/094', cardName: 'Machoke', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '026/094', cardName: 'Machamp', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 1.50 },
    { cardNumber: '027/094', cardName: 'Geodude', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '028/094', cardName: 'Golem', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '029/094', cardName: 'Magnemite', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '030/094', cardName: 'Magneton', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.40 },
    { cardNumber: '031/094', cardName: 'Eevee', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '032/094', cardName: 'Jolteon', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 1.00 },
    { cardNumber: '033/094', cardName: 'Flareon', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 1.00 },
    { cardNumber: '034/094', cardName: 'Vaporeon', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 1.00 },
    { cardNumber: '035/094', cardName: 'Dratini', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '036/094', cardName: 'Dragonair', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '037/094', cardName: 'Dragonite ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 12.00 },
    { cardNumber: '038/094', cardName: 'Mewtwo ex', rarity: 'Double Rare', cardType: 'Pokemon', marketPrice: 15.00 },
    { cardNumber: '039/094', cardName: 'Mew', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 4.50 },
    { cardNumber: '040/094', cardName: 'Pikachu', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '041/094', cardName: 'Raichu', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 1.50 },
    { cardNumber: '042/094', cardName: 'Snorlax', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.75 },
    { cardNumber: '043/094', cardName: 'Lapras', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.60 },
    { cardNumber: '044/094', cardName: 'Scyther', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '045/094', cardName: 'Pinsir', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '046/094', cardName: 'Magikarp', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.15 },
    { cardNumber: '047/094', cardName: 'Gyarados', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.50 },
    { cardNumber: '048/094', cardName: 'Chansey', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.40 },
    { cardNumber: '049/094', cardName: 'Kangaskhan', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '050/094', cardName: 'Mr. Mime', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '051/094', cardName: 'Jynx', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.25 },
    { cardNumber: '052/094', cardName: 'Electabuzz', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.40 },
    { cardNumber: '053/094', cardName: 'Magmar', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.35 },
    { cardNumber: '054/094', cardName: 'Tauros', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.30 },
    { cardNumber: '055/094', cardName: 'Porygon', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.15 },
    { cardNumber: '056/094', cardName: 'Omanyte', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '057/094', cardName: 'Omastar', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.40 },
    { cardNumber: '058/094', cardName: 'Kabuto', rarity: 'Common', cardType: 'Pokemon', marketPrice: 0.10 },
    { cardNumber: '059/094', cardName: 'Kabutops', rarity: 'Uncommon', cardType: 'Pokemon', marketPrice: 0.50 },
    { cardNumber: '060/094', cardName: 'Aerodactyl', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 1.75 },
    { cardNumber: '061/094', cardName: 'Articuno', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 3.00 },
    { cardNumber: '062/094', cardName: 'Zapdos', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.75 },
    { cardNumber: '063/094', cardName: 'Moltres', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.50 },
    { cardNumber: '064/094', cardName: 'Ditto', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 1.50 },
    // Trainer/Supporter/Item cards
    { cardNumber: '065/094', cardName: 'Professor Oak', rarity: 'Uncommon', cardType: 'Supporter', marketPrice: 0.50 },
    { cardNumber: '066/094', cardName: 'Bill', rarity: 'Common', cardType: 'Supporter', marketPrice: 0.15 },
    { cardNumber: '067/094', cardName: 'Potion', rarity: 'Common', cardType: 'Item', marketPrice: 0.10 },
    { cardNumber: '068/094', cardName: 'Switch', rarity: 'Common', cardType: 'Item', marketPrice: 0.10 },
    { cardNumber: '069/094', cardName: 'Energy Retrieval', rarity: 'Common', cardType: 'Item', marketPrice: 0.10 },
    { cardNumber: '070/094', cardName: 'Rare Candy', rarity: 'Uncommon', cardType: 'Item', marketPrice: 0.75 },
    { cardNumber: '071/094', cardName: 'Ultra Ball', rarity: 'Uncommon', cardType: 'Item', marketPrice: 0.60 },
    { cardNumber: '072/094', cardName: 'Nest Ball', rarity: 'Uncommon', cardType: 'Item', marketPrice: 0.40 },
    { cardNumber: '073/094', cardName: 'Pokemon Catcher', rarity: 'Uncommon', cardType: 'Item', marketPrice: 0.35 },
    { cardNumber: '074/094', cardName: 'Energy Switch', rarity: 'Common', cardType: 'Item', marketPrice: 0.10 },
    { cardNumber: '075/094', cardName: 'Professor Sycamore', rarity: 'Uncommon', cardType: 'Supporter', marketPrice: 0.50 },
    { cardNumber: '076/094', cardName: 'Dawn', rarity: 'Uncommon', cardType: 'Supporter', marketPrice: 0.75 },
    { cardNumber: '077/094', cardName: 'Cynthia', rarity: 'Uncommon', cardType: 'Supporter', marketPrice: 0.60 },
    { cardNumber: '078/094', cardName: 'Boss\'s Orders', rarity: 'Rare', cardType: 'Supporter', marketPrice: 1.50 },
    { cardNumber: '079/094', cardName: 'Phantom Gate', rarity: 'Rare', cardType: 'Stadium', marketPrice: 1.25 },
    { cardNumber: '080/094', cardName: 'Spectral Shrine', rarity: 'Uncommon', cardType: 'Stadium', marketPrice: 0.50 },
    // Energy cards
    { cardNumber: '081/094', cardName: 'Fire Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '082/094', cardName: 'Water Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '083/094', cardName: 'Grass Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '084/094', cardName: 'Lightning Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '085/094', cardName: 'Psychic Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '086/094', cardName: 'Fighting Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '087/094', cardName: 'Darkness Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '088/094', cardName: 'Metal Energy', rarity: 'Common', cardType: 'Energy', marketPrice: 0.10 },
    { cardNumber: '089/094', cardName: 'Dragon Energy', rarity: 'Uncommon', cardType: 'Energy', marketPrice: 0.50 },
    { cardNumber: '090/094', cardName: 'Double Turbo Energy', rarity: 'Uncommon', cardType: 'Energy', marketPrice: 0.60 },
    { cardNumber: '091/094', cardName: 'Phantom Energy', rarity: 'Rare', cardType: 'Energy', marketPrice: 1.50 },
    { cardNumber: '092/094', cardName: 'Espeon', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.00 },
    { cardNumber: '093/094', cardName: 'Umbreon', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 3.50 },
    { cardNumber: '094/094', cardName: 'Sylveon', rarity: 'Rare', cardType: 'Pokemon', marketPrice: 2.25 },
    // Secret Rares / Illustration Rares (above set number)
    { cardNumber: '095/094', cardName: 'Charizard ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 45.00 },
    { cardNumber: '096/094', cardName: 'Gengar ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 38.00 },
    { cardNumber: '097/094', cardName: 'Mewtwo ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 35.00 },
    { cardNumber: '098/094', cardName: 'Blastoise ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 22.00 },
    { cardNumber: '099/094', cardName: 'Dragonite ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 28.00 },
    { cardNumber: '100/094', cardName: 'Alakazam ex (Full Art)', rarity: 'Ultra Rare', cardType: 'Pokemon', marketPrice: 18.00 },
    { cardNumber: '101/094', cardName: 'Dawn (Full Art)', rarity: 'Ultra Rare', cardType: 'Supporter', marketPrice: 25.00 },
    { cardNumber: '102/094', cardName: 'Cynthia (Full Art)', rarity: 'Ultra Rare', cardType: 'Supporter', marketPrice: 20.00 },
    { cardNumber: '103/094', cardName: 'Charizard ex (Illustration Rare)', rarity: 'Illustration Rare', cardType: 'Pokemon', marketPrice: 85.00 },
    { cardNumber: '104/094', cardName: 'Gengar ex (Illustration Rare)', rarity: 'Illustration Rare', cardType: 'Pokemon', marketPrice: 65.00 },
    { cardNumber: '105/094', cardName: 'Mewtwo ex (Illustration Rare)', rarity: 'Illustration Rare', cardType: 'Pokemon', marketPrice: 72.00 },
    { cardNumber: '106/094', cardName: 'Umbreon (Illustration Rare)', rarity: 'Illustration Rare', cardType: 'Pokemon', marketPrice: 55.00 },
    { cardNumber: '107/094', cardName: 'Pikachu (Illustration Rare)', rarity: 'Illustration Rare', cardType: 'Pokemon', marketPrice: 40.00 },
    { cardNumber: '108/094', cardName: 'Charizard ex (Special Art Rare)', rarity: 'Special Art Rare', cardType: 'Pokemon', marketPrice: 185.00 },
    { cardNumber: '109/094', cardName: 'Gengar ex (Special Art Rare)', rarity: 'Special Art Rare', cardType: 'Pokemon', marketPrice: 120.00 },
    { cardNumber: '110/094', cardName: 'Mewtwo ex (Special Art Rare)', rarity: 'Special Art Rare', cardType: 'Pokemon', marketPrice: 150.00 },
    { cardNumber: '111/094', cardName: 'Dawn (Special Art Rare)', rarity: 'Special Art Rare', cardType: 'Supporter', marketPrice: 95.00 },
    { cardNumber: '112/094', cardName: 'Charizard ex (Hyper Rare)', rarity: 'Hyper Rare', cardType: 'Pokemon', marketPrice: 250.00 },
    { cardNumber: '113/094', cardName: 'Gengar ex (Hyper Rare)', rarity: 'Hyper Rare', cardType: 'Pokemon', marketPrice: 165.00 },
    { cardNumber: '114/094', cardName: 'Mewtwo ex (Hyper Rare)', rarity: 'Hyper Rare', cardType: 'Pokemon', marketPrice: 195.00 },
  ];

  let setCardCount = 0;
  for (const card of phantasmalFlamesCards) {
    await prisma.setCard.upsert({
      where: {
        setName_cardNumber: { setName: 'Phantasmal Flames', cardNumber: card.cardNumber }
      },
      update: {
        cardName: card.cardName,
        rarity: card.rarity,
        cardType: card.cardType,
        marketPrice: card.marketPrice,
        lastPriceUpdate: new Date(),
      },
      create: {
        setName: 'Phantasmal Flames',
        cardNumber: card.cardNumber,
        cardName: card.cardName,
        rarity: card.rarity,
        cardType: card.cardType,
        marketPrice: card.marketPrice,
        lastPriceUpdate: new Date(),
      }
    });
    setCardCount++;
  }

  console.log(`Seeded ${setCardCount} Phantasmal Flames set cards`);
  console.log('Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
