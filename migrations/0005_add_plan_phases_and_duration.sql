ALTER TABLE plans ADD COLUMN estimated_duration TEXT;
ALTER TABLE plans ADD COLUMN phases TEXT DEFAULT '[]';

UPDATE plans
SET
  estimated_duration = '10–12 days',
  phases = '[]',
  steps = '[{"id":"task-1","title":"Obtain ACAP & TIMS permits in Pokhara","description":"Submit paperwork and passport photos at the Nepal Tourism Board in Damside, Pokhara","completed":true},{"id":"task-2","title":"Gear check: thermal layers, microspikes & trekking poles","description":"Inspect cold-weather layers and break in waterproof trekking boots on practice trails","completed":true},{"id":"task-3","title":"Fly to Kathmandu and scenic drive to Pokhara","description":"Arrive in Kathmandu (KTM) and take coach or flight to lakeside Pokhara","completed":false},{"id":"task-4","title":"Trek Days 1–3: Nayapul to Ghandruk and Chhomrong","description":"Ascend stone staircases through Gurung villages with views of Annapurna South","completed":false},{"id":"task-5","title":"Trek Days 4–6: Bamboo through Deurali to MBC (3,700m)","description":"Hike along Modi Khola gorge, acclimatizing steadily into sub-alpine terrain","completed":false},{"id":"task-6","title":"Trek Day 7: Sunrise hike to Annapurna Base Camp (4,130m)","description":"Pre-dawn 2-hour gentle ascent into the 360-degree mountain amphitheater of Annapurna I, Annapurna South, and Hiunchuli","completed":false},{"id":"task-7","title":"Descend via Bamboo to Jhinu Danda natural hot springs","description":"Long descent down the valley, soothing tired muscles in natural riverside thermal pools","completed":false}]'
WHERE title = 'Annapurna Base Camp Trek';
