import { CATEGORIES, Category } from '@/lib/types';

describe('Types & Constants', () => {
  it('has 10 categories', () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it('each category has required fields', () => {
    CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('value');
      expect(cat).toHaveProperty('labelEn');
      expect(cat).toHaveProperty('labelZh');
      expect(cat).toHaveProperty('icon');
      expect(typeof cat.value).toBe('string');
      expect(typeof cat.labelEn).toBe('string');
      expect(typeof cat.labelZh).toBe('string');
      expect(cat.icon.length).toBeGreaterThan(0);
    });
  });

  it('has unique category values', () => {
    const values = CATEGORIES.map(c => c.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('all category values match Category type', () => {
    const validValues: Category[] = [
      'style_diary', 'travel_notes', 'city_guide', 'cafe_journal',
      'table_taste', 'beauty_rituals', 'culture_calendar',
      'living_aesthetic', 'personal_essay', 'curated_picks',
    ];
    CATEGORIES.forEach(cat => {
      expect(validValues).toContain(cat.value);
    });
  });
});
