CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Registered User',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check
        CHECK (role IN ('Registered User', 'Administrator'))
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    age SMALLINT NOT NULL CHECK (age BETWEEN 1 AND 100),
    country VARCHAR(80) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper')),
    total_matches INTEGER NOT NULL DEFAULT 0 CHECK (total_matches >= 0),
    total_runs INTEGER NOT NULL DEFAULT 0 CHECK (total_runs >= 0),
    total_wickets INTEGER NOT NULL DEFAULT 0 CHECK (total_wickets >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS players_name_lower_idx ON players (LOWER(name));

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    match_name VARCHAR(160) NOT NULL UNIQUE,
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    match_datetime TIMESTAMPTZ NOT NULL,
    venue VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled', 'Completed')),
    result VARCHAR(240),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT matches_distinct_teams CHECK (LOWER(team_a) <> LOWER(team_b)),
    CONSTRAINT completed_match_has_result
        CHECK (status <> 'Completed' OR NULLIF(TRIM(result), '') IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS matches_name_lower_idx ON matches (LOWER(match_name));
CREATE INDEX IF NOT EXISTS matches_status_datetime_idx ON matches (status, match_datetime);

CREATE TABLE IF NOT EXISTS lineups (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lineups_unique_player_per_team UNIQUE (match_id, team_name, player_id)
);

CREATE INDEX IF NOT EXISTS lineups_match_team_idx ON lineups (match_id, team_name);

CREATE TABLE IF NOT EXISTS performances (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
    wickets INTEGER NOT NULL DEFAULT 0 CHECK (wickets >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT performances_unique_player_per_match UNIQUE (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS favourites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT favourites_one_target CHECK (
        (player_id IS NOT NULL AND match_id IS NULL)
        OR (player_id IS NULL AND match_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS favourites_unique_player_idx
    ON favourites (user_id, player_id) WHERE player_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favourites_unique_match_idx
    ON favourites (user_id, match_id) WHERE match_id IS NOT NULL;
