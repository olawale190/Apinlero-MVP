-- ============================================================================
-- CULTURAL EVENTS SEED MIGRATION
-- Seeds all cultural/religious events for existing businesses
-- ============================================================================

-- Function to seed cultural events for a specific business
CREATE OR REPLACE FUNCTION seed_cultural_events_for_business(target_business_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing cultural events for this business to avoid duplicates
  DELETE FROM calendar_events
  WHERE business_id = target_business_id AND event_type = 'cultural_event';

  -- Insert all cultural events
  INSERT INTO calendar_events (
    business_id, title, description, event_type, start_datetime, all_day,
    emoji, expected_increase, communities, affected_products, stock_recommendations,
    color, is_public, is_recurring, recurrence_rule
  ) VALUES

  -- ===== 2025 EVENTS =====

  -- JANUARY
  (target_business_id, 'New Year''s Day', 'New Year celebrations. Party food and drinks demand.',
   'cultural_event', '2025-01-01'::timestamptz, true,
   '🎉', 100, ARRAY['All'],
   ARRAY['Drinks', 'Snacks', 'Rice', 'Meat', 'Soft Drinks'],
   '[{"product": "Rice 5kg", "extraUnits": 30}, {"product": "Drinks", "extraUnits": 40}, {"product": "Snacks", "extraUnits": 35}]'::jsonb,
   '#10B981', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Chinese New Year', 'Year of the Snake. High demand for Asian groceries and celebration foods.',
   'cultural_event', '2025-01-29'::timestamptz, true,
   '🐍', 160, ARRAY['Chinese', 'East Asian', 'Vietnamese', 'Korean'],
   ARRAY['Rice', 'Noodles', 'Soy Sauce', 'Dumplings', 'Spring Rolls', 'Sesame Oil'],
   '[{"product": "Jasmine Rice", "extraUnits": 45}, {"product": "Noodles", "extraUnits": 40}, {"product": "Soy Sauce", "extraUnits": 30}]'::jsonb,
   '#EF4444', true, false, null),

  -- FEBRUARY
  (target_business_id, 'Valentine''s Day', 'Romantic meals and chocolates in demand.',
   'cultural_event', '2025-02-14'::timestamptz, true,
   '❤️', 60, ARRAY['All'],
   ARRAY['Chocolates', 'Wine', 'Desserts', 'Special Ingredients'],
   '[{"product": "Chocolates", "extraUnits": 30}, {"product": "Wine", "extraUnits": 20}]'::jsonb,
   '#EC4899', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  -- MARCH
  (target_business_id, 'Holi', 'Hindu festival of colours. Sweets and festive foods.',
   'cultural_event', '2025-03-14'::timestamptz, true,
   '🎨', 120, ARRAY['Indian', 'Hindu', 'Nepali', 'South Asian'],
   ARRAY['Ghee', 'Flour', 'Sugar', 'Milk', 'Sweets', 'Spices'],
   '[{"product": "Ghee", "extraUnits": 30}, {"product": "Flour", "extraUnits": 25}, {"product": "Sugar", "extraUnits": 20}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Ramadan Begins', 'Holy month of fasting. High demand for Iftar foods throughout the month.',
   'cultural_event', '2025-03-01'::timestamptz, true,
   '🌙', 150, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
   ARRAY['Dates', 'Rice', 'Meat', 'Lentils', 'Flour', 'Milk'],
   '[{"product": "Dates", "extraUnits": 60}, {"product": "Rice 5kg", "extraUnits": 50}, {"product": "Lentils", "extraUnits": 40}]'::jsonb,
   '#8B5CF6', true, false, null),

  (target_business_id, 'Eid al-Fitr', 'End of Ramadan celebration. Major spike in food orders for feasts.',
   'cultural_event', '2025-03-30'::timestamptz, true,
   '🌙', 200, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
   ARRAY['Rice', 'Meat', 'Palm Oil', 'Spices', 'Flour', 'Sweets'],
   '[{"product": "Rice 5kg", "extraUnits": 60}, {"product": "Palm Oil 5L", "extraUnits": 40}, {"product": "Goat Meat", "extraUnits": 50}]'::jsonb,
   '#8B5CF6', true, false, null),

  (target_business_id, 'Mother''s Day (UK)', 'Special meals for mothers. Family gatherings.',
   'cultural_event', '2025-03-30'::timestamptz, true,
   '💐', 80, ARRAY['All'],
   ARRAY['Chicken', 'Rice', 'Cakes', 'Drinks', 'Vegetables'],
   '[{"product": "Chicken", "extraUnits": 25}, {"product": "Rice", "extraUnits": 20}]'::jsonb,
   '#EC4899', true, false, null),

  -- APRIL
  (target_business_id, 'Easter Sunday', 'Christian celebration. Large family meals and gatherings.',
   'cultural_event', '2025-04-20'::timestamptz, true,
   '🐣', 130, ARRAY['Nigerian', 'Ghanaian', 'Caribbean', 'Polish', 'Christian'],
   ARRAY['Rice', 'Chicken', 'Lamb', 'Vegetables', 'Fish', 'Drinks'],
   '[{"product": "Rice 5kg", "extraUnits": 35}, {"product": "Chicken", "extraUnits": 30}, {"product": "Stockfish", "extraUnits": 25}]'::jsonb,
   '#A855F7', true, false, null),

  (target_business_id, 'Vaisakhi', 'Sikh New Year and harvest festival. Community meals and celebrations.',
   'cultural_event', '2025-04-14'::timestamptz, true,
   '🎊', 100, ARRAY['Sikh', 'Punjabi', 'Indian'],
   ARRAY['Rice', 'Flour', 'Lentils', 'Ghee', 'Vegetables', 'Paneer'],
   '[{"product": "Basmati Rice", "extraUnits": 30}, {"product": "Flour", "extraUnits": 25}, {"product": "Ghee", "extraUnits": 20}]'::jsonb,
   '#F97316', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  -- MAY
  (target_business_id, 'Vesak (Buddha Day)', 'Buddhist celebration of Buddha''s birth, enlightenment, and death.',
   'cultural_event', '2025-05-12'::timestamptz, true,
   '🪷', 70, ARRAY['Buddhist', 'Sri Lankan', 'Thai', 'Vietnamese'],
   ARRAY['Rice', 'Vegetables', 'Tofu', 'Noodles', 'Tea'],
   '[{"product": "Jasmine Rice", "extraUnits": 20}, {"product": "Vegetables", "extraUnits": 25}, {"product": "Tofu", "extraUnits": 15}]'::jsonb,
   '#14B8A6', true, false, null),

  -- JUNE
  (target_business_id, 'Eid al-Adha', 'Festival of Sacrifice. Highest meat demand of the year.',
   'cultural_event', '2025-06-07'::timestamptz, true,
   '🐑', 220, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
   ARRAY['Lamb', 'Goat', 'Rice', 'Spices', 'Vegetables'],
   '[{"product": "Goat Meat", "extraUnits": 70}, {"product": "Lamb", "extraUnits": 60}, {"product": "Rice 5kg", "extraUnits": 50}]'::jsonb,
   '#8B5CF6', true, false, null),

  (target_business_id, 'Father''s Day', 'Family gatherings and BBQ season.',
   'cultural_event', '2025-06-15'::timestamptz, true,
   '👔', 70, ARRAY['All'],
   ARRAY['Meat', 'Drinks', 'BBQ Items', 'Snacks'],
   '[{"product": "Meat", "extraUnits": 30}, {"product": "Drinks", "extraUnits": 25}]'::jsonb,
   '#3B82F6', true, false, null),

  (target_business_id, 'Windrush Day', 'Celebrating Caribbean heritage in the UK.',
   'cultural_event', '2025-06-22'::timestamptz, true,
   '🇯🇲', 90, ARRAY['Caribbean', 'Jamaican', 'Trinidadian', 'Barbadian'],
   ARRAY['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Saltfish', 'Rum'],
   '[{"product": "Plantain", "extraUnits": 35}, {"product": "Ackee", "extraUnits": 25}, {"product": "Jerk Seasoning", "extraUnits": 30}]'::jsonb,
   '#FBBF24', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Islamic New Year', 'Islamic New Year. Reflective gatherings and special meals.',
   'cultural_event', '2025-06-27'::timestamptz, true,
   '🕌', 60, ARRAY['Muslim', 'Shia', 'Sunni'],
   ARRAY['Dates', 'Rice', 'Meat', 'Milk'],
   '[{"product": "Dates", "extraUnits": 25}, {"product": "Rice", "extraUnits": 20}]'::jsonb,
   '#8B5CF6', true, false, null),

  -- AUGUST
  (target_business_id, 'Jamaica Independence Day', 'Jamaican national day celebrations.',
   'cultural_event', '2025-08-06'::timestamptz, true,
   '🇯🇲', 100, ARRAY['Jamaican', 'Caribbean'],
   ARRAY['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Rum', 'Red Stripe'],
   '[{"product": "Plantain", "extraUnits": 30}, {"product": "Jerk Seasoning", "extraUnits": 25}, {"product": "Ackee", "extraUnits": 20}]'::jsonb,
   '#FBBF24', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Raksha Bandhan', 'Hindu festival celebrating brother-sister bond. Sweets exchanged.',
   'cultural_event', '2025-08-09'::timestamptz, true,
   '🧵', 80, ARRAY['Hindu', 'Indian', 'Nepali'],
   ARRAY['Sweets', 'Dry Fruits', 'Mithai', 'Gift Boxes'],
   '[{"product": "Sweets", "extraUnits": 30}, {"product": "Dry Fruits", "extraUnits": 25}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Janmashtami', 'Hindu celebration of Lord Krishna''s birth.',
   'cultural_event', '2025-08-16'::timestamptz, true,
   '🙏', 90, ARRAY['Hindu', 'Indian', 'ISKCON'],
   ARRAY['Milk', 'Ghee', 'Butter', 'Sweets', 'Fruits'],
   '[{"product": "Milk", "extraUnits": 30}, {"product": "Ghee", "extraUnits": 25}, {"product": "Butter", "extraUnits": 20}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Notting Hill Carnival', 'Europe''s biggest street festival. Massive Caribbean food demand.',
   'cultural_event', '2025-08-24'::timestamptz, true,
   '🎭', 180, ARRAY['Caribbean', 'Jamaican', 'Trinidadian', 'All'],
   ARRAY['Jerk Chicken ingredients', 'Rice', 'Plantain', 'Rum', 'Drinks'],
   '[{"product": "Rice", "extraUnits": 50}, {"product": "Plantain", "extraUnits": 45}, {"product": "Jerk Seasoning", "extraUnits": 40}]'::jsonb,
   '#FBBF24', true, false, null),

  (target_business_id, 'Ganesh Chaturthi', 'Hindu festival honoring Lord Ganesha. Modak sweets in demand.',
   'cultural_event', '2025-08-27'::timestamptz, true,
   '🐘', 100, ARRAY['Hindu', 'Marathi', 'Indian'],
   ARRAY['Modak', 'Coconut', 'Jaggery', 'Flour', 'Ghee'],
   '[{"product": "Coconut", "extraUnits": 30}, {"product": "Jaggery", "extraUnits": 25}, {"product": "Ghee", "extraUnits": 20}]'::jsonb,
   '#F97316', true, false, null),

  -- SEPTEMBER
  (target_business_id, 'Mawlid (Prophet''s Birthday)', 'Celebration of Prophet Muhammad''s birthday.',
   'cultural_event', '2025-09-05'::timestamptz, true,
   '☪️', 80, ARRAY['Muslim', 'Sunni'],
   ARRAY['Dates', 'Rice', 'Meat', 'Sweets', 'Milk'],
   '[{"product": "Dates", "extraUnits": 30}, {"product": "Sweets", "extraUnits": 25}]'::jsonb,
   '#8B5CF6', true, false, null),

  (target_business_id, 'Navratri', 'Nine nights of Hindu worship and Garba dancing. Fasting foods in demand.',
   'cultural_event', '2025-09-22'::timestamptz, true,
   '💃', 110, ARRAY['Hindu', 'Gujarati', 'Indian'],
   ARRAY['Sabudana', 'Potatoes', 'Kuttu Flour', 'Fruits', 'Milk'],
   '[{"product": "Sabudana", "extraUnits": 30}, {"product": "Kuttu Flour", "extraUnits": 25}, {"product": "Potatoes", "extraUnits": 35}]'::jsonb,
   '#F97316', true, false, null),

  -- OCTOBER
  (target_business_id, 'Nigerian Independence Day', 'Nigeria''s national day. Major celebration with traditional foods.',
   'cultural_event', '2025-10-01'::timestamptz, true,
   '🇳🇬', 120, ARRAY['Nigerian', 'West African'],
   ARRAY['Jollof Rice ingredients', 'Palm Oil', 'Meat', 'Egusi', 'Stockfish'],
   '[{"product": "Rice 5kg", "extraUnits": 40}, {"product": "Tomato Paste", "extraUnits": 35}, {"product": "Palm Oil", "extraUnits": 30}, {"product": "Egusi", "extraUnits": 25}]'::jsonb,
   '#22C55E', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Durga Puja', 'Bengali Hindu festival. Major celebrations with special foods.',
   'cultural_event', '2025-10-01'::timestamptz, true,
   '🙏', 100, ARRAY['Bengali', 'Hindu', 'Indian'],
   ARRAY['Rice', 'Fish', 'Sweets', 'Vegetables', 'Paneer'],
   '[{"product": "Rice", "extraUnits": 30}, {"product": "Fish", "extraUnits": 35}, {"product": "Sweets", "extraUnits": 30}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Black History Month (UK)', 'Celebrating Black heritage and culture in the UK.',
   'cultural_event', '2025-10-01'::timestamptz, true,
   '✊🏿', 70, ARRAY['African', 'Caribbean', 'Black British'],
   ARRAY['African Foods', 'Caribbean Foods', 'Palm Oil', 'Plantain'],
   '[{"product": "Plantain", "extraUnits": 25}, {"product": "Palm Oil", "extraUnits": 20}]'::jsonb,
   '#6B7280', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Dussehra (Vijayadashami)', 'Victory of good over evil. End of Navratri celebrations.',
   'cultural_event', '2025-10-02'::timestamptz, true,
   '🏹', 90, ARRAY['Hindu', 'Indian', 'Nepali'],
   ARRAY['Sweets', 'Fruits', 'Rice', 'Vegetables'],
   '[{"product": "Sweets", "extraUnits": 30}, {"product": "Fruits", "extraUnits": 25}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Diwali', 'Festival of Lights. Biggest Hindu celebration. Sweets and gifts exchanged.',
   'cultural_event', '2025-10-20'::timestamptz, true,
   '🪔', 200, ARRAY['Hindu', 'Sikh', 'Jain', 'Indian', 'Nepali', 'South Asian'],
   ARRAY['Rice', 'Spices', 'Ghee', 'Sweets', 'Dry Fruits', 'Flour'],
   '[{"product": "Basmati Rice", "extraUnits": 50}, {"product": "Ghee", "extraUnits": 40}, {"product": "Sweets", "extraUnits": 60}, {"product": "Dry Fruits", "extraUnits": 45}]'::jsonb,
   '#F97316', true, false, null),

  (target_business_id, 'Bandi Chhor Divas', 'Sikh festival coinciding with Diwali. Liberation celebration.',
   'cultural_event', '2025-10-20'::timestamptz, true,
   '🪔', 100, ARRAY['Sikh', 'Punjabi'],
   ARRAY['Rice', 'Flour', 'Ghee', 'Lentils', 'Sweets'],
   '[{"product": "Rice", "extraUnits": 30}, {"product": "Flour", "extraUnits": 25}]'::jsonb,
   '#F97316', true, false, null),

  -- NOVEMBER
  (target_business_id, 'Bonfire Night', 'Guy Fawkes Night. BBQ and outdoor food parties.',
   'cultural_event', '2025-11-05'::timestamptz, true,
   '🎆', 60, ARRAY['All'],
   ARRAY['Sausages', 'Burgers', 'Drinks', 'Snacks', 'Hot Chocolate'],
   '[{"product": "Sausages", "extraUnits": 25}, {"product": "Drinks", "extraUnits": 30}]'::jsonb,
   '#EF4444', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Guru Nanak Jayanti', 'Birth anniversary of Guru Nanak, founder of Sikhism. Langar meals.',
   'cultural_event', '2025-11-05'::timestamptz, true,
   '🙏', 110, ARRAY['Sikh', 'Punjabi', 'Indian'],
   ARRAY['Rice', 'Flour', 'Lentils', 'Ghee', 'Vegetables', 'Milk'],
   '[{"product": "Rice", "extraUnits": 40}, {"product": "Flour", "extraUnits": 35}, {"product": "Lentils", "extraUnits": 30}]'::jsonb,
   '#F97316', true, false, null),

  -- DECEMBER
  (target_business_id, 'Hanukkah', 'Jewish Festival of Lights. Fried foods and latkes.',
   'cultural_event', '2025-12-14'::timestamptz, true,
   '🕎', 80, ARRAY['Jewish'],
   ARRAY['Potatoes', 'Oil', 'Flour', 'Eggs', 'Cheese'],
   '[{"product": "Potatoes", "extraUnits": 30}, {"product": "Oil", "extraUnits": 25}]'::jsonb,
   '#3B82F6', true, false, null),

  (target_business_id, 'Christmas', 'Major UK holiday. Biggest sales period of the year.',
   'cultural_event', '2025-12-25'::timestamptz, true,
   '🎄', 250, ARRAY['All'],
   ARRAY['Rice', 'Chicken', 'Turkey', 'Drinks', 'Snacks', 'Vegetables'],
   '[{"product": "Rice 5kg", "extraUnits": 70}, {"product": "Chicken", "extraUnits": 60}, {"product": "Turkey", "extraUnits": 40}, {"product": "Palm Oil", "extraUnits": 45}]'::jsonb,
   '#22C55E', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Boxing Day', 'Day after Christmas. Leftovers and continued celebrations.',
   'cultural_event', '2025-12-26'::timestamptz, true,
   '🎁', 60, ARRAY['All'],
   ARRAY['Snacks', 'Drinks', 'Quick Meals'],
   '[{"product": "Snacks", "extraUnits": 25}, {"product": "Drinks", "extraUnits": 30}]'::jsonb,
   '#22C55E', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  (target_business_id, 'Kwanzaa', 'Week-long celebration of African heritage (Dec 26 - Jan 1).',
   'cultural_event', '2025-12-26'::timestamptz, true,
   '🖤', 50, ARRAY['African American', 'Black British', 'African'],
   ARRAY['African Foods', 'Vegetables', 'Fruits', 'Nuts'],
   '[{"product": "Fruits", "extraUnits": 20}, {"product": "Vegetables", "extraUnits": 20}]'::jsonb,
   '#6B7280', true, false, null),

  (target_business_id, 'New Year''s Eve', 'New Year''s Eve celebrations. Party food and drinks.',
   'cultural_event', '2025-12-31'::timestamptz, true,
   '🥂', 120, ARRAY['All'],
   ARRAY['Drinks', 'Snacks', 'Party Food', 'Champagne'],
   '[{"product": "Drinks", "extraUnits": 50}, {"product": "Snacks", "extraUnits": 40}]'::jsonb,
   '#8B5CF6', true, true, '{"frequency": "yearly", "interval": 1}'::jsonb),

  -- ===== 2026 EVENTS =====

  (target_business_id, 'New Year''s Day 2026', 'New Year celebrations. Party food and drinks demand.',
   'cultural_event', '2026-01-01'::timestamptz, true,
   '🎉', 100, ARRAY['All'],
   ARRAY['Drinks', 'Snacks', 'Rice', 'Meat'],
   '[{"product": "Rice 5kg", "extraUnits": 30}, {"product": "Drinks", "extraUnits": 40}]'::jsonb,
   '#10B981', true, false, null),

  (target_business_id, 'Chinese New Year 2026', 'Year of the Horse. High demand for Asian groceries.',
   'cultural_event', '2026-02-17'::timestamptz, true,
   '🐴', 160, ARRAY['Chinese', 'East Asian', 'Vietnamese'],
   ARRAY['Rice', 'Noodles', 'Soy Sauce', 'Dumplings', 'Spring Rolls'],
   '[{"product": "Jasmine Rice", "extraUnits": 45}, {"product": "Noodles", "extraUnits": 40}]'::jsonb,
   '#EF4444', true, false, null),

  (target_business_id, 'Ramadan 2026', 'Holy month of fasting begins.',
   'cultural_event', '2026-02-18'::timestamptz, true,
   '🌙', 150, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab'],
   ARRAY['Dates', 'Rice', 'Meat', 'Lentils', 'Flour', 'Milk'],
   '[{"product": "Dates", "extraUnits": 60}, {"product": "Rice 5kg", "extraUnits": 50}]'::jsonb,
   '#8B5CF6', true, false, null),

  (target_business_id, 'Eid al-Fitr 2026', 'End of Ramadan celebration.',
   'cultural_event', '2026-03-20'::timestamptz, true,
   '🌙', 200, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab'],
   ARRAY['Rice', 'Meat', 'Palm Oil', 'Spices', 'Flour', 'Sweets'],
   '[{"product": "Rice 5kg", "extraUnits": 60}, {"product": "Goat Meat", "extraUnits": 50}]'::jsonb,
   '#8B5CF6', true, false, null),

  -- VALENTINE'S DAY 2026
  (target_business_id, 'Valentine''s Day 2026', 'Romantic meals and chocolates in demand.',
   'cultural_event', '2026-02-14'::timestamptz, true,
   '❤️', 60, ARRAY['All'],
   ARRAY['Chocolates', 'Wine', 'Desserts', 'Special Ingredients', 'Flowers'],
   '[{"product": "Chocolates", "extraUnits": 30}, {"product": "Wine", "extraUnits": 20}, {"product": "Desserts", "extraUnits": 15}]'::jsonb,
   '#EC4899', true, false, null),

  -- HOLI 2026
  (target_business_id, 'Holi 2026', 'Hindu festival of colours. Sweets and festive foods.',
   'cultural_event', '2026-03-03'::timestamptz, true,
   '🎨', 120, ARRAY['Indian', 'Hindu', 'Nepali', 'South Asian'],
   ARRAY['Ghee', 'Flour', 'Sugar', 'Milk', 'Sweets', 'Spices', 'Colours'],
   '[{"product": "Ghee", "extraUnits": 30}, {"product": "Flour", "extraUnits": 25}, {"product": "Sugar", "extraUnits": 20}]'::jsonb,
   '#F97316', true, false, null),

  -- MOTHER'S DAY UK 2026
  (target_business_id, 'Mother''s Day (UK) 2026', 'Special meals for mothers. Family gatherings.',
   'cultural_event', '2026-03-22'::timestamptz, true,
   '💐', 80, ARRAY['All'],
   ARRAY['Chicken', 'Rice', 'Cakes', 'Drinks', 'Vegetables', 'Flowers'],
   '[{"product": "Chicken", "extraUnits": 25}, {"product": "Rice", "extraUnits": 20}, {"product": "Cakes", "extraUnits": 15}]'::jsonb,
   '#EC4899', true, false, null),

  -- EASTER 2026
  (target_business_id, 'Good Friday 2026', 'Christian day of fasting and reflection. Fish in high demand.',
   'cultural_event', '2026-04-03'::timestamptz, true,
   '✝️', 90, ARRAY['Nigerian', 'Ghanaian', 'Caribbean', 'Polish', 'Christian'],
   ARRAY['Fish', 'Stockfish', 'Vegetables', 'Rice'],
   '[{"product": "Stockfish", "extraUnits": 30}, {"product": "Fish", "extraUnits": 35}, {"product": "Rice", "extraUnits": 20}]'::jsonb,
   '#6B7280', true, false, null),

  (target_business_id, 'Easter Sunday 2026', 'Christian celebration. Large family meals and gatherings.',
   'cultural_event', '2026-04-05'::timestamptz, true,
   '🐣', 130, ARRAY['Nigerian', 'Ghanaian', 'Caribbean', 'Polish', 'Christian', 'All'],
   ARRAY['Rice', 'Chicken', 'Lamb', 'Vegetables', 'Fish', 'Drinks', 'Eggs', 'Chocolate'],
   '[{"product": "Rice 5kg", "extraUnits": 35}, {"product": "Chicken", "extraUnits": 30}, {"product": "Lamb", "extraUnits": 25}, {"product": "Eggs", "extraUnits": 40}]'::jsonb,
   '#A855F7', true, false, null),

  (target_business_id, 'Easter Monday 2026', 'Bank holiday. Family gatherings continue.',
   'cultural_event', '2026-04-06'::timestamptz, true,
   '🐰', 70, ARRAY['All'],
   ARRAY['Leftovers', 'Snacks', 'Drinks', 'Quick Meals'],
   '[{"product": "Snacks", "extraUnits": 20}, {"product": "Drinks", "extraUnits": 25}]'::jsonb,
   '#A855F7', true, false, null),

  -- VAISAKHI 2026
  (target_business_id, 'Vaisakhi 2026', 'Sikh New Year and harvest festival. Community meals.',
   'cultural_event', '2026-04-14'::timestamptz, true,
   '🎊', 100, ARRAY['Sikh', 'Punjabi', 'Indian'],
   ARRAY['Rice', 'Flour', 'Lentils', 'Ghee', 'Vegetables', 'Paneer'],
   '[{"product": "Basmati Rice", "extraUnits": 30}, {"product": "Flour", "extraUnits": 25}, {"product": "Ghee", "extraUnits": 20}]'::jsonb,
   '#F97316', true, false, null),

  -- EID AL-ADHA 2026
  (target_business_id, 'Eid al-Adha 2026', 'Festival of Sacrifice. Highest meat demand of the year.',
   'cultural_event', '2026-05-27'::timestamptz, true,
   '🐑', 220, ARRAY['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
   ARRAY['Lamb', 'Goat', 'Rice', 'Spices', 'Vegetables'],
   '[{"product": "Goat Meat", "extraUnits": 70}, {"product": "Lamb", "extraUnits": 60}, {"product": "Rice 5kg", "extraUnits": 50}]'::jsonb,
   '#8B5CF6', true, false, null),

  -- FATHER'S DAY 2026
  (target_business_id, 'Father''s Day 2026', 'Family gatherings and BBQ season.',
   'cultural_event', '2026-06-21'::timestamptz, true,
   '👔', 70, ARRAY['All'],
   ARRAY['Meat', 'Drinks', 'BBQ Items', 'Snacks', 'Beer'],
   '[{"product": "Meat", "extraUnits": 30}, {"product": "Drinks", "extraUnits": 25}, {"product": "BBQ Items", "extraUnits": 20}]'::jsonb,
   '#3B82F6', true, false, null),

  -- WINDRUSH DAY 2026
  (target_business_id, 'Windrush Day 2026', 'Celebrating Caribbean heritage in the UK.',
   'cultural_event', '2026-06-22'::timestamptz, true,
   '🇯🇲', 90, ARRAY['Caribbean', 'Jamaican', 'Trinidadian', 'Barbadian'],
   ARRAY['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Saltfish', 'Rum'],
   '[{"product": "Plantain", "extraUnits": 35}, {"product": "Ackee", "extraUnits": 25}, {"product": "Jerk Seasoning", "extraUnits": 30}]'::jsonb,
   '#FBBF24', true, false, null),

  -- JAMAICA INDEPENDENCE DAY 2026
  (target_business_id, 'Jamaica Independence Day 2026', 'Jamaican national day celebrations.',
   'cultural_event', '2026-08-06'::timestamptz, true,
   '🇯🇲', 100, ARRAY['Jamaican', 'Caribbean'],
   ARRAY['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Rum', 'Red Stripe'],
   '[{"product": "Plantain", "extraUnits": 30}, {"product": "Jerk Seasoning", "extraUnits": 25}, {"product": "Ackee", "extraUnits": 20}]'::jsonb,
   '#FBBF24', true, false, null),

  -- NOTTING HILL CARNIVAL 2026
  (target_business_id, 'Notting Hill Carnival 2026', 'Europe''s biggest street festival. Massive Caribbean food demand.',
   'cultural_event', '2026-08-30'::timestamptz, true,
   '🎭', 180, ARRAY['Caribbean', 'Jamaican', 'Trinidadian', 'All'],
   ARRAY['Jerk Chicken ingredients', 'Rice', 'Plantain', 'Rum', 'Drinks'],
   '[{"product": "Rice", "extraUnits": 50}, {"product": "Plantain", "extraUnits": 45}, {"product": "Jerk Seasoning", "extraUnits": 40}]'::jsonb,
   '#FBBF24', true, false, null),

  -- NIGERIAN INDEPENDENCE DAY 2026
  (target_business_id, 'Nigerian Independence Day 2026', 'Nigeria''s national day. Major celebration with traditional foods.',
   'cultural_event', '2026-10-01'::timestamptz, true,
   '🇳🇬', 120, ARRAY['Nigerian', 'West African'],
   ARRAY['Jollof Rice ingredients', 'Palm Oil', 'Meat', 'Egusi', 'Stockfish'],
   '[{"product": "Rice 5kg", "extraUnits": 40}, {"product": "Tomato Paste", "extraUnits": 35}, {"product": "Palm Oil", "extraUnits": 30}, {"product": "Egusi", "extraUnits": 25}]'::jsonb,
   '#22C55E', true, false, null),

  -- BLACK HISTORY MONTH UK 2026
  (target_business_id, 'Black History Month (UK) 2026', 'Celebrating Black heritage and culture in the UK.',
   'cultural_event', '2026-10-01'::timestamptz, true,
   '✊🏿', 70, ARRAY['African', 'Caribbean', 'Black British'],
   ARRAY['African Foods', 'Caribbean Foods', 'Palm Oil', 'Plantain'],
   '[{"product": "Plantain", "extraUnits": 25}, {"product": "Palm Oil", "extraUnits": 20}]'::jsonb,
   '#6B7280', true, false, null),

  -- DIWALI 2026
  (target_business_id, 'Diwali 2026', 'Festival of Lights. Biggest Hindu celebration. Sweets and gifts exchanged.',
   'cultural_event', '2026-11-08'::timestamptz, true,
   '🪔', 200, ARRAY['Hindu', 'Sikh', 'Jain', 'Indian', 'Nepali', 'South Asian'],
   ARRAY['Rice', 'Spices', 'Ghee', 'Sweets', 'Dry Fruits', 'Flour'],
   '[{"product": "Basmati Rice", "extraUnits": 50}, {"product": "Ghee", "extraUnits": 40}, {"product": "Sweets", "extraUnits": 60}, {"product": "Dry Fruits", "extraUnits": 45}]'::jsonb,
   '#F97316', true, false, null),

  -- BONFIRE NIGHT 2026
  (target_business_id, 'Bonfire Night 2026', 'Guy Fawkes Night. BBQ and outdoor food parties.',
   'cultural_event', '2026-11-05'::timestamptz, true,
   '🎆', 60, ARRAY['All'],
   ARRAY['Sausages', 'Burgers', 'Drinks', 'Snacks', 'Hot Chocolate', 'Marshmallows'],
   '[{"product": "Sausages", "extraUnits": 25}, {"product": "Drinks", "extraUnits": 30}, {"product": "Hot Chocolate", "extraUnits": 20}]'::jsonb,
   '#EF4444', true, false, null),

  -- THANKSGIVING (US community in UK) 2026
  (target_business_id, 'Thanksgiving 2026', 'American Thanksgiving. US community in UK celebrates.',
   'cultural_event', '2026-11-26'::timestamptz, true,
   '🦃', 50, ARRAY['American', 'US Expats'],
   ARRAY['Turkey', 'Cranberry Sauce', 'Pumpkin', 'Potatoes', 'Gravy'],
   '[{"product": "Turkey", "extraUnits": 20}, {"product": "Cranberry Sauce", "extraUnits": 15}]'::jsonb,
   '#F97316', true, false, null),

  -- HANUKKAH 2026
  (target_business_id, 'Hanukkah 2026', 'Jewish Festival of Lights. Fried foods and latkes.',
   'cultural_event', '2026-12-05'::timestamptz, true,
   '🕎', 80, ARRAY['Jewish'],
   ARRAY['Potatoes', 'Oil', 'Flour', 'Eggs', 'Cheese'],
   '[{"product": "Potatoes", "extraUnits": 30}, {"product": "Oil", "extraUnits": 25}]'::jsonb,
   '#3B82F6', true, false, null),

  -- CHRISTMAS 2026
  (target_business_id, 'Christmas Eve 2026', 'Christmas Eve preparations. Last-minute shopping rush.',
   'cultural_event', '2026-12-24'::timestamptz, true,
   '🎄', 150, ARRAY['All'],
   ARRAY['Turkey', 'Chicken', 'Vegetables', 'Drinks', 'Snacks', 'Desserts'],
   '[{"product": "Turkey", "extraUnits": 30}, {"product": "Chicken", "extraUnits": 40}, {"product": "Vegetables", "extraUnits": 50}]'::jsonb,
   '#22C55E', true, false, null),

  (target_business_id, 'Christmas Day 2026', 'Major UK holiday. Biggest sales period of the year.',
   'cultural_event', '2026-12-25'::timestamptz, true,
   '🎄', 250, ARRAY['All'],
   ARRAY['Rice', 'Chicken', 'Turkey', 'Drinks', 'Snacks', 'Vegetables', 'Desserts'],
   '[{"product": "Rice 5kg", "extraUnits": 70}, {"product": "Chicken", "extraUnits": 60}, {"product": "Turkey", "extraUnits": 40}, {"product": "Palm Oil", "extraUnits": 45}]'::jsonb,
   '#22C55E', true, false, null),

  (target_business_id, 'Boxing Day 2026', 'Day after Christmas. Leftovers and continued celebrations.',
   'cultural_event', '2026-12-26'::timestamptz, true,
   '🎁', 60, ARRAY['All'],
   ARRAY['Snacks', 'Drinks', 'Quick Meals', 'Leftovers'],
   '[{"product": "Snacks", "extraUnits": 25}, {"product": "Drinks", "extraUnits": 30}]'::jsonb,
   '#22C55E', true, false, null),

  -- KWANZAA 2026
  (target_business_id, 'Kwanzaa 2026', 'Week-long celebration of African heritage (Dec 26 - Jan 1).',
   'cultural_event', '2026-12-26'::timestamptz, true,
   '🖤', 50, ARRAY['African American', 'Black British', 'African'],
   ARRAY['African Foods', 'Vegetables', 'Fruits', 'Nuts'],
   '[{"product": "Fruits", "extraUnits": 20}, {"product": "Vegetables", "extraUnits": 20}]'::jsonb,
   '#6B7280', true, false, null),

  -- NEW YEAR'S EVE 2026
  (target_business_id, 'New Year''s Eve 2026', 'New Year''s Eve celebrations. Party food and drinks.',
   'cultural_event', '2026-12-31'::timestamptz, true,
   '🥂', 120, ARRAY['All'],
   ARRAY['Drinks', 'Snacks', 'Party Food', 'Champagne', 'Fireworks Snacks'],
   '[{"product": "Drinks", "extraUnits": 50}, {"product": "Snacks", "extraUnits": 40}, {"product": "Champagne", "extraUnits": 30}]'::jsonb,
   '#8B5CF6', true, false, null);

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED FOR ALL EXISTING BUSINESSES
-- ============================================================================

DO $$
DECLARE
  business_record RECORD;
  seeded_count INTEGER := 0;
BEGIN
  FOR business_record IN SELECT id FROM businesses LOOP
    PERFORM seed_cultural_events_for_business(business_record.id);
    seeded_count := seeded_count + 1;
  END LOOP;

  RAISE NOTICE 'Cultural events seeded for % businesses', seeded_count;
END $$;

-- ============================================================================
-- CREATE TRIGGER TO AUTO-SEED NEW BUSINESSES
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_seed_cultural_events()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_cultural_events_for_business(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_seed_cultural_events ON businesses;

CREATE TRIGGER trigger_seed_cultural_events
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_cultural_events();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM calendar_events WHERE event_type = 'cultural_event';
  RAISE NOTICE 'Total cultural events seeded: %', event_count;
END $$;
