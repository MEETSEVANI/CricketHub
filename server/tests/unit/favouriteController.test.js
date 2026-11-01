jest.mock('../../src/config/database', () => ({ query: jest.fn() }));

const pool = require('../../src/config/database');
const {
  listFavourites,
  addFavourite,
  removeFavourite,
} = require('../../src/controllers/favouriteController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

describe('favouriteController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists only the authenticated user favourites', async () => {
    const favourites = [{ id: 5, type: 'player', player_id: 21, player_name: 'Aarav Mehta' }];
    pool.query.mockResolvedValue({ rows: favourites });
    const res = response();

    await listFavourites({ user: { userId: 12 } }, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE f.user_id=$1'), [12]);
    expect(res.body).toEqual({ status: 'success', favourites });
  });

  test('adds a valid match favourite for the authenticated user', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 8 }] });
    const res = response();

    await addFavourite({ user: { userId: 12 }, body: { type: 'match', id: '31' } }, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('match_id'), [12, 31]);
    expect(res.statusCode).toBe(201);
    expect(res.body.favouriteId).toBe(8);
  });

  test('rejects invalid favourite targets without querying the database', async () => {
    const res = response();

    await addFavourite({ user: { userId: 12 }, body: { type: 'match', id: 0 } }, res);

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('reports duplicate favourites as a conflict', async () => {
    pool.query.mockRejectedValue({ code: '23505' });
    const res = response();

    await addFavourite({ user: { userId: 12 }, body: { type: 'player', id: 21 } }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already/i);
  });

  test('removes only the selected user and player favourite', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 8 }] });
    const res = response();

    await removeFavourite({ user: { userId: 12 }, params: { type: 'player', id: '21' } }, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('user_id=$1 AND player_id=$2'), [12, 21]);
    expect(res.body).toEqual({ status: 'success', message: 'Removed from favourites.' });
  });
});
