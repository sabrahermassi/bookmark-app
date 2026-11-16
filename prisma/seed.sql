-- the test user, until auth exists (step 4)
INSERT INTO users (id, email, password_hash)
VALUES ('d604d922-de6a-4052-bc49-2ce8e2814e8d', 'test@example.com', 'not-a-real-hash')
ON CONFLICT DO NOTHING;

-- 5 folders for the test user
INSERT INTO folders (id, user_id, name)
SELECT gen_random_uuid(), 'd604d922-de6a-4052-bc49-2ce8e2814e8d'::uuid, 'Seed folder ' || n
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

-- 20,000 bookmarks in each of the 5 folders = 100,000
INSERT INTO bookmarks (id, folder_id, user_id, name, url, created_at)
SELECT gen_random_uuid(), f.id, f.user_id,
       'Bookmark ' || n || ' ' || (ARRAY['sweden', 'trip', 'recipe', 'react', 'postgres'])[1 + n % 5],
       'https://example.com/' || n,
       now() - n * interval '1 minute'
FROM generate_series(1, 20000) AS n
CROSS JOIN folders f
WHERE f.user_id = 'd604d922-de6a-4052-bc49-2ce8e2814e8d'
  AND f.name IN ('Seed folder 1', 'Seed folder 2', 'Seed folder 3', 'Seed folder 4', 'Seed folder 5')
ON CONFLICT DO NOTHING;

-- refresh Postgres's statistics after a big insert
ANALYZE bookmarks;