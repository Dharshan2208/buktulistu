INSERT INTO plans (title, description, category, status, priority, target_date, steps)
SELECT
    'Annapurna Base Camp Trek',
    '10-day high-altitude trek through the Annapurna Sanctuary in Nepal, reaching 4,130m surrounded by Hiunchuli, Machapuchare (Fishtail), and Annapurna I.',
    'travel',
    'in_progress',
    'high',
    '2027-10-15',
    '[{"id":"1","text":"Obtain ACAP & TIMS permits in Pokhara","completed":true},{"id":"2","text":"Gear check: thermal layers, microspikes & trekking poles","completed":true},{"id":"3","text":"Fly to Kathmandu and transfer to lakeside Pokhara","completed":false},{"id":"4","text":"Trek Day 1–3: Nayapul to Ghandruk and Chhomrong","completed":false},{"id":"5","text":"Trek Day 4–6: Bamboo through Deurali to MBC (3,700m)","completed":false},{"id":"6","text":"Trek Day 7: Sunrise hike to Annapurna Base Camp (4,130m)","completed":false},{"id":"7","text":"Descend via Jhinu Danda natural hot springs","completed":false}]'
WHERE NOT EXISTS (
    SELECT 1 FROM plans
    WHERE title = 'Annapurna Base Camp Trek'
);
