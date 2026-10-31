const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'];

function validatePlayer(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const errors = [];
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const country = typeof input.country === 'string' ? input.country.trim() : '';

  if (!name || name.length > 120) {
    errors.push('Player name is required and must be 120 characters or fewer.');
  }

  if (!country || country.length > 80) {
    errors.push('Country is required and must be 80 characters or fewer.');
  }

  if (!PLAYER_ROLES.includes(input.role)) {
    errors.push(`Role must be one of: ${PLAYER_ROLES.join(', ')}.`);
  }

  const age = Number(input.age);
  if (!Number.isInteger(age) || age < 1 || age > 100) {
    errors.push('Age must be a whole number between 1 and 100.');
  }

  for (const field of ['total_matches', 'total_runs', 'total_wickets']) {
    const value = Number(input[field] ?? 0);
    if (!Number.isInteger(value) || value < 0) {
      errors.push(`${field.replaceAll('_', ' ')} must be a non-negative whole number.`);
    }
  }

  if (errors.length > 0) return { errors };

  return {
    errors,
    player: {
      name,
      age,
      country,
      role: input.role,
      total_matches: Number(input.total_matches ?? 0),
      total_runs: Number(input.total_runs ?? 0),
      total_wickets: Number(input.total_wickets ?? 0),
    },
  };
}

module.exports = { PLAYER_ROLES, validatePlayer };
