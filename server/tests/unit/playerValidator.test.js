const { validatePlayer } = require('../../src/validators/playerValidator');

describe('validatePlayer', () => {
  const validPlayer = {
    name: 'Aarav Mehta', age: 29, country: 'India', role: 'Batsman',
    total_matches: 10, total_runs: 250, total_wickets: 1,
  };

  test('normalizes text and accepts a valid player', () => {
    const result = validatePlayer({ ...validPlayer, name: '  Aarav Mehta  ' });
    expect(result.errors).toEqual([]);
    expect(result.player.name).toBe('Aarav Mehta');
  });

  test('rejects unsupported roles and invalid statistic values', () => {
    const result = validatePlayer({ ...validPlayer, role: 'Coach', total_runs: -1 });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('Role must be one of'),
      expect.stringContaining('total runs must be a non-negative whole number'),
    ]));
  });

  test('rejects missing required fields', () => {
    const result = validatePlayer({ ...validPlayer, country: '' });
    expect(result.errors).toContain('Country is required and must be 80 characters or fewer.');
  });

  test('rejects a non-object request body without throwing', () => {
    expect(() => validatePlayer(null)).not.toThrow();
    expect(validatePlayer(null).errors.length).toBeGreaterThan(0);
  });
});
