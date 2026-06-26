export type CharacterStatus = 'Alive' | 'Dead' | 'unknown';

export type CharacterGender = 'Female' | 'Male' | 'Genderless' | 'unknown';

export type RickAndMortyCharacter = {
  id: number;
  name: string;
  status: CharacterStatus;
  species: string;
  gender: CharacterGender;
  location: string;
  episodeCount: number;
};

export type CharacterSortKey =
  | 'id'
  | 'name'
  | 'status'
  | 'species'
  | 'location';

export type CharacterSortOrder = 'asc' | 'desc';

export type QueryRickAndMortyCharactersParams = {
  keyword?: string;
  statuses?: CharacterStatus[];
  sortBy: CharacterSortKey;
  order: CharacterSortOrder;
  page: number;
  pageSize: number;
};

export type QueryRickAndMortyCharactersResult = {
  rows: RickAndMortyCharacter[];
  total: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
};

type CharacterSeed = readonly [
  name: string,
  status: CharacterStatus,
  species: string,
  gender: CharacterGender,
  location: string,
  episodeCount: number,
];

const characterSeeds: CharacterSeed[] = [
  ['Rick Sanchez', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 51],
  ['Morty Smith', 'Alive', 'Human', 'Male', 'Earth', 51],
  ['Summer Smith', 'Alive', 'Human', 'Female', 'Earth', 42],
  ['Beth Smith', 'Alive', 'Human', 'Female', 'Earth', 42],
  ['Jerry Smith', 'Alive', 'Human', 'Male', 'Earth', 39],
  ['Abadango Cluster Princess', 'Alive', 'Alien', 'Female', 'Abadango', 1],
  [
    'Abradolf Lincler',
    'unknown',
    'Human',
    'Male',
    'Testicle Monster Dimension',
    2,
  ],
  ['Adjudicator Rick', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Agency Director', 'Dead', 'Human', 'Male', 'Earth', 1],
  ['Alan Rails', 'Dead', 'Human', 'Male', 'Worldender’s lair', 1],
  ['Albert Einstein', 'Dead', 'Human', 'Male', 'Earth', 1],
  ['Alexander', 'Dead', 'Human', 'Male', 'Anatomy Park', 1],
  ['Alien Googah', 'unknown', 'Alien', 'unknown', 'Earth', 1],
  ['Alien Morty', 'unknown', 'Alien', 'Male', 'Citadel of Ricks', 1],
  ['Alien Rick', 'unknown', 'Alien', 'Male', 'Citadel of Ricks', 1],
  ['Amish Cyborg', 'Dead', 'Alien', 'Male', 'unknown', 1],
  ['Annie', 'Alive', 'Human', 'Female', 'Anatomy Park', 1],
  ['Antenna Morty', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 2],
  ['Antenna Rick', 'unknown', 'Human', 'Male', 'Citadel of Ricks', 1],
  [
    'Ants in my Eyes Johnson',
    'unknown',
    'Human',
    'Male',
    'Interdimensional Cable',
    1,
  ],
  ['Aqua Morty', 'unknown', 'Humanoid', 'Male', 'Citadel of Ricks', 1],
  ['Aqua Rick', 'unknown', 'Humanoid', 'Male', 'Citadel of Ricks', 1],
  ['Arcade Alien', 'unknown', 'Alien', 'Male', 'Immortality Field Resort', 1],
  ['Armagheadon', 'Alive', 'Alien', 'Male', 'Signus 5 Expanse', 1],
  ['Armothy', 'Dead', 'Humanoid', 'Male', 'Post-Apocalyptic Earth', 1],
  ['Arthricia', 'Alive', 'Alien', 'Female', 'Purge Planet', 1],
  ['Artist Morty', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Attila Starwar', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Baby Legs', 'Alive', 'Human', 'Male', 'Interdimensional Cable', 1],
  ['Baby Poopybutthole', 'Alive', 'Poopybutthole', 'Male', 'Earth', 1],
  ['Baby Wizard', 'Dead', 'Alien', 'Male', 'Interdimensional Cable', 1],
  ['Bearded Lady', 'Dead', 'Human', 'Female', 'Earth', 1],
  ['Beebo', 'Dead', 'Alien', 'Male', 'Venzenulon 7', 1],
  ['Benjamin', 'Alive', 'Poopybutthole', 'Male', 'Earth', 3],
  ['Bepisian', 'Alive', 'Alien', 'unknown', 'Bepis 9', 1],
  ['Beta-Seven', 'Alive', 'Alien', 'unknown', 'unknown', 1],
  ['Beth Sanchez', 'Alive', 'Human', 'Female', 'Earth', 2],
  ['Beth Smith', 'Alive', 'Human', 'Female', 'Earth', 8],
  ['Beth Smith', 'Alive', 'Human', 'Female', 'Earth', 8],
  ["Beth's Mytholog", 'Dead', 'Mythological Creature', 'Female', 'Nuptia 4', 1],
  [
    'Big Boobed Waitress',
    'Alive',
    'Mythological Creature',
    'Female',
    'Fantasy World',
    1,
  ],
  ['Big Head Morty', 'unknown', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Big Morty', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Body Guard Morty', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Bill', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Bill', 'Alive', 'Animal', 'Male', 'Earth', 1],
  ['Birdperson', 'Alive', 'Alien', 'Male', 'Bird World', 6],
  ['Black Rick', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 2],
  ['Blamph', 'Alive', 'Alien', 'unknown', 'unknown', 1],
  ['Blim Blam', 'Alive', 'Alien', 'Male', 'Earth', 1],
  ['Blue Diplomat', 'Alive', 'Alien', 'Male', 'Interdimensional Cable', 1],
  ['Blue Footprint Guy', 'Dead', 'Alien', 'Male', 'unknown', 1],
  ['Blue Shirt Morty', 'unknown', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Bobby Moynihan', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Boobloosian', 'Dead', 'Alien', 'unknown', 'unknown', 1],
  [
    'Bootleg Portal Chemist Rick',
    'Dead',
    'Human',
    'Male',
    'Citadel of Ricks',
    1,
  ],
  ['Borbocian', 'Alive', 'Alien', 'unknown', 'Borbos', 1],
  ['Brad', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Brad Anderson', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Calypso', 'Dead', 'Superhuman', 'Female', 'Worldender’s lair', 1],
  ['Campaign Manager Morty', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Canklanker Thom', 'Dead', 'Alien', 'Male', 'unknown', 1],
  ['Centaur', 'Alive', 'Mythological Creature', 'Male', 'Fantasy World', 1],
  ['Chris', 'Dead', 'Alien', 'Male', 'Earth', 1],
  ['Chris', 'Alive', 'Human', 'Male', 'Earth', 1],
  ['Coach Feratu', 'Dead', 'Vampire', 'Male', 'Earth', 1],
  ['Collector', 'Alive', 'Alien', 'Male', 'The Menagerie', 1],
  ['Colossus', 'Dead', 'Humanoid', 'Male', 'Post-Apocalyptic Earth', 1],
  ['Commander Rick', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Concerto', 'Dead', 'Humanoid', 'Male', 'Earth', 1],
  ['Conroy', 'Dead', 'Robot', 'unknown', 'The Menagerie', 1],
  ['Cool Rick', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Cop Morty', 'Dead', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Cop Rick', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Courier Flap', 'Alive', 'Alien', 'unknown', 'unknown', 1],
  ['Cousin Nicky', 'Dead', 'Human', 'Male', 'Earth', 1],
  ['Cowboy Morty', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Cowboy Rick', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Crab Spider', 'Alive', 'Alien', 'unknown', 'unknown', 1],
  ['Creepy Little Girl', 'Alive', 'Human', 'Female', 'Earth', 1],
  ['Crocubot', 'Dead', 'Robot', 'Male', 'Worldender’s lair', 1],
  ['Cronenberg Rick', 'unknown', 'Cronenberg', 'Male', 'Cronenberg Earth', 1],
  ['Cronenberg Morty', 'unknown', 'Cronenberg', 'Male', 'Cronenberg Earth', 1],
  ['Cult Leader Morty', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Cyclops Morty', 'Alive', 'Humanoid', 'Male', 'Citadel of Ricks', 1],
  ['Cyclops Rick', 'Alive', 'Humanoid', 'Male', 'Citadel of Ricks', 1],
  ['Cynthia', 'Dead', 'Human', 'Female', 'Earth', 1],
  ['Cynthia', 'Alive', 'Human', 'Female', 'Earth', 1],
  ['Dandy Rick', 'Alive', 'Human', 'Male', 'Citadel of Ricks', 1],
  ['Daphne', 'Alive', 'Human', 'Female', 'Earth', 1],
  ['Darren', 'Dead', 'Human', 'Male', 'Earth', 1],
  ['Davin', 'Dead', 'Human', 'Male', 'Earth', 1],
  ['Diablo Verde', 'Dead', 'Alien', 'Male', 'Worldender’s lair', 1],
  ['Diane Sanchez', 'Dead', 'Human', 'Female', 'Earth', 1],
  [
    'Dipper and Mabel Mortys',
    'unknown',
    'Human',
    'unknown',
    'Citadel of Ricks',
    1,
  ],
  ['Tuberculosis', 'Dead', 'Disease', 'unknown', 'Anatomy Park', 1],
  ['Gonorrhea', 'Dead', 'Disease', 'unknown', 'Anatomy Park', 1],
  ['Hepatitis A', 'Dead', 'Disease', 'unknown', 'Anatomy Park', 1],
  ['Hepatitis C', 'Dead', 'Disease', 'unknown', 'Anatomy Park', 1],
  ['Bacteria', 'Dead', 'Disease', 'unknown', 'Anatomy Park', 1],
];

export const rickAndMortyCharacters: RickAndMortyCharacter[] =
  characterSeeds.map(
    ([name, status, species, gender, location, episodeCount], index) => ({
      id: index + 1,
      name,
      status,
      species,
      gender,
      location,
      episodeCount,
    }),
  );

export const queryRickAndMortyCharacters = ({
  keyword,
  statuses,
  sortBy,
  order,
  page,
  pageSize,
}: QueryRickAndMortyCharactersParams): QueryRickAndMortyCharactersResult => {
  const filteredRows = filterRickAndMortyCharacters(keyword, statuses);
  const sortedRows = sortRickAndMortyCharacters(filteredRows, sortBy, order);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + pageSize);

  return {
    rows,
    total: filteredRows.length,
    page,
    pageCount,
    rangeStart: rows.length === 0 ? 0 : startIndex + 1,
    rangeEnd: startIndex + rows.length,
  };
};

export const fetchRickAndMortyCharacters = async (
  params: QueryRickAndMortyCharactersParams,
): Promise<QueryRickAndMortyCharactersResult> => {
  await delay(1500);

  return queryRickAndMortyCharacters(params);
};

const filterRickAndMortyCharacters = (
  keyword: string | undefined,
  statuses: CharacterStatus[] | undefined,
) => {
  const normalizedKeyword = keyword?.toLowerCase() ?? '';
  const activeStatuses = new Set(statuses ?? []);

  return rickAndMortyCharacters.filter((row) => {
    const keywordMatched =
      normalizedKeyword.length === 0 ||
      row.name.toLowerCase().includes(normalizedKeyword) ||
      row.species.toLowerCase().includes(normalizedKeyword) ||
      row.location.toLowerCase().includes(normalizedKeyword);
    const statusMatched =
      activeStatuses.size === 0 || activeStatuses.has(row.status);

    return keywordMatched && statusMatched;
  });
};

const sortRickAndMortyCharacters = (
  visibleRows: RickAndMortyCharacter[],
  sortBy: CharacterSortKey,
  order: CharacterSortOrder,
) => {
  return [...visibleRows].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

    return order === 'asc' ? result : -result;
  });
};

const delay = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};
