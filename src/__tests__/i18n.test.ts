import { t, getLocale, setLocale } from '@/lib/i18n';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to zh-TW locale', () => {
    expect(getLocale()).toBe('zh-TW');
  });

  it('switches locale', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
  });

  it('persists locale in localStorage', () => {
    setLocale('en');
    expect(localStorage.getItem('passeport_locale')).toBe('en');
  });

  it('returns zh-TW translations by default', () => {
    const result = t('nav.home');
    expect(result).toBe('首頁');
  });

  it('returns English translations when locale is en', () => {
    setLocale('en');
    const result = t('nav.home');
    expect(result).toBe('Home');
  });

  it('returns key for missing translations', () => {
    const result = t('nonexistent.key');
    expect(result).toBe('nonexistent.key');
  });

  it('translates navigation keys', () => {
    const navKeys = ['nav.home', 'nav.discover', 'nav.create', 'nav.map', 'nav.profile'];
    navKeys.forEach(key => {
      expect(t(key)).not.toBe(key); // Should not return the key itself
    });
  });
});
