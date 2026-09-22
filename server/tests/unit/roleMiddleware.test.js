const { requireAdmin } = require('../../src/middleware/roleMiddleware');

describe('requireAdmin', () => {
  test('rejects requests without an authenticated user', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication required.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects Registered Users', () => {
    const req = {
      user: {
        userId: 1,
        role: 'Registered User',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Administrator access required.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows Administrators to continue', () => {
    const req = {
      user: {
        userId: 2,
        role: 'Administrator',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});