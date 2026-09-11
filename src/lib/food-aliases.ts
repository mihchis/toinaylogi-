export type FoodAliasTier = 0 | 1 | 2 | 3 | 4;

// Preserved from the previous food pool. The original price bands map directly
// to the current rarity tiers: <=40, <=65, <=100, <=130, and everything above.
export const foodAliasesByTier = [
  [
    'Bánh mì',
    'Cơm chay',
    'Hủ tiếu',
    'Bún thịt nướng',
    'Bánh cuốn',
    'Bún cá',
    'Gỏi cuốn',
    'Cháo sườn',
    'Mì nấm chay',
    'Bánh mì chay',
    'Gỏi cuốn chay',
    'Cơm bình dân',
    'Bún chay',
    'Cháo lòng',
    'Bánh mì kebab',
    'Xôi mặn',
  ],
  [
    'Cơm tấm',
    'Phở bò',
    'Bún chả',
    'Gà rán',
    'Cơm gà Hội An',
    'Bún bò Huế',
    'Mì Quảng',
    'Bún đậu mắm tôm',
    'Cơm rang dưa bò',
    'Bánh xèo',
    'Bánh đa cua',
    'Mì xào bò',
    'Tteokbokki',
    'Burger bò',
    'Cơm gà xối mỡ',
    'Bún riêu',
    'Bánh canh cua',
    'Phở gà',
    'Bún mọc',
    'Bún măng vịt',
    'Bún bò Nam Bộ',
    'Bún mắm',
    'Bánh canh giò heo',
    'Miến gà',
    'Miến lươn',
    'Cháo vịt',
    'Bánh hỏi heo quay',
    'Nem nướng',
    'Mì hoành thánh',
    'Mì cay Hàn Quốc',
    'Cơm chiên kimchi',
    'Nui xào bò',
    'Cháo gà',
    'Bò kho bánh mì',
    'Bánh mì chảo',
    'Cơm xá xíu',
    'Mì xá xíu',
    'Miến xào',
  ],
  [
    'Pizza',
    'Bibimbap',
    'Bò lúc lắc',
    'Ramen',
    'Udon',
    'Cơm cà ri Nhật',
    'Mì Ý bò bằm',
    'Pad Thai',
    'Mì Tom Yum',
    'Bò né',
    'Cơm gà teriyaki',
    'Cơm heo chiên xù',
    'Cơm chiên hải sản',
    'Mì vịt tiềm',
    'Kimbap',
    'Mì trộn Hàn Quốc',
    'Salad ức gà',
    'Phở cuốn',
    'Mì bò Đài Loan',
    'Mì xào giòn',
    'Cơm niêu Singapore',
    'Cơm gà Hải Nam',
    'Cơm gà trứng Nhật',
    'Mì tương đen',
    'Mì lạnh Hàn Quốc',
    'Canh kimchi kèm cơm',
    'Canh đậu hũ non kèm cơm',
    'Sandwich',
    'Bánh cuộn gà',
    'Cơm vịt quay',
    'Burger gà & khoai tây',
  ],
  [
    'Lẩu nấm chay',
    'Mì Ý sốt kem bacon',
    'Lasagna bò',
    'Burger bò phô mai & khoai tây',
    'Pizza pepperoni',
    'Cơm bò gyudon',
    'Cơm cá saba nướng',
    'Mì soba Nhật',
    'Cơm cà ri Thái',
    'Salad cá ngừ',
    'Salad quinoa đậu gà',
    'Dimsum',
    'Cơm tempura',
    'Gà phô mai Hàn Quốc',
    'Lẩu Thái một người',
    'Bánh xèo Nhật',
    'Mì udon xào',
  ],
  [
    'Sushi cá hồi',
    'Bò bít tết',
    'Cá hồi áp chảo',
    'Cơm lươn Nhật',
    'Cơm bò nướng Hàn',
    'Cơm cá hồi teriyaki',
    'Poke cá hồi',
    'Sườn nướng BBQ',
    'Pizza hải sản',
    'Mì Ý hải sản',
    'Lẩu bò cá nhân',
    'Lẩu sukiyaki một người',
    'Cà ri Ấn Độ & naan',
    'Cơm biryani',
    'Burrito',
    'Taco',
    'Quesadilla',
    'Fish & chips',
    'Gà nướng kèm khoai tây',
    'Mac & cheese',
    'Mì Ý pesto',
    'Mì Ý cá hồi',
    'Cơm risotto',
    'Gnocchi',
    'Falafel kèm pita',
    'Mì Ý sốt cà chua & phô mai',
  ],
] as const satisfies readonly (readonly string[])[];

export function isFoodAliasForTier(value: string, tier: FoodAliasTier) {
  return (foodAliasesByTier[tier] as readonly string[]).includes(value);
}

function draw(random: () => number) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('Random draw must be in [0,1)');
  return value;
}

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(draw(random) * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

export function createSeededRandom(seed: string) {
  let state = 2_166_136_261;
  for (const character of seed) {
    state ^= character.codePointAt(0)!;
    state = Math.imul(state, 16_777_619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function assignFoodAliases<T extends { tier: FoodAliasTier }>(
  items: readonly T[],
  random: () => number,
): Array<T & { publicName: string }> {
  const names = new Array<string>(items.length);
  for (const tier of [0, 1, 2, 3, 4] as const) {
    const indexes = items.flatMap((item, index) =>
      item.tier === tier ? [index] : [],
    );
    const pool = foodAliasesByTier[tier];
    let aliases: string[] = [];
    let position = 0;
    for (const index of indexes) {
      if (position === aliases.length) {
        aliases = shuffled(pool, random);
        position = 0;
      }
      names[index] = aliases[position++]!;
    }
  }
  return items.map((item, index) => ({
    ...item,
    publicName: names[index]!,
  }));
}
