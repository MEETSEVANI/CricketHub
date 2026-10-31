INSERT INTO players (name, age, country, role, total_matches, total_runs, total_wickets)
SELECT seed.name, seed.age, seed.country, seed.role, seed.total_matches, seed.total_runs, seed.total_wickets
FROM (VALUES
    ('Aarav Mehta', 29, 'India', 'Batsman', 84, 3120, 2),
    ('Zoya Khan', 27, 'Pakistan', 'All-Rounder', 71, 1840, 46),
    ('Noah Williams', 31, 'Australia', 'Bowler', 96, 410, 128),
    ('Maya Patel', 25, 'England', 'Wicketkeeper', 62, 1510, 0),
    ('Ravi Perera', 30, 'Sri Lanka', 'Bowler', 79, 305, 103),
    ('Sam Okafor', 28, 'South Africa', 'All-Rounder', 68, 1420, 39)
) AS seed(name, age, country, role, total_matches, total_runs, total_wickets)
WHERE NOT EXISTS (
    SELECT 1 FROM players existing WHERE LOWER(existing.name) = LOWER(seed.name)
);

INSERT INTO matches (match_name, team_a, team_b, match_datetime, venue, status, result)
SELECT seed.match_name, seed.team_a, seed.team_b, seed.match_datetime::timestamptz,
       seed.venue, seed.status, seed.result
FROM (VALUES
    ('Harbour Cup: North vs South', 'North Stars', 'South Falcons', '2026-10-10 18:30:00+00', 'Harbour Ground', 'Completed', 'North Stars won by 18 runs'),
    ('City Series: Lions vs Falcons', 'City Lions', 'River Falcons', '2026-10-24 14:00:00+00', 'Central Oval', 'Completed', 'River Falcons won by 4 wickets'),
    ('Autumn Shield: Stars vs Mariners', 'North Stars', 'Bay Mariners', '2026-11-08 15:00:00+00', 'Harbour Ground', 'Scheduled', NULL),
    ('Autumn Shield: Rangers vs Lions', 'Hill Rangers', 'City Lions', '2026-11-15 13:30:00+00', 'Riverside Park', 'Scheduled', NULL)
) AS seed(match_name, team_a, team_b, match_datetime, venue, status, result)
WHERE NOT EXISTS (
    SELECT 1 FROM matches existing WHERE existing.match_name = seed.match_name
);

INSERT INTO lineups (match_id, player_id, team_name)
SELECT m.id, p.id, seed.team_name
FROM (VALUES
    ('Harbour Cup: North vs South', 'Aarav Mehta', 'North Stars'),
    ('Harbour Cup: North vs South', 'Noah Williams', 'North Stars'),
    ('Harbour Cup: North vs South', 'Zoya Khan', 'South Falcons'),
    ('Harbour Cup: North vs South', 'Ravi Perera', 'South Falcons'),
    ('City Series: Lions vs Falcons', 'Maya Patel', 'City Lions'),
    ('City Series: Lions vs Falcons', 'Sam Okafor', 'River Falcons')
) AS seed(match_name, player_name, team_name)
JOIN matches m ON m.match_name = seed.match_name
JOIN players p ON p.name = seed.player_name
WHERE NOT EXISTS (
    SELECT 1 FROM lineups existing
    WHERE existing.match_id = m.id AND existing.player_id = p.id AND existing.team_name = seed.team_name
);

INSERT INTO performances (match_id, player_id, runs, wickets)
SELECT m.id, p.id, seed.runs, seed.wickets
FROM (VALUES
    ('Harbour Cup: North vs South', 'Aarav Mehta', 68, 0),
    ('Harbour Cup: North vs South', 'Zoya Khan', 34, 2),
    ('Harbour Cup: North vs South', 'Noah Williams', 8, 3),
    ('Harbour Cup: North vs South', 'Ravi Perera', 12, 2),
    ('City Series: Lions vs Falcons', 'Maya Patel', 41, 0),
    ('City Series: Lions vs Falcons', 'Sam Okafor', 29, 1)
) AS seed(match_name, player_name, runs, wickets)
JOIN matches m ON m.match_name = seed.match_name AND m.status = 'Completed'
JOIN players p ON p.name = seed.player_name
WHERE NOT EXISTS (
    SELECT 1 FROM performances existing WHERE existing.match_id = m.id AND existing.player_id = p.id
);
