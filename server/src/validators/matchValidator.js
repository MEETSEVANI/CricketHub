const MATCH_STATUSES = ['Scheduled', 'Completed'];

function validateMatch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const errors = [];
  const matchName = typeof input.match_name === 'string' ? input.match_name.trim() : '';
  const teamA = typeof input.team_a === 'string' ? input.team_a.trim() : '';
  const teamB = typeof input.team_b === 'string' ? input.team_b.trim() : '';
  const venue = typeof input.venue === 'string' ? input.venue.trim() : '';
  const result = typeof input.result === 'string' ? input.result.trim() : '';
  const matchDateTime = typeof input.match_datetime === 'string' ? input.match_datetime.trim() : '';
  const status = input.status;

  if (!matchName || matchName.length > 160) errors.push('Match name is required and must be 160 characters or fewer.');
  if (!teamA || teamA.length > 100) errors.push('Team A is required and must be 100 characters or fewer.');
  if (!teamB || teamB.length > 100) errors.push('Team B is required and must be 100 characters or fewer.');
  if (teamA && teamB && teamA.toLocaleLowerCase() === teamB.toLocaleLowerCase()) errors.push('Teams must be different.');
  if (!venue || venue.length > 160) errors.push('Venue is required and must be 160 characters or fewer.');
  if (!matchDateTime || Number.isNaN(Date.parse(matchDateTime))) errors.push('A valid match date and time is required.');
  if (!MATCH_STATUSES.includes(status)) errors.push(`Status must be one of: ${MATCH_STATUSES.join(', ')}.`);
  if (result.length > 240) errors.push('Result must be 240 characters or fewer.');
  if (status === 'Completed' && !result) errors.push('Completed matches need a result.');

  if (errors.length > 0) return { errors };

  return {
    errors,
    match: {
      match_name: matchName,
      team_a: teamA,
      team_b: teamB,
      match_datetime: new Date(matchDateTime).toISOString(),
      venue,
      status,
      result: result || null,
    },
  };
}

module.exports = { MATCH_STATUSES, validateMatch };
