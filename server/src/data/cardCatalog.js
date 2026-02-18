/**
 * Pokemon TCG Card Catalog
 *
 * Comprehensive card data for popular sets, organized by rarity.
 * Used for the cascading set → card picker in the search UI.
 *
 * Rarity tiers:
 *   common, uncommon, rare, ultraRare, illustrationRare,
 *   specialIllustrationRare, megaIllustrationRare
 */

const CARD_CATALOG = [
  // ─── Scarlet & Violet Era ──────────────────────────────────────────

  {
    name: 'Prismatic Evolutions',
    code: 'SV8.5',
    era: 'Scarlet & Violet',
    printedTotal: '091',
    cards: [
      // Common
      { name: 'Eevee', number: '054', rarity: 'common' },
      { name: 'Oddish', number: '001', rarity: 'common' },
      { name: 'Poliwag', number: '020', rarity: 'common' },
      { name: 'Pikachu', number: '042', rarity: 'common' },
      { name: 'Ralts', number: '056', rarity: 'common' },
      { name: 'Riolu', number: '071', rarity: 'common' },
      { name: 'Minccino', number: '078', rarity: 'common' },
      // Uncommon
      { name: 'Vileplume', number: '003', rarity: 'uncommon' },
      { name: 'Poliwrath', number: '022', rarity: 'uncommon' },
      { name: 'Raichu', number: '043', rarity: 'uncommon' },
      { name: 'Kirlia', number: '057', rarity: 'uncommon' },
      { name: 'Lucario', number: '072', rarity: 'uncommon' },
      { name: 'Cinccino', number: '079', rarity: 'uncommon' },
      // Rare
      { name: 'Leafeon', number: '007', rarity: 'rare' },
      { name: 'Glaceon', number: '025', rarity: 'rare' },
      { name: 'Jolteon', number: '044', rarity: 'rare' },
      { name: 'Espeon', number: '059', rarity: 'rare' },
      { name: 'Flareon', number: '014', rarity: 'rare' },
      { name: 'Vaporeon', number: '023', rarity: 'rare' },
      { name: 'Umbreon', number: '063', rarity: 'rare' },
      { name: 'Sylveon', number: '068', rarity: 'rare' },
      // Ultra Rare (ex cards)
      { name: 'Leafeon ex', number: '008', rarity: 'ultraRare' },
      { name: 'Flareon ex', number: '015', rarity: 'ultraRare' },
      { name: 'Vaporeon ex', number: '024', rarity: 'ultraRare' },
      { name: 'Jolteon ex', number: '045', rarity: 'ultraRare' },
      { name: 'Espeon ex', number: '060', rarity: 'ultraRare' },
      { name: 'Umbreon ex', number: '064', rarity: 'ultraRare' },
      { name: 'Sylveon ex', number: '069', rarity: 'ultraRare' },
      { name: 'Eevee ex', number: '082', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Leafeon ex', number: '092', rarity: 'illustrationRare' },
      { name: 'Flareon ex', number: '093', rarity: 'illustrationRare' },
      { name: 'Vaporeon ex', number: '094', rarity: 'illustrationRare' },
      { name: 'Jolteon ex', number: '095', rarity: 'illustrationRare' },
      { name: 'Espeon ex', number: '096', rarity: 'illustrationRare' },
      { name: 'Umbreon ex', number: '097', rarity: 'illustrationRare' },
      { name: 'Sylveon ex', number: '098', rarity: 'illustrationRare' },
      { name: 'Eevee ex', number: '099', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Leafeon ex', number: '100', rarity: 'specialIllustrationRare' },
      { name: 'Flareon ex', number: '101', rarity: 'specialIllustrationRare' },
      { name: 'Vaporeon ex', number: '102', rarity: 'specialIllustrationRare' },
      { name: 'Jolteon ex', number: '103', rarity: 'specialIllustrationRare' },
      { name: 'Espeon ex', number: '104', rarity: 'specialIllustrationRare' },
      { name: 'Umbreon ex', number: '105', rarity: 'specialIllustrationRare' },
      { name: 'Sylveon ex', number: '106', rarity: 'specialIllustrationRare' },
      { name: 'Eevee ex', number: '107', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Pokémon Fan Club', number: '080', rarity: 'uncommon' },
      { name: 'Pokémon Fan Club', number: '108', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Mega Evolution',
    code: 'me1',
    era: 'Scarlet & Violet',
    printedTotal: '096',
    cards: [
      // Common
      { name: 'Bulbasaur', number: '001', rarity: 'common' },
      { name: 'Charmander', number: '010', rarity: 'common' },
      { name: 'Squirtle', number: '020', rarity: 'common' },
      { name: 'Ralts', number: '040', rarity: 'common' },
      { name: 'Bagon', number: '060', rarity: 'common' },
      // Uncommon
      { name: 'Ivysaur', number: '002', rarity: 'uncommon' },
      { name: 'Charmeleon', number: '011', rarity: 'uncommon' },
      { name: 'Wartortle', number: '021', rarity: 'uncommon' },
      { name: 'Kirlia', number: '041', rarity: 'uncommon' },
      { name: 'Shelgon', number: '061', rarity: 'uncommon' },
      // Rare
      { name: 'Venusaur', number: '003', rarity: 'rare' },
      { name: 'Charizard', number: '012', rarity: 'rare' },
      { name: 'Blastoise', number: '022', rarity: 'rare' },
      { name: 'Gardevoir', number: '042', rarity: 'rare' },
      { name: 'Salamence', number: '062', rarity: 'rare' },
      // Ultra Rare
      { name: 'Mega Venusaur ex', number: '004', rarity: 'ultraRare' },
      { name: 'Mega Charizard X ex', number: '013', rarity: 'ultraRare' },
      { name: 'Mega Charizard Y ex', number: '014', rarity: 'ultraRare' },
      { name: 'Mega Blastoise ex', number: '023', rarity: 'ultraRare' },
      { name: 'Mega Gardevoir ex', number: '043', rarity: 'ultraRare' },
      { name: 'Mega Salamence ex', number: '063', rarity: 'ultraRare' },
      { name: 'Mega Rayquaza ex', number: '070', rarity: 'ultraRare' },
      { name: 'Mega Mewtwo X ex', number: '075', rarity: 'ultraRare' },
      { name: 'Mega Mewtwo Y ex', number: '076', rarity: 'ultraRare' },
      { name: 'Mega Lucario ex', number: '080', rarity: 'ultraRare' },
      { name: 'Mega Gengar ex', number: '085', rarity: 'ultraRare' },
      { name: 'Mega Gyarados ex', number: '090', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Mega Charizard X ex', number: '100', rarity: 'illustrationRare' },
      { name: 'Mega Charizard Y ex', number: '101', rarity: 'illustrationRare' },
      { name: 'Mega Rayquaza ex', number: '102', rarity: 'illustrationRare' },
      { name: 'Mega Mewtwo Y ex', number: '103', rarity: 'illustrationRare' },
      { name: 'Mega Gengar ex', number: '104', rarity: 'illustrationRare' },
      { name: 'Mega Lucario ex', number: '105', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Mega Charizard X ex', number: '110', rarity: 'specialIllustrationRare' },
      { name: 'Mega Charizard Y ex', number: '111', rarity: 'specialIllustrationRare' },
      { name: 'Mega Rayquaza ex', number: '112', rarity: 'specialIllustrationRare' },
      { name: 'Mega Mewtwo Y ex', number: '113', rarity: 'specialIllustrationRare' },
      { name: 'Mega Gengar ex', number: '114', rarity: 'specialIllustrationRare' },
      // Mega Illustration Rare (unique to this set)
      { name: 'Mega Charizard X ex', number: '120', rarity: 'megaIllustrationRare' },
      { name: 'Mega Charizard Y ex', number: '121', rarity: 'megaIllustrationRare' },
      { name: 'Mega Rayquaza ex', number: '122', rarity: 'megaIllustrationRare' },
      { name: 'Mega Mewtwo X ex', number: '123', rarity: 'megaIllustrationRare' },
      { name: 'Mega Mewtwo Y ex', number: '124', rarity: 'megaIllustrationRare' },
      { name: 'Mega Gengar ex', number: '125', rarity: 'megaIllustrationRare' },
    ]
  },

  {
    name: 'Phantasmal Flames',
    code: 'me2',
    era: 'Scarlet & Violet',
    printedTotal: '094',
    cards: [
      // Common
      { name: 'Oddish', number: '001', rarity: 'common' },
      { name: 'Gloom', number: '002', rarity: 'common' },
      { name: 'Lotad', number: '005', rarity: 'common' },
      { name: 'Lombre', number: '006', rarity: 'common' },
      { name: 'Nymble', number: '009', rarity: 'common' },
      { name: 'Charmander', number: '011', rarity: 'common' },
      { name: 'Charmeleon', number: '012', rarity: 'common' },
      { name: 'Darumaka', number: '015', rarity: 'common' },
      { name: 'Charcadet', number: '019', rarity: 'common' },
      { name: 'Seel', number: '021', rarity: 'common' },
      { name: 'Swinub', number: '023', rarity: 'common' },
      { name: 'Piloswine', number: '024', rarity: 'common' },
      { name: 'Piplup', number: '027', rarity: 'common' },
      { name: 'Yamper', number: '030', rarity: 'common' },
      { name: 'Pawmi', number: '032', rarity: 'common' },
      { name: 'Pawmo', number: '033', rarity: 'common' },
      { name: 'Misdreavus', number: '035', rarity: 'common' },
      { name: 'Snubbull', number: '037', rarity: 'common' },
      { name: 'Milcery', number: '043', rarity: 'common' },
      { name: 'Bramblin', number: '046', rarity: 'common' },
      { name: 'Gligar', number: '049', rarity: 'common' },
      { name: 'Trapinch', number: '051', rarity: 'common' },
      { name: 'Vibrava', number: '052', rarity: 'common' },
      { name: 'Gastly', number: '054', rarity: 'common' },
      { name: 'Haunter', number: '055', rarity: 'common' },
      { name: 'Murkrow', number: '057', rarity: 'common' },
      { name: 'Carvanha', number: '060', rarity: 'common' },
      { name: 'Sandile', number: '064', rarity: 'common' },
      { name: 'Krokorok', number: '065', rarity: 'common' },
      { name: 'Toxel', number: '067', rarity: 'common' },
      { name: 'Bronzor', number: '071', rarity: 'common' },
      { name: 'Jigglypuff', number: '076', rarity: 'common' },
      { name: 'Aipom', number: '078', rarity: 'common' },
      { name: 'Zigzagoon', number: '081', rarity: 'common' },
      { name: 'Buneary', number: '083', rarity: 'common' },
      // Uncommon
      { name: 'Vileplume', number: '003', rarity: 'uncommon' },
      { name: 'Ludicolo', number: '007', rarity: 'uncommon' },
      { name: 'Lokix', number: '010', rarity: 'uncommon' },
      { name: 'Darmanitan', number: '016', rarity: 'uncommon' },
      { name: 'Ceruledge', number: '020', rarity: 'uncommon' },
      { name: 'Dewgong', number: '022', rarity: 'uncommon' },
      { name: 'Mamoswine', number: '025', rarity: 'uncommon' },
      { name: 'Prinplup', number: '028', rarity: 'uncommon' },
      { name: 'Boltund', number: '031', rarity: 'uncommon' },
      { name: 'Pawmot', number: '034', rarity: 'uncommon' },
      { name: 'Granbull', number: '038', rarity: 'uncommon' },
      { name: 'Alcremie', number: '044', rarity: 'uncommon' },
      { name: 'Brambleghast', number: '047', rarity: 'uncommon' },
      { name: 'Gliscor', number: '050', rarity: 'uncommon' },
      { name: 'Honchkrow', number: '058', rarity: 'uncommon' },
      { name: 'Krookodile', number: '066', rarity: 'uncommon' },
      { name: 'Toxtricity', number: '068', rarity: 'uncommon' },
      { name: 'Bronzong', number: '072', rarity: 'uncommon' },
      { name: 'Wigglytuff', number: '077', rarity: 'uncommon' },
      { name: 'Ambipom', number: '079', rarity: 'uncommon' },
      { name: 'Linoone', number: '082', rarity: 'uncommon' },
      // Rare
      { name: 'Genesect', number: '008', rarity: 'rare' },
      { name: 'Moltres', number: '014', rarity: 'rare' },
      { name: 'Reshiram', number: '017', rarity: 'rare' },
      { name: 'Suicune', number: '026', rarity: 'rare' },
      { name: 'Cresselia', number: '039', rarity: 'rare' },
      { name: 'Meloetta', number: '040', rarity: 'rare' },
      { name: 'Mimikyu', number: '042', rarity: 'rare' },
      { name: 'Zacian', number: '045', rarity: 'rare' },
      { name: 'Paldean Tauros', number: '048', rarity: 'rare' },
      { name: 'Flygon', number: '053', rarity: 'rare' },
      { name: 'Sableye', number: '059', rarity: 'rare' },
      { name: 'Seviper', number: '062', rarity: 'rare' },
      { name: 'Absol', number: '063', rarity: 'rare' },
      { name: 'Eternatus', number: '069', rarity: 'rare' },
      { name: 'Togedemaru', number: '073', rarity: 'rare' },
      { name: 'Duraludon', number: '074', rarity: 'rare' },
      { name: 'Archaludon', number: '075', rarity: 'rare' },
      { name: 'Smeargle', number: '080', rarity: 'rare' },
      // Ultra Rare (Double Rare ex)
      { name: 'Mega Heracross ex', number: '004', rarity: 'ultraRare' },
      { name: 'Mega Charizard X ex', number: '013', rarity: 'ultraRare' },
      { name: 'Oricorio ex', number: '018', rarity: 'ultraRare' },
      { name: 'Rotom ex', number: '029', rarity: 'ultraRare' },
      { name: 'Mismagius ex', number: '036', rarity: 'ultraRare' },
      { name: 'Mega Diancie ex', number: '041', rarity: 'ultraRare' },
      { name: 'Mega Gengar ex', number: '056', rarity: 'ultraRare' },
      { name: 'Mega Sharpedo ex', number: '061', rarity: 'ultraRare' },
      { name: 'Empoleon ex', number: '070', rarity: 'ultraRare' },
      { name: 'Mega Lopunny ex', number: '084', rarity: 'ultraRare' },
      // Ultra Rare (Full Art)
      { name: 'Mega Heracross ex', number: '108', rarity: 'ultraRare' },
      { name: 'Mega Charizard X ex', number: '109', rarity: 'ultraRare' },
      { name: 'Oricorio ex', number: '110', rarity: 'ultraRare' },
      { name: 'Rotom ex', number: '111', rarity: 'ultraRare' },
      { name: 'Mismagius ex', number: '112', rarity: 'ultraRare' },
      { name: 'Mega Sharpedo ex', number: '113', rarity: 'ultraRare' },
      { name: 'Empoleon ex', number: '114', rarity: 'ultraRare' },
      { name: 'Mega Lopunny ex', number: '115', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Ludicolo', number: '095', rarity: 'illustrationRare' },
      { name: 'Nymble', number: '096', rarity: 'illustrationRare' },
      { name: 'Dewgong', number: '097', rarity: 'illustrationRare' },
      { name: 'Piplup', number: '098', rarity: 'illustrationRare' },
      { name: 'Yamper', number: '099', rarity: 'illustrationRare' },
      { name: 'Zacian', number: '100', rarity: 'illustrationRare' },
      { name: 'Flygon', number: '101', rarity: 'illustrationRare' },
      { name: 'Paldean Wooper', number: '102', rarity: 'illustrationRare' },
      { name: 'Toxtricity', number: '103', rarity: 'illustrationRare' },
      { name: 'Togedemaru', number: '104', rarity: 'illustrationRare' },
      { name: 'Wigglytuff', number: '105', rarity: 'illustrationRare' },
      { name: 'Meowth', number: '106', rarity: 'illustrationRare' },
      { name: 'Ambipom', number: '107', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Mega Charizard X ex', number: '125', rarity: 'specialIllustrationRare' },
      { name: 'Rotom ex', number: '126', rarity: 'specialIllustrationRare' },
      { name: 'Mega Sharpedo ex', number: '127', rarity: 'specialIllustrationRare' },
      { name: 'Mega Lopunny ex', number: '128', rarity: 'specialIllustrationRare' },
      { name: 'Dawn', number: '129', rarity: 'specialIllustrationRare' },
      // Mega Hyper Rare
      { name: 'Mega Charizard X ex', number: '130', rarity: 'megaIllustrationRare' },
      // Trainers
      { name: 'Battle Cage', number: '085', rarity: 'uncommon' },
      { name: 'Blowtorch', number: '086', rarity: 'uncommon' },
      { name: 'Dawn', number: '087', rarity: 'uncommon' },
      { name: 'Dizzying Valley', number: '088', rarity: 'uncommon' },
      { name: 'Firebreather', number: '089', rarity: 'uncommon' },
      { name: "Grimsley's Move", number: '090', rarity: 'uncommon' },
      { name: 'Jumbo Ice Cream', number: '091', rarity: 'uncommon' },
      { name: 'Punk Helmet', number: '092', rarity: 'uncommon' },
      { name: 'Sacred Charm', number: '093', rarity: 'uncommon' },
      { name: 'Wondrous Patch', number: '094', rarity: 'uncommon' },
      { name: 'Battle Cage', number: '116', rarity: 'ultraRare' },
      { name: 'Blowtorch', number: '117', rarity: 'ultraRare' },
      { name: 'Dawn', number: '118', rarity: 'ultraRare' },
      { name: 'Firebreather', number: '119', rarity: 'ultraRare' },
      { name: "Grimsley's Move", number: '120', rarity: 'ultraRare' },
      { name: 'Punk Helmet', number: '121', rarity: 'ultraRare' },
      { name: 'Sacred Charm', number: '122', rarity: 'ultraRare' },
      { name: 'Switch', number: '123', rarity: 'ultraRare' },
      { name: 'Ignition Energy', number: '124', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Surging Sparks',
    code: 'SV7',
    era: 'Scarlet & Violet',
    printedTotal: '191',
    cards: [
      // Common
      { name: 'Bellsprout', number: '001', rarity: 'common' },
      { name: 'Tangela', number: '004', rarity: 'common' },
      { name: 'Sunkern', number: '006', rarity: 'common' },
      { name: 'Vulpix', number: '019', rarity: 'common' },
      { name: 'Magmar', number: '023', rarity: 'common' },
      { name: 'Psyduck', number: '032', rarity: 'common' },
      { name: 'Horsea', number: '035', rarity: 'common' },
      { name: 'Pikachu', number: '052', rarity: 'common' },
      { name: 'Magnemite', number: '055', rarity: 'common' },
      // Uncommon
      { name: 'Weepinbell', number: '002', rarity: 'uncommon' },
      { name: 'Tangrowth', number: '005', rarity: 'uncommon' },
      { name: 'Sunflora', number: '007', rarity: 'uncommon' },
      { name: 'Golduck', number: '033', rarity: 'uncommon' },
      { name: 'Seadra', number: '036', rarity: 'uncommon' },
      { name: 'Magneton', number: '056', rarity: 'uncommon' },
      // Rare
      { name: 'Victreebel', number: '003', rarity: 'rare' },
      { name: 'Ninetales', number: '020', rarity: 'rare' },
      { name: 'Kingdra', number: '037', rarity: 'rare' },
      { name: 'Raichu', number: '053', rarity: 'rare' },
      { name: 'Magnezone', number: '057', rarity: 'rare' },
      // Ultra Rare
      { name: 'Pikachu ex', number: '058', rarity: 'ultraRare' },
      { name: 'Eevee ex', number: '130', rarity: 'ultraRare' },
      { name: 'Snorlax ex', number: '131', rarity: 'ultraRare' },
      { name: 'Ho-Oh ex', number: '024', rarity: 'ultraRare' },
      { name: 'Suicune ex', number: '038', rarity: 'ultraRare' },
      { name: 'Celebi ex', number: '008', rarity: 'ultraRare' },
      { name: 'Dialga ex', number: '095', rarity: 'ultraRare' },
      { name: 'Palkia ex', number: '040', rarity: 'ultraRare' },
      { name: 'Arceus ex', number: '132', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Pikachu ex', number: '140', rarity: 'illustrationRare' },
      { name: 'Ho-Oh ex', number: '141', rarity: 'illustrationRare' },
      { name: 'Suicune ex', number: '142', rarity: 'illustrationRare' },
      { name: 'Celebi ex', number: '143', rarity: 'illustrationRare' },
      { name: 'Snorlax ex', number: '144', rarity: 'illustrationRare' },
      { name: 'Eevee ex', number: '145', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Pikachu ex', number: '160', rarity: 'specialIllustrationRare' },
      { name: 'Ho-Oh ex', number: '161', rarity: 'specialIllustrationRare' },
      { name: 'Suicune ex', number: '162', rarity: 'specialIllustrationRare' },
      { name: 'Arceus ex', number: '163', rarity: 'specialIllustrationRare' },
      { name: 'Eevee ex', number: '164', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: "N's Resolve", number: '120', rarity: 'uncommon' },
      { name: 'Lacey', number: '121', rarity: 'uncommon' },
      { name: 'Cynthia', number: '119', rarity: 'uncommon' },
      { name: "N's Resolve", number: '150', rarity: 'ultraRare' },
      { name: 'Lacey', number: '151', rarity: 'ultraRare' },
      { name: "N's Resolve", number: '165', rarity: 'illustrationRare' },
      { name: 'Lacey', number: '166', rarity: 'illustrationRare' },
      { name: "N's Resolve", number: '170', rarity: 'specialIllustrationRare' },
      { name: 'Lacey', number: '171', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Stellar Crown',
    code: 'SV7.5',
    era: 'Scarlet & Violet',
    printedTotal: '081',
    cards: [
      // Common
      { name: 'Caterpie', number: '001', rarity: 'common' },
      { name: 'Hoppip', number: '004', rarity: 'common' },
      { name: 'Slugma', number: '012', rarity: 'common' },
      { name: 'Seel', number: '018', rarity: 'common' },
      { name: 'Milotic', number: '022', rarity: 'common' },
      // Uncommon
      { name: 'Metapod', number: '002', rarity: 'uncommon' },
      { name: 'Skiploom', number: '005', rarity: 'uncommon' },
      { name: 'Dewgong', number: '019', rarity: 'uncommon' },
      // Rare
      { name: 'Butterfree', number: '003', rarity: 'rare' },
      { name: 'Jumpluff', number: '006', rarity: 'rare' },
      { name: 'Magcargo', number: '013', rarity: 'rare' },
      // Ultra Rare
      { name: 'Terapagos ex', number: '080', rarity: 'ultraRare' },
      { name: 'Lapras ex', number: '020', rarity: 'ultraRare' },
      { name: 'Hydrapple ex', number: '007', rarity: 'ultraRare' },
      { name: 'Archaludon ex', number: '065', rarity: 'ultraRare' },
      { name: 'Gallade ex', number: '050', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Terapagos ex', number: '085', rarity: 'illustrationRare' },
      { name: 'Lapras ex', number: '086', rarity: 'illustrationRare' },
      { name: 'Gallade ex', number: '087', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Terapagos ex', number: '092', rarity: 'specialIllustrationRare' },
      { name: 'Lapras ex', number: '093', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Briar', number: '072', rarity: 'uncommon' },
      { name: 'Briar', number: '088', rarity: 'ultraRare' },
      { name: 'Briar', number: '094', rarity: 'specialIllustrationRare' },
      { name: 'Crispin', number: '073', rarity: 'uncommon' },
      { name: 'Crispin', number: '089', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Shrouded Fable',
    code: 'SV6.5',
    era: 'Scarlet & Violet',
    printedTotal: '064',
    cards: [
      // Common
      { name: 'Cottonee', number: '001', rarity: 'common' },
      { name: 'Fennekin', number: '008', rarity: 'common' },
      { name: 'Froakie', number: '013', rarity: 'common' },
      { name: 'Greavard', number: '030', rarity: 'common' },
      // Uncommon
      { name: 'Whimsicott', number: '002', rarity: 'uncommon' },
      { name: 'Braixen', number: '009', rarity: 'uncommon' },
      { name: 'Frogadier', number: '014', rarity: 'uncommon' },
      { name: 'Houndstone', number: '031', rarity: 'uncommon' },
      // Rare
      { name: 'Delphox', number: '010', rarity: 'rare' },
      { name: 'Greninja', number: '015', rarity: 'rare' },
      // Ultra Rare
      { name: 'Greninja ex', number: '016', rarity: 'ultraRare' },
      { name: 'Kingambit ex', number: '037', rarity: 'ultraRare' },
      { name: 'Dragapult ex', number: '042', rarity: 'ultraRare' },
      { name: 'Darkrai ex', number: '035', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Greninja ex', number: '050', rarity: 'illustrationRare' },
      { name: 'Dragapult ex', number: '051', rarity: 'illustrationRare' },
      { name: 'Darkrai ex', number: '052', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Greninja ex', number: '058', rarity: 'specialIllustrationRare' },
      { name: 'Dragapult ex', number: '059', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Kieran', number: '044', rarity: 'uncommon' },
      { name: "Janine's Secret Art", number: '045', rarity: 'uncommon' },
      { name: 'Kieran', number: '053', rarity: 'ultraRare' },
      { name: 'Kieran', number: '060', rarity: 'specialIllustrationRare' },
      { name: "Janine's Secret Art", number: '054', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Twilight Masquerade',
    code: 'SV6',
    era: 'Scarlet & Violet',
    printedTotal: '167',
    cards: [
      // Common
      { name: 'Seedot', number: '001', rarity: 'common' },
      { name: 'Cacnea', number: '005', rarity: 'common' },
      { name: 'Litwick', number: '023', rarity: 'common' },
      { name: 'Poliwag', number: '030', rarity: 'common' },
      { name: 'Magnemite', number: '043', rarity: 'common' },
      // Uncommon
      { name: 'Nuzleaf', number: '002', rarity: 'uncommon' },
      { name: 'Cacturne', number: '006', rarity: 'uncommon' },
      { name: 'Lampent', number: '024', rarity: 'uncommon' },
      { name: 'Poliwhirl', number: '031', rarity: 'uncommon' },
      // Rare
      { name: 'Shiftry', number: '003', rarity: 'rare' },
      { name: 'Chandelure', number: '025', rarity: 'rare' },
      { name: 'Politoed', number: '032', rarity: 'rare' },
      { name: 'Magnezone', number: '045', rarity: 'rare' },
      // Ultra Rare
      { name: 'Ogerpon ex', number: '009', rarity: 'ultraRare' },
      { name: 'Bloodmoon Ursaluna ex', number: '075', rarity: 'ultraRare' },
      { name: 'Dragapult ex', number: '070', rarity: 'ultraRare' },
      { name: 'Greninja ex', number: '038', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Ogerpon ex', number: '100', rarity: 'illustrationRare' },
      { name: 'Bloodmoon Ursaluna ex', number: '101', rarity: 'illustrationRare' },
      { name: 'Dragapult ex', number: '102', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Ogerpon ex', number: '110', rarity: 'specialIllustrationRare' },
      { name: 'Bloodmoon Ursaluna ex', number: '111', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Perrin', number: '080', rarity: 'uncommon' },
      { name: 'Carmine', number: '081', rarity: 'uncommon' },
      { name: "Lana's Aid", number: '082', rarity: 'uncommon' },
      { name: 'Perrin', number: '105', rarity: 'ultraRare' },
      { name: 'Carmine', number: '106', rarity: 'ultraRare' },
      { name: "Lana's Aid", number: '107', rarity: 'ultraRare' },
      { name: 'Perrin', number: '112', rarity: 'specialIllustrationRare' },
      { name: 'Carmine', number: '113', rarity: 'specialIllustrationRare' },
      { name: "Lana's Aid", number: '114', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Temporal Forces',
    code: 'SV5',
    era: 'Scarlet & Violet',
    printedTotal: '162',
    cards: [
      // Common
      { name: 'Oddish', number: '001', rarity: 'common' },
      { name: 'Poochyena', number: '060', rarity: 'common' },
      { name: 'Scyther', number: '005', rarity: 'common' },
      { name: 'Growlithe', number: '018', rarity: 'common' },
      { name: 'Shellder', number: '028', rarity: 'common' },
      // Uncommon
      { name: 'Gloom', number: '002', rarity: 'uncommon' },
      { name: 'Mightyena', number: '061', rarity: 'uncommon' },
      // Rare
      { name: 'Vileplume', number: '003', rarity: 'rare' },
      { name: 'Scizor', number: '006', rarity: 'rare' },
      { name: 'Arcanine', number: '019', rarity: 'rare' },
      { name: 'Cloyster', number: '029', rarity: 'rare' },
      // Ultra Rare
      { name: 'Walking Wake ex', number: '024', rarity: 'ultraRare' },
      { name: 'Iron Leaves ex', number: '008', rarity: 'ultraRare' },
      { name: 'Raging Bolt ex', number: '047', rarity: 'ultraRare' },
      { name: 'Iron Crown ex', number: '050', rarity: 'ultraRare' },
      { name: 'Bianca\'s Devotion', number: '078', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Walking Wake ex', number: '090', rarity: 'illustrationRare' },
      { name: 'Iron Leaves ex', number: '091', rarity: 'illustrationRare' },
      { name: 'Raging Bolt ex', number: '092', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Walking Wake ex', number: '100', rarity: 'specialIllustrationRare' },
      { name: 'Raging Bolt ex', number: '101', rarity: 'specialIllustrationRare' },
      { name: 'Bianca\'s Devotion', number: '102', rarity: 'specialIllustrationRare' },
      // More Trainers
      { name: 'Explorer\'s Guidance', number: '075', rarity: 'uncommon' },
      { name: 'Salvatore', number: '076', rarity: 'uncommon' },
      { name: 'Explorer\'s Guidance', number: '085', rarity: 'ultraRare' },
      { name: 'Salvatore', number: '086', rarity: 'ultraRare' },
      { name: 'Explorer\'s Guidance', number: '103', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Paldean Fates',
    code: 'SV4.5',
    era: 'Scarlet & Violet',
    printedTotal: '091',
    cards: [
      // Common
      { name: 'Smoliv', number: '001', rarity: 'common' },
      { name: 'Charcadet', number: '010', rarity: 'common' },
      { name: 'Frigibax', number: '020', rarity: 'common' },
      { name: 'Tinkatink', number: '062', rarity: 'common' },
      // Uncommon
      { name: 'Dolliv', number: '002', rarity: 'uncommon' },
      { name: 'Armarouge', number: '011', rarity: 'uncommon' },
      { name: 'Arctibax', number: '021', rarity: 'uncommon' },
      { name: 'Tinkatuff', number: '063', rarity: 'uncommon' },
      // Rare
      { name: 'Arboliva', number: '003', rarity: 'rare' },
      { name: 'Ceruledge', number: '012', rarity: 'rare' },
      { name: 'Baxcalibur', number: '022', rarity: 'rare' },
      { name: 'Tinkaton', number: '064', rarity: 'rare' },
      // Ultra Rare
      { name: 'Charizard ex', number: '054', rarity: 'ultraRare' },
      { name: 'Maushold ex', number: '072', rarity: 'ultraRare' },
      { name: 'Mimikyu ex', number: '066', rarity: 'ultraRare' },
      { name: 'Forretress ex', number: '058', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Charizard ex', number: '130', rarity: 'illustrationRare' },
      { name: 'Mimikyu ex', number: '131', rarity: 'illustrationRare' },
      { name: 'Maushold ex', number: '132', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Charizard ex', number: '140', rarity: 'specialIllustrationRare' },
      { name: 'Mimikyu ex', number: '141', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Iono', number: '080', rarity: 'ultraRare' },
      { name: "Professor's Research", number: '081', rarity: 'ultraRare' },
      { name: 'Iono', number: '135', rarity: 'illustrationRare' },
      { name: "Professor's Research", number: '136', rarity: 'illustrationRare' },
      { name: 'Iono', number: '142', rarity: 'specialIllustrationRare' },
      { name: 'Penny', number: '143', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Paradox Rift',
    code: 'SV4',
    era: 'Scarlet & Violet',
    printedTotal: '182',
    cards: [
      // Common
      { name: 'Pineco', number: '001', rarity: 'common' },
      { name: 'Torchic', number: '020', rarity: 'common' },
      { name: 'Horsea', number: '030', rarity: 'common' },
      { name: 'Voltorb', number: '045', rarity: 'common' },
      // Uncommon
      { name: 'Forretress', number: '002', rarity: 'uncommon' },
      { name: 'Combusken', number: '021', rarity: 'uncommon' },
      { name: 'Seadra', number: '031', rarity: 'uncommon' },
      // Rare
      { name: 'Blaziken', number: '022', rarity: 'rare' },
      { name: 'Electrode', number: '046', rarity: 'rare' },
      { name: 'Kingdra', number: '032', rarity: 'rare' },
      // Ultra Rare
      { name: 'Roaring Moon ex', number: '109', rarity: 'ultraRare' },
      { name: 'Iron Valiant ex', number: '089', rarity: 'ultraRare' },
      { name: 'Garchomp ex', number: '100', rarity: 'ultraRare' },
      { name: 'Toxicroak ex', number: '075', rarity: 'ultraRare' },
      { name: 'Iron Hands ex', number: '055', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Roaring Moon ex', number: '120', rarity: 'illustrationRare' },
      { name: 'Garchomp ex', number: '121', rarity: 'illustrationRare' },
      { name: 'Iron Valiant ex', number: '122', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Roaring Moon ex', number: '130', rarity: 'specialIllustrationRare' },
      { name: 'Iron Valiant ex', number: '131', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Professor Sada\'s Vitality', number: '115', rarity: 'uncommon' },
      { name: 'Professor Turo\'s Scenario', number: '116', rarity: 'uncommon' },
      { name: 'Counter Catcher', number: '114', rarity: 'uncommon' },
      { name: 'Professor Sada\'s Vitality', number: '125', rarity: 'ultraRare' },
      { name: 'Professor Turo\'s Scenario', number: '126', rarity: 'ultraRare' },
      { name: 'Professor Sada\'s Vitality', number: '132', rarity: 'specialIllustrationRare' },
      { name: 'Professor Turo\'s Scenario', number: '133', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: '151',
    code: 'SV3.5',
    era: 'Scarlet & Violet',
    printedTotal: '165',
    cards: [
      // Common
      { name: 'Bulbasaur', number: '001', rarity: 'common' },
      { name: 'Charmander', number: '004', rarity: 'common' },
      { name: 'Squirtle', number: '007', rarity: 'common' },
      { name: 'Caterpie', number: '010', rarity: 'common' },
      { name: 'Weedle', number: '013', rarity: 'common' },
      { name: 'Pidgey', number: '016', rarity: 'common' },
      { name: 'Rattata', number: '019', rarity: 'common' },
      { name: 'Pikachu', number: '025', rarity: 'common' },
      { name: 'Abra', number: '063', rarity: 'common' },
      { name: 'Machop', number: '066', rarity: 'common' },
      { name: 'Gastly', number: '092', rarity: 'common' },
      { name: 'Magikarp', number: '129', rarity: 'common' },
      { name: 'Ditto', number: '132', rarity: 'common' },
      { name: 'Eevee', number: '133', rarity: 'common' },
      // Uncommon
      { name: 'Ivysaur', number: '002', rarity: 'uncommon' },
      { name: 'Charmeleon', number: '005', rarity: 'uncommon' },
      { name: 'Wartortle', number: '008', rarity: 'uncommon' },
      { name: 'Raichu', number: '026', rarity: 'uncommon' },
      { name: 'Kadabra', number: '064', rarity: 'uncommon' },
      { name: 'Machoke', number: '067', rarity: 'uncommon' },
      { name: 'Haunter', number: '093', rarity: 'uncommon' },
      // Rare
      { name: 'Venusaur', number: '003', rarity: 'rare' },
      { name: 'Charizard', number: '006', rarity: 'rare' },
      { name: 'Blastoise', number: '009', rarity: 'rare' },
      { name: 'Alakazam', number: '065', rarity: 'rare' },
      { name: 'Gengar', number: '094', rarity: 'rare' },
      { name: 'Gyarados', number: '130', rarity: 'rare' },
      { name: 'Dragonite', number: '149', rarity: 'rare' },
      { name: 'Mewtwo', number: '150', rarity: 'rare' },
      { name: 'Mew', number: '151', rarity: 'rare' },
      // Ultra Rare
      { name: 'Venusaur ex', number: '167', rarity: 'ultraRare' },
      { name: 'Charizard ex', number: '168', rarity: 'ultraRare' },
      { name: 'Blastoise ex', number: '169', rarity: 'ultraRare' },
      { name: 'Arcanine ex', number: '170', rarity: 'ultraRare' },
      { name: 'Alakazam ex', number: '171', rarity: 'ultraRare' },
      { name: 'Gengar ex', number: '172', rarity: 'ultraRare' },
      { name: 'Zapdos ex', number: '173', rarity: 'ultraRare' },
      { name: 'Mew ex', number: '174', rarity: 'ultraRare' },
      { name: 'Mewtwo ex', number: '175', rarity: 'ultraRare' },
      { name: 'Erikas Invitation', number: '176', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Venusaur ex', number: '182', rarity: 'illustrationRare' },
      { name: 'Charizard ex', number: '183', rarity: 'illustrationRare' },
      { name: 'Blastoise ex', number: '184', rarity: 'illustrationRare' },
      { name: 'Alakazam ex', number: '185', rarity: 'illustrationRare' },
      { name: 'Gengar ex', number: '186', rarity: 'illustrationRare' },
      { name: 'Zapdos ex', number: '187', rarity: 'illustrationRare' },
      { name: 'Mew ex', number: '188', rarity: 'illustrationRare' },
      { name: 'Mewtwo ex', number: '189', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Charizard ex', number: '199', rarity: 'specialIllustrationRare' },
      { name: 'Mew ex', number: '200', rarity: 'specialIllustrationRare' },
      { name: 'Mewtwo ex', number: '201', rarity: 'specialIllustrationRare' },
      { name: 'Erikas Invitation', number: '202', rarity: 'specialIllustrationRare' },
      { name: 'Alakazam ex', number: '203', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Bill\'s Transfer', number: '155', rarity: 'uncommon' },
      { name: 'Giovanni\'s Charisma', number: '156', rarity: 'uncommon' },
      { name: 'Erikas Invitation', number: '160', rarity: 'uncommon' },
      { name: 'Bill\'s Transfer', number: '178', rarity: 'ultraRare' },
      { name: 'Giovanni\'s Charisma', number: '179', rarity: 'ultraRare' },
      { name: 'Giovanni\'s Charisma', number: '204', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Obsidian Flames',
    code: 'SV3',
    era: 'Scarlet & Violet',
    printedTotal: '197',
    cards: [
      // Common
      { name: 'Oddish', number: '001', rarity: 'common' },
      { name: 'Numel', number: '020', rarity: 'common' },
      { name: 'Snorunt', number: '038', rarity: 'common' },
      { name: 'Pikachu', number: '055', rarity: 'common' },
      // Uncommon
      { name: 'Gloom', number: '002', rarity: 'uncommon' },
      { name: 'Camerupt', number: '021', rarity: 'uncommon' },
      { name: 'Glalie', number: '039', rarity: 'uncommon' },
      // Rare
      { name: 'Vileplume', number: '003', rarity: 'rare' },
      { name: 'Froslass', number: '040', rarity: 'rare' },
      { name: 'Dragonite', number: '130', rarity: 'rare' },
      // Ultra Rare
      { name: 'Charizard ex', number: '125', rarity: 'ultraRare' },
      { name: 'Tyranitar ex', number: '108', rarity: 'ultraRare' },
      { name: 'Dragonite ex', number: '131', rarity: 'ultraRare' },
      { name: 'Enamorus ex', number: '091', rarity: 'ultraRare' },
      { name: 'Greedent ex', number: '136', rarity: 'ultraRare' },
      { name: 'Vespiquen ex', number: '007', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Charizard ex', number: '150', rarity: 'illustrationRare' },
      { name: 'Tyranitar ex', number: '151', rarity: 'illustrationRare' },
      { name: 'Dragonite ex', number: '152', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Charizard ex', number: '170', rarity: 'specialIllustrationRare' },
      { name: 'Tyranitar ex', number: '171', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Boss\'s Orders', number: '132', rarity: 'uncommon' },
      { name: 'Iono', number: '133', rarity: 'uncommon' },
      { name: 'Boss\'s Orders', number: '153', rarity: 'ultraRare' },
      { name: 'Iono', number: '154', rarity: 'ultraRare' },
      { name: 'Boss\'s Orders', number: '172', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Paldea Evolved',
    code: 'SV2',
    era: 'Scarlet & Violet',
    printedTotal: '193',
    cards: [
      // Common
      { name: 'Petilil', number: '001', rarity: 'common' },
      { name: 'Larvesta', number: '019', rarity: 'common' },
      { name: 'Dondozo', number: '038', rarity: 'common' },
      { name: 'Shinx', number: '050', rarity: 'common' },
      // Uncommon
      { name: 'Lilligant', number: '002', rarity: 'uncommon' },
      { name: 'Luxio', number: '051', rarity: 'uncommon' },
      // Rare
      { name: 'Volcarona', number: '020', rarity: 'rare' },
      { name: 'Luxray', number: '052', rarity: 'rare' },
      // Ultra Rare
      { name: 'Chien-Pao ex', number: '061', rarity: 'ultraRare' },
      { name: 'Ting-Lu ex', number: '097', rarity: 'ultraRare' },
      { name: 'Chi-Yu ex', number: '029', rarity: 'ultraRare' },
      { name: 'Wo-Chien ex', number: '006', rarity: 'ultraRare' },
      { name: 'Dedenne ex', number: '057', rarity: 'ultraRare' },
      { name: 'Palafin ex', number: '045', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Chien-Pao ex', number: '175', rarity: 'illustrationRare' },
      { name: 'Ting-Lu ex', number: '176', rarity: 'illustrationRare' },
      { name: 'Dedenne ex', number: '177', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Chien-Pao ex', number: '190', rarity: 'specialIllustrationRare' },
      { name: 'Ting-Lu ex', number: '191', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Iono', number: '108', rarity: 'uncommon' },
      { name: 'Boss\'s Orders', number: '109', rarity: 'uncommon' },
      { name: 'Iono', number: '180', rarity: 'ultraRare' },
      { name: 'Boss\'s Orders', number: '181', rarity: 'ultraRare' },
      { name: 'Iono', number: '192', rarity: 'specialIllustrationRare' },
      { name: 'Boss\'s Orders', number: '193', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Scarlet & Violet',
    code: 'SV1',
    era: 'Scarlet & Violet',
    printedTotal: '198',
    cards: [
      // Common
      { name: 'Sprigatito', number: '013', rarity: 'common' },
      { name: 'Fuecoco', number: '032', rarity: 'common' },
      { name: 'Quaxly', number: '054', rarity: 'common' },
      { name: 'Lechonk', number: '155', rarity: 'common' },
      { name: 'Fidough', number: '086', rarity: 'common' },
      // Uncommon
      { name: 'Floragato', number: '014', rarity: 'uncommon' },
      { name: 'Crocalor', number: '033', rarity: 'uncommon' },
      { name: 'Quaxwell', number: '055', rarity: 'uncommon' },
      // Rare
      { name: 'Meowscarada', number: '015', rarity: 'rare' },
      { name: 'Skeledirge', number: '034', rarity: 'rare' },
      { name: 'Quaquaval', number: '056', rarity: 'rare' },
      // Ultra Rare
      { name: 'Meowscarada ex', number: '015', rarity: 'ultraRare' },
      { name: 'Armarouge ex', number: '041', rarity: 'ultraRare' },
      { name: 'Gardevoir ex', number: '086', rarity: 'ultraRare' },
      { name: 'Koraidon ex', number: '124', rarity: 'ultraRare' },
      { name: 'Miraidon ex', number: '081', rarity: 'ultraRare' },
      // Illustration Rare
      { name: 'Koraidon ex', number: '170', rarity: 'illustrationRare' },
      { name: 'Miraidon ex', number: '171', rarity: 'illustrationRare' },
      { name: 'Gardevoir ex', number: '172', rarity: 'illustrationRare' },
      // Special Illustration Rare
      { name: 'Koraidon ex', number: '190', rarity: 'specialIllustrationRare' },
      { name: 'Miraidon ex', number: '191', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: "Professor's Research", number: '087', rarity: 'uncommon' },
      { name: 'Nemona', number: '088', rarity: 'uncommon' },
      { name: 'Penny', number: '089', rarity: 'uncommon' },
      { name: 'Arven', number: '090', rarity: 'uncommon' },
      { name: 'Jacq', number: '091', rarity: 'uncommon' },
      { name: "Professor's Research", number: '176', rarity: 'ultraRare' },
      { name: 'Nemona', number: '177', rarity: 'ultraRare' },
      { name: 'Penny', number: '178', rarity: 'ultraRare' },
      { name: 'Arven', number: '179', rarity: 'ultraRare' },
      { name: "Professor's Research", number: '193', rarity: 'specialIllustrationRare' },
      { name: 'Nemona', number: '194', rarity: 'specialIllustrationRare' },
      { name: 'Penny', number: '195', rarity: 'specialIllustrationRare' },
      { name: 'Arven', number: '196', rarity: 'specialIllustrationRare' },
    ]
  },

  // ─── Sword & Shield Era ──────────────────────────────────────────

  {
    name: 'Crown Zenith',
    code: 'SWSH12.5',
    era: 'Sword & Shield',
    printedTotal: '070',
    cards: [
      { name: 'Pikachu VMAX', number: '023', rarity: 'ultraRare' },
      { name: 'Mewtwo VSTAR', number: '030', rarity: 'ultraRare' },
      { name: 'Charizard VSTAR', number: '018', rarity: 'ultraRare' },
      { name: 'Giratina VSTAR', number: '058', rarity: 'ultraRare' },
      { name: 'Regieleki VMAX', number: '038', rarity: 'ultraRare' },
      { name: 'Zacian V', number: '064', rarity: 'ultraRare' },
      { name: 'Zamazenta V', number: '065', rarity: 'ultraRare' },
      // Galarian Gallery
      { name: 'Pikachu VMAX', number: 'GG30', rarity: 'illustrationRare' },
      { name: 'Charizard VSTAR', number: 'GG36', rarity: 'illustrationRare' },
      { name: 'Mewtwo VSTAR', number: 'GG44', rarity: 'illustrationRare' },
      { name: 'Giratina VSTAR', number: 'GG54', rarity: 'illustrationRare' },
      { name: 'Umbreon VMAX', number: 'GG57', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Evolving Skies',
    code: 'SWSH7',
    era: 'Sword & Shield',
    printedTotal: '203',
    cards: [
      // Common
      { name: 'Eevee', number: '120', rarity: 'common' },
      { name: 'Swablu', number: '131', rarity: 'common' },
      { name: 'Dratini', number: '128', rarity: 'common' },
      { name: 'Horsea', number: '031', rarity: 'common' },
      // Uncommon
      { name: 'Dragonair', number: '129', rarity: 'uncommon' },
      { name: 'Altaria', number: '132', rarity: 'uncommon' },
      { name: 'Seadra', number: '032', rarity: 'uncommon' },
      // Rare
      { name: 'Dragonite', number: '130', rarity: 'rare' },
      { name: 'Kingdra', number: '033', rarity: 'rare' },
      // Ultra Rare (V / VMAX)
      { name: 'Umbreon V', number: '094', rarity: 'ultraRare' },
      { name: 'Umbreon VMAX', number: '095', rarity: 'ultraRare' },
      { name: 'Rayquaza V', number: '110', rarity: 'ultraRare' },
      { name: 'Rayquaza VMAX', number: '111', rarity: 'ultraRare' },
      { name: 'Dragonite V', number: '134', rarity: 'ultraRare' },
      { name: 'Dragonite VMAX', number: '135', rarity: 'ultraRare' },
      { name: 'Sylveon V', number: '074', rarity: 'ultraRare' },
      { name: 'Sylveon VMAX', number: '075', rarity: 'ultraRare' },
      { name: 'Espeon V', number: '064', rarity: 'ultraRare' },
      { name: 'Espeon VMAX', number: '065', rarity: 'ultraRare' },
      { name: 'Leafeon V', number: '007', rarity: 'ultraRare' },
      { name: 'Leafeon VMAX', number: '008', rarity: 'ultraRare' },
      { name: 'Glaceon V', number: '038', rarity: 'ultraRare' },
      { name: 'Glaceon VMAX', number: '039', rarity: 'ultraRare' },
      { name: 'Jolteon V', number: '047', rarity: 'ultraRare' },
      { name: 'Jolteon VMAX', number: '048', rarity: 'ultraRare' },
      { name: 'Flareon V', number: '018', rarity: 'ultraRare' },
      { name: 'Flareon VMAX', number: '019', rarity: 'ultraRare' },
      // Alternate Art (treat as illustrationRare)
      { name: 'Umbreon V', number: '189', rarity: 'illustrationRare' },
      { name: 'Umbreon VMAX', number: '215', rarity: 'specialIllustrationRare' },
      { name: 'Rayquaza V', number: '194', rarity: 'illustrationRare' },
      { name: 'Rayquaza VMAX', number: '218', rarity: 'specialIllustrationRare' },
      { name: 'Dragonite V', number: '192', rarity: 'illustrationRare' },
      { name: 'Sylveon V', number: '184', rarity: 'illustrationRare' },
      { name: 'Sylveon VMAX', number: '211', rarity: 'specialIllustrationRare' },
      { name: 'Glaceon V', number: '175', rarity: 'illustrationRare' },
      { name: 'Glaceon VMAX', number: '209', rarity: 'specialIllustrationRare' },
      { name: 'Espeon V', number: '179', rarity: 'illustrationRare' },
      { name: 'Espeon VMAX', number: '210', rarity: 'specialIllustrationRare' },
      { name: 'Leafeon V', number: '167', rarity: 'illustrationRare' },
      { name: 'Leafeon VMAX', number: '205', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Raihan', number: '152', rarity: 'ultraRare' },
      { name: 'Raihan', number: '202', rarity: 'illustrationRare' },
      { name: 'Raihan', number: '224', rarity: 'specialIllustrationRare' },
      { name: 'Aroma Lady', number: '141', rarity: 'uncommon' },
      { name: 'Gordie', number: '149', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Brilliant Stars',
    code: 'SWSH9',
    era: 'Sword & Shield',
    printedTotal: '172',
    cards: [
      // Common
      { name: 'Magikarp', number: '026', rarity: 'common' },
      { name: 'Pikachu', number: '043', rarity: 'common' },
      { name: 'Eevee', number: '130', rarity: 'common' },
      // Uncommon
      { name: 'Raichu', number: '044', rarity: 'uncommon' },
      // Rare
      { name: 'Gyarados', number: '027', rarity: 'rare' },
      // Ultra Rare (V / VSTAR)
      { name: 'Charizard V', number: '017', rarity: 'ultraRare' },
      { name: 'Charizard VSTAR', number: '018', rarity: 'ultraRare' },
      { name: 'Arceus V', number: '122', rarity: 'ultraRare' },
      { name: 'Arceus VSTAR', number: '123', rarity: 'ultraRare' },
      { name: 'Shaymin V', number: '001', rarity: 'ultraRare' },
      { name: 'Shaymin VSTAR', number: '002', rarity: 'ultraRare' },
      { name: 'Lumineon V', number: '040', rarity: 'ultraRare' },
      // Alt Arts / Illustration Rare
      { name: 'Charizard V', number: '154', rarity: 'illustrationRare' },
      { name: 'Charizard VSTAR', number: '174', rarity: 'specialIllustrationRare' },
      { name: 'Arceus V', number: '166', rarity: 'illustrationRare' },
      { name: 'Arceus VSTAR', number: '176', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Marnie', number: '145', rarity: 'ultraRare' },
      { name: 'Boss\'s Orders', number: '132', rarity: 'uncommon' },
      { name: 'Professor\'s Research', number: '147', rarity: 'ultraRare' },
      { name: 'Marnie', number: '171', rarity: 'specialIllustrationRare' },
      { name: 'Cynthia\'s Ambition', number: '138', rarity: 'ultraRare' },
      { name: 'Cynthia\'s Ambition', number: '169', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Hidden Fates',
    code: 'SM11.5',
    era: 'Sun & Moon',
    printedTotal: '069',
    cards: [
      // Ultra Rare
      { name: 'Charizard GX', number: 'SV49', rarity: 'ultraRare' },
      { name: 'Mewtwo GX', number: 'SV59', rarity: 'ultraRare' },
      { name: 'Espeon GX', number: 'SV60', rarity: 'ultraRare' },
      { name: 'Umbreon GX', number: 'SV69', rarity: 'ultraRare' },
      { name: 'Rayquaza GX', number: 'SV73', rarity: 'ultraRare' },
      { name: 'Glaceon GX', number: 'SV55', rarity: 'ultraRare' },
      { name: 'Sylveon GX', number: 'SV76', rarity: 'ultraRare' },
      { name: 'Leafeon GX', number: 'SV46', rarity: 'ultraRare' },
      // Illustration Rare (Full Art shiny)
      { name: 'Charizard GX', number: 'SV49', rarity: 'illustrationRare' },
    ]
  },

  // ─── Classic Sets ────────────────────────────────────────────────

  {
    name: 'Base Set',
    code: 'BS',
    era: 'Classic',
    printedTotal: '102',
    cards: [
      // Common
      { name: 'Charmander', number: '046', rarity: 'common' },
      { name: 'Squirtle', number: '063', rarity: 'common' },
      { name: 'Bulbasaur', number: '044', rarity: 'common' },
      { name: 'Pikachu', number: '058', rarity: 'common' },
      { name: 'Rattata', number: '061', rarity: 'common' },
      { name: 'Weedle', number: '069', rarity: 'common' },
      { name: 'Ponyta', number: '060', rarity: 'common' },
      { name: 'Voltorb', number: '067', rarity: 'common' },
      { name: 'Magikarp', number: '035', rarity: 'common' },
      // Uncommon
      { name: 'Charmeleon', number: '024', rarity: 'uncommon' },
      { name: 'Wartortle', number: '042', rarity: 'uncommon' },
      { name: 'Ivysaur', number: '032', rarity: 'uncommon' },
      { name: 'Haunter', number: '029', rarity: 'uncommon' },
      { name: 'Kadabra', number: '032', rarity: 'uncommon' },
      // Rare
      { name: 'Charizard', number: '004', rarity: 'rare' },
      { name: 'Blastoise', number: '002', rarity: 'rare' },
      { name: 'Venusaur', number: '015', rarity: 'rare' },
      { name: 'Alakazam', number: '001', rarity: 'rare' },
      { name: 'Gyarados', number: '006', rarity: 'rare' },
      { name: 'Chansey', number: '003', rarity: 'rare' },
      { name: 'Mewtwo', number: '010', rarity: 'rare' },
      { name: 'Machamp', number: '008', rarity: 'rare' },
      { name: 'Ninetales', number: '012', rarity: 'rare' },
      { name: 'Magneton', number: '009', rarity: 'rare' },
      { name: 'Clefairy', number: '005', rarity: 'rare' },
      { name: 'Hitmonchan', number: '007', rarity: 'rare' },
      { name: 'Raichu', number: '014', rarity: 'rare' },
      { name: 'Zapdos', number: '016', rarity: 'rare' },
      { name: 'Nidoking', number: '011', rarity: 'rare' },
      { name: 'Poliwrath', number: '013', rarity: 'rare' },
    ]
  },

  {
    name: 'Evolutions',
    code: 'XY12',
    era: 'XY',
    printedTotal: '108',
    cards: [
      // Common
      { name: 'Charmander', number: '009', rarity: 'common' },
      { name: 'Squirtle', number: '023', rarity: 'common' },
      { name: 'Bulbasaur', number: '001', rarity: 'common' },
      { name: 'Pikachu', number: '035', rarity: 'common' },
      // Uncommon
      { name: 'Charmeleon', number: '010', rarity: 'uncommon' },
      { name: 'Wartortle', number: '024', rarity: 'uncommon' },
      { name: 'Ivysaur', number: '002', rarity: 'uncommon' },
      // Rare
      { name: 'Charizard', number: '011', rarity: 'rare' },
      { name: 'Blastoise', number: '025', rarity: 'rare' },
      { name: 'Venusaur', number: '003', rarity: 'rare' },
      // Ultra Rare (EX)
      { name: 'Charizard EX', number: '012', rarity: 'ultraRare' },
      { name: 'Blastoise EX', number: '021', rarity: 'ultraRare' },
      { name: 'Venusaur EX', number: '001', rarity: 'ultraRare' },
      { name: 'Mewtwo EX', number: '052', rarity: 'ultraRare' },
      { name: 'Dragonite EX', number: '072', rarity: 'ultraRare' },
      // Full Art
      { name: 'Charizard EX', number: '101', rarity: 'illustrationRare' },
      { name: 'Blastoise EX', number: '102', rarity: 'illustrationRare' },
      { name: 'Mewtwo EX', number: '103', rarity: 'illustrationRare' },
      { name: 'Dragonite EX', number: '106', rarity: 'illustrationRare' },
    ]
  },

  // ─── Additional Popular Sets (key cards only) ───────────────────

  {
    name: 'Shining Fates',
    code: 'SWSH4.5',
    era: 'Sword & Shield',
    printedTotal: '073',
    cards: [
      { name: 'Charizard VMAX', number: 'SV107', rarity: 'ultraRare' },
      { name: 'Charizard V', number: 'SV106', rarity: 'ultraRare' },
      { name: 'Suicune', number: 'SV022', rarity: 'rare' },
      { name: 'Lapras VMAX', number: '037', rarity: 'ultraRare' },
      { name: 'Ditto V', number: '050', rarity: 'ultraRare' },
      { name: 'Ditto VMAX', number: '051', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Lost Origin',
    code: 'SWSH11',
    era: 'Sword & Shield',
    printedTotal: '196',
    cards: [
      { name: 'Giratina V', number: '130', rarity: 'ultraRare' },
      { name: 'Giratina VSTAR', number: '131', rarity: 'ultraRare' },
      { name: 'Giratina V', number: '186', rarity: 'illustrationRare' },
      { name: 'Giratina VSTAR', number: '211', rarity: 'specialIllustrationRare' },
      { name: 'Aerodactyl V', number: '092', rarity: 'ultraRare' },
      { name: 'Aerodactyl VSTAR', number: '093', rarity: 'ultraRare' },
      { name: 'Aerodactyl V', number: '183', rarity: 'illustrationRare' },
    ]
  },

  {
    name: 'Silver Tempest',
    code: 'SWSH12',
    era: 'Sword & Shield',
    printedTotal: '195',
    cards: [
      { name: 'Lugia V', number: '138', rarity: 'ultraRare' },
      { name: 'Lugia VSTAR', number: '139', rarity: 'ultraRare' },
      { name: 'Lugia V', number: '186', rarity: 'illustrationRare' },
      { name: 'Lugia VSTAR', number: '211', rarity: 'specialIllustrationRare' },
      { name: 'Alolan Vulpix VSTAR', number: '075', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Vivid Voltage',
    code: 'SWSH4',
    era: 'Sword & Shield',
    printedTotal: '185',
    cards: [
      { name: 'Pikachu VMAX', number: '044', rarity: 'ultraRare' },
      { name: 'Pikachu V', number: '043', rarity: 'ultraRare' },
      { name: 'Charizard', number: '025', rarity: 'rare' },
      { name: 'Ampharos V', number: '049', rarity: 'ultraRare' },
      { name: 'Dragonite V', number: '076', rarity: 'ultraRare' },
      { name: 'Togekiss VMAX', number: '141', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Astral Radiance',
    code: 'SWSH10',
    era: 'Sword & Shield',
    printedTotal: '189',
    cards: [
      { name: 'Palkia V', number: '039', rarity: 'ultraRare' },
      { name: 'Palkia VSTAR', number: '040', rarity: 'ultraRare' },
      { name: 'Dialga V', number: '113', rarity: 'ultraRare' },
      { name: 'Dialga VSTAR', number: '114', rarity: 'ultraRare' },
      { name: 'Palkia V', number: '167', rarity: 'illustrationRare' },
      { name: 'Palkia VSTAR', number: '195', rarity: 'specialIllustrationRare' },
      { name: 'Dialga V', number: '177', rarity: 'illustrationRare' },
      { name: 'Dialga VSTAR', number: '196', rarity: 'specialIllustrationRare' },
    ]
  },

  {
    name: 'Fusion Strike',
    code: 'SWSH8',
    era: 'Sword & Shield',
    printedTotal: '264',
    cards: [
      { name: 'Mew V', number: '113', rarity: 'ultraRare' },
      { name: 'Mew VMAX', number: '114', rarity: 'ultraRare' },
      { name: 'Gengar V', number: '156', rarity: 'ultraRare' },
      { name: 'Gengar VMAX', number: '157', rarity: 'ultraRare' },
      { name: 'Mew V', number: '250', rarity: 'illustrationRare' },
      { name: 'Mew VMAX', number: '268', rarity: 'specialIllustrationRare' },
      { name: 'Gengar V', number: '253', rarity: 'illustrationRare' },
      { name: 'Gengar VMAX', number: '271', rarity: 'specialIllustrationRare' },
      { name: 'Espeon V', number: '245', rarity: 'illustrationRare' },
      { name: 'Espeon VMAX', number: '270', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Elesa\'s Sparkle', number: '233', rarity: 'ultraRare' },
      { name: 'Elesa\'s Sparkle', number: '260', rarity: 'illustrationRare' },
      { name: 'Sidney', number: '236', rarity: 'ultraRare' },
    ]
  },

  {
    name: 'Chilling Reign',
    code: 'SWSH6',
    era: 'Sword & Shield',
    printedTotal: '198',
    cards: [
      { name: 'Blaziken V', number: '020', rarity: 'ultraRare' },
      { name: 'Blaziken VMAX', number: '021', rarity: 'ultraRare' },
      { name: 'Shadow Rider Calyrex V', number: '074', rarity: 'ultraRare' },
      { name: 'Shadow Rider Calyrex VMAX', number: '075', rarity: 'ultraRare' },
      { name: 'Ice Rider Calyrex V', number: '045', rarity: 'ultraRare' },
      { name: 'Ice Rider Calyrex VMAX', number: '046', rarity: 'ultraRare' },
      { name: 'Shadow Rider Calyrex V', number: '171', rarity: 'illustrationRare' },
      { name: 'Shadow Rider Calyrex VMAX', number: '205', rarity: 'specialIllustrationRare' },
      { name: 'Blaziken V', number: '161', rarity: 'illustrationRare' },
      { name: 'Blaziken VMAX', number: '200', rarity: 'specialIllustrationRare' },
      // Trainers
      { name: 'Melony', number: '146', rarity: 'ultraRare' },
      { name: 'Melony', number: '195', rarity: 'illustrationRare' },
      { name: 'Melony', number: '218', rarity: 'specialIllustrationRare' },
      { name: 'Peony', number: '150', rarity: 'ultraRare' },
      { name: 'Peony', number: '197', rarity: 'illustrationRare' },
    ]
  },

  {
    name: 'Battle Styles',
    code: 'SWSH5',
    era: 'Sword & Shield',
    printedTotal: '163',
    cards: [
      { name: 'Tyranitar V', number: '097', rarity: 'ultraRare' },
      { name: 'Tyranitar VMAX', number: '098', rarity: 'ultraRare' },
      { name: 'Urshifu V', number: '085', rarity: 'ultraRare' },
      { name: 'Urshifu VMAX', number: '086', rarity: 'ultraRare' },
      { name: 'Tyranitar V', number: '155', rarity: 'illustrationRare' },
      { name: 'Urshifu VMAX', number: '167', rarity: 'specialIllustrationRare' },
    ]
  },
];

// ─── Derived data ─────────────────────────────────────────────────

/** All set names from the catalog */
export const CATALOG_SET_NAMES = CARD_CATALOG.map(s => s.name);

/** All unique card names from the catalog */
export const CATALOG_CARD_NAMES = [
  ...new Set(CARD_CATALOG.flatMap(s => s.cards.map(c => c.name)))
];

/** Rarity display labels and sort order */
export const RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'ultraRare',
  'illustrationRare',
  'specialIllustrationRare',
  'megaIllustrationRare',
];

export const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  ultraRare: 'Ultra Rare',
  illustrationRare: 'Illustration Rare',
  specialIllustrationRare: 'Special Illustration Rare',
  megaIllustrationRare: 'Mega Illustration Rare',
};

export default CARD_CATALOG;
