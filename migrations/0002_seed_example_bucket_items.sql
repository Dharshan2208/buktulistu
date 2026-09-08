INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Watch the northern lights in Iceland',
    'Spend a quiet winter night beneath the aurora.',
    'travel',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Watch the northern lights in Iceland'
);

INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Learn to make fresh pasta',
    'Master a silky tagliatelle from scratch.',
    'skills',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Learn to make fresh pasta'
);

INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Run a 10K race',
    'Train steadily and enjoy the finish line.',
    'fitness',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Run a 10K race'
);

INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Take a pottery workshop',
    'Make a perfectly imperfect mug with my own hands.',
    'creativity',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Take a pottery workshop'
);

INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Volunteer for a local cause',
    'Give a weekend to a community project that matters.',
    'giving-back',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Volunteer for a local cause'
);

INSERT INTO bucket_items (title, description, category, completed)
SELECT
    'Plan a friends-only dinner party',
    'Cook slowly, set a beautiful table, and stay up late.',
    'relationships',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM bucket_items
    WHERE title = 'Plan a friends-only dinner party'
);
