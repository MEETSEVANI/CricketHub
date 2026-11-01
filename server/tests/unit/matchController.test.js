jest.mock('../../src/config/database', () => ({ query: jest.fn() }));

const pool = require('../../src/config/database');
const { listMatches, getMatch } = require('../../src/controllers/matchController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

describe('matchController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('searches match names and teams with parameterized values and status filter', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 7, match_name: 'Final' }] });
    const res = response();

    await listMatches({ query: { q: 'final', status: 'Scheduled' } }, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('match_name ILIKE $1 OR team_a ILIKE $1 OR team_b ILIKE $1'), ['%final%', 'Scheduled']);
    expect(pool.query.mock.calls[0][0]).toContain('status = $2');
    expect(pool.query.mock.calls[0][0]).toContain('ORDER BY match_datetime ASC LIMIT 100');
    expect(res.body).toEqual({ status: 'success', matches: [{ id: 7, match_name: 'Final' }] });
  });

  test('rejects an unsupported status without querying the database', async () => {
    const res = response();

    await listMatches({ query: { status: 'In Progress' } }, res);

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns match details with lineups and completed performances', async () => {
    const match = { id: 7, status: 'Completed', match_name: 'Final' };
    const lineups = [{ team_name: 'Falcons', player_id: 3, name: 'A. Player' }];
    const performances = [{ player_id: 3, name: 'A. Player', runs: 42, wickets: 1 }];
    pool.query
      .mockResolvedValueOnce({ rows: [match] })
      .mockResolvedValueOnce({ rows: lineups })
      .mockResolvedValueOnce({ rows: performances });
    const res = response();

    await getMatch({ params: { id: '7' } }, res);

    expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM matches WHERE id=$1'), [7]);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(res.body).toEqual({ status: 'success', match, lineups, performances });
  });

  test('rejects an invalid match id without querying the database', async () => {
    const res = response();

    await getMatch({ params: { id: '0' } }, res);

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
