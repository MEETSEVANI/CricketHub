function validatePlayerIds(value, teamLabel, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${teamLabel} lineup must be a list of player ids.`);
    return [];
  }
  if (value.length > 11) errors.push(`${teamLabel} lineup cannot contain more than 11 players.`);
  if (value.some((id) => !Number.isInteger(id) || id < 1)) errors.push(`${teamLabel} lineup contains an invalid player id.`);
  if (new Set(value).size !== value.length) errors.push(`${teamLabel} lineup cannot contain a player more than once.`);
  return value;
}

function validateLineups(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const errors = [];
  const teamAPlayerIds = validatePlayerIds(input.team_a_player_ids, 'Team A', errors);
  const teamBPlayerIds = validatePlayerIds(input.team_b_player_ids, 'Team B', errors);
  if (teamAPlayerIds.some((id) => teamBPlayerIds.includes(id))) {
    errors.push('A player cannot be assigned to both team lineups in the same match.');
  }
  return { errors, lineups: { team_a_player_ids: teamAPlayerIds, team_b_player_ids: teamBPlayerIds } };
}

function validatePerformances(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const errors = [];
  const performances = input.performances;
  if (!Array.isArray(performances)) {
    errors.push('Performances must be a list.');
    return { errors };
  }
  if (performances.length > 22) errors.push('A match cannot have more than 22 player performances.');

  const normalized = performances.map((performance) => {
    const playerId = performance?.player_id;
    const runs = performance?.runs;
    const wickets = performance?.wickets;
    if (!Number.isInteger(playerId) || playerId < 1) errors.push('Each performance must have a valid player id.');
    if (!Number.isInteger(runs) || runs < 0) errors.push('Runs must be a non-negative whole number.');
    if (!Number.isInteger(wickets) || wickets < 0) errors.push('Wickets must be a non-negative whole number.');
    return { player_id: playerId, runs, wickets };
  });
  if (new Set(normalized.map((item) => item.player_id)).size !== normalized.length) {
    errors.push('A player can have only one performance record per match.');
  }
  return { errors, performances: normalized };
}

module.exports = { validateLineups, validatePerformances };
