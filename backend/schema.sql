-- ============================================================
-- Inaippu E-Governance Platform — Full Database Schema
-- Safe to run on existing databases (idempotent)
-- ============================================================


-- ── 1. USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aadhaar_number VARCHAR(12) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    name           VARCHAR(255),
    city           VARCHAR(100),
    officer_id     VARCHAR(50),
    department     VARCHAR(100),
    verified       BOOLEAN DEFAULT false,
    workload_count INTEGER DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ── 2. REQUESTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id          UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_officer_id UUID REFERENCES users(id),
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    category            VARCHAR(50) CHECK (category IN ('service', 'grievance')),
    service_type        VARCHAR(100),
    department          VARCHAR(100),
    location            VARCHAR(255),
    image_url           TEXT,
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    priority            VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    resolution_notes    TEXT,
    resolved_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ── 3. STATES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS states (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);


-- ── 4. CITIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
    id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name     VARCHAR(100) NOT NULL,
    state_id UUID REFERENCES states(id) ON DELETE CASCADE
);


-- ── 5. COMPLAINT TYPES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_types (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    schema     JSONB NOT NULL DEFAULT '[]'
);


-- ── 6. COMPLAINTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    type_id             UUID REFERENCES complaint_types(id),
    assigned_officer_id UUID REFERENCES users(id),
    dynamic_data        JSONB NOT NULL DEFAULT '{}',
    city                VARCHAR(100),
    routing_note        VARCHAR(255),
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    resolution_notes    TEXT,
    escalated_at        TIMESTAMP WITH TIME ZONE,
    resolved_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ── 7. DOCUMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    file_name   VARCHAR(255),
    file_type   VARCHAR(50),
    file_size   INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ── 8. DEPARTMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ── 9. SLA CONFIG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_config (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES complaint_types(id) ON DELETE CASCADE,
    sla_days   INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(service_id)
);


-- ── 10. SEED: STATES ────────────────────────────────────────
INSERT INTO states (id, name) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Tamil Nadu'),
  ('a1000000-0000-0000-0000-000000000002', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000003', 'Kerala'),
  ('a1000000-0000-0000-0000-000000000004', 'Andhra Pradesh'),
  ('a1000000-0000-0000-0000-000000000005', 'Telangana')
ON CONFLICT DO NOTHING;


-- ── 11. SEED: CITIES ────────────────────────────────────────
INSERT INTO cities (name, state_id) VALUES
  ('Chennai',            'a1000000-0000-0000-0000-000000000001'),
  ('Coimbatore',         'a1000000-0000-0000-0000-000000000001'),
  ('Madurai',            'a1000000-0000-0000-0000-000000000001'),
  ('Salem',              'a1000000-0000-0000-0000-000000000001'),
  ('Trichy',             'a1000000-0000-0000-0000-000000000001'),
  ('Tirunelveli',        'a1000000-0000-0000-0000-000000000001'),
  ('Vellore',            'a1000000-0000-0000-0000-000000000001'),
  ('Erode',              'a1000000-0000-0000-0000-000000000001'),
  ('Bengaluru',          'a1000000-0000-0000-0000-000000000002'),
  ('Mysuru',             'a1000000-0000-0000-0000-000000000002'),
  ('Mangaluru',          'a1000000-0000-0000-0000-000000000002'),
  ('Thiruvananthapuram', 'a1000000-0000-0000-0000-000000000003'),
  ('Kochi',              'a1000000-0000-0000-0000-000000000003'),
  ('Kozhikode',          'a1000000-0000-0000-0000-000000000003'),
  ('Visakhapatnam',      'a1000000-0000-0000-0000-000000000004'),
  ('Vijayawada',         'a1000000-0000-0000-0000-000000000004'),
  ('Hyderabad',          'a1000000-0000-0000-0000-000000000005'),
  ('Warangal',           'a1000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;


-- ── 12. SEED: COMPLAINT TYPES ───────────────────────────────
INSERT INTO complaint_types (name, department, schema) VALUES
(
  'Water Supply Issue', 'Urban',
  '[
    {"key":"area","label":"Affected Area / Street","type":"text","required":true},
    {"key":"duration_of_issue","label":"Duration of Issue","type":"text","required":true,"placeholder":"e.g. 3 days"},
    {"key":"water_quality","label":"Water Quality","type":"select","required":true,"options":["Dirty / Discoloured","No Supply","Low Pressure","Leakage"]}
  ]'
),
(
  'Electricity Problem', 'PublicWorks',
  '[
    {"key":"connection_number","label":"Connection Number","type":"text","required":true},
    {"key":"outage_duration","label":"Outage Duration","type":"text","required":true,"placeholder":"e.g. 6 hours"},
    {"key":"issue_type","label":"Issue Type","type":"select","required":true,"options":["Complete Outage","Voltage Fluctuation","Sparking / Hazard","Meter Fault"]}
  ]'
),
(
  'Road Damage', 'PublicWorks',
  '[
    {"key":"road_name","label":"Road / Street Name","type":"text","required":true},
    {"key":"damage_type","label":"Type of Damage","type":"select","required":true,"options":["Pothole","Broken Footpath","Waterlogging","Missing Manhole Cover"]},
    {"key":"severity","label":"Severity","type":"select","required":true,"options":["Minor","Moderate","Severe"]}
  ]'
),
(
  'Garbage Collection', 'Urban',
  '[
    {"key":"locality","label":"Locality / Ward","type":"text","required":true},
    {"key":"last_collection","label":"Last Collection Date","type":"text","required":true,"placeholder":"e.g. 5 days ago"},
    {"key":"waste_type","label":"Waste Type","type":"select","required":false,"options":["Household","Construction Debris","Medical Waste"]}
  ]'
),
(
  'Public Transport', 'Urban',
  '[
    {"key":"route_number","label":"Bus Route Number","type":"text","required":true},
    {"key":"issue","label":"Issue Description","type":"select","required":true,"options":["Bus Not Running","Overcrowding","Driver Misconduct","Stop Not Functional"]},
    {"key":"time_of_incident","label":"Time of Incident","type":"text","required":false,"placeholder":"e.g. 8:30 AM"}
  ]'
),
(
  'Other', NULL,
  '[
    {"key":"title","label":"Subject","type":"text","required":true},
    {"key":"description","label":"Description","type":"textarea","required":true},
    {"key":"location","label":"Location","type":"text","required":true},
    {"key":"image_url","label":"Reference Image URL","type":"text","required":false,"placeholder":"Paste image link (optional)"}
  ]'
)
ON CONFLICT DO NOTHING;


-- ── 13. SEED: DEPARTMENTS ───────────────────────────────────
INSERT INTO departments (name) VALUES
  ('Revenue'),
  ('Health'),
  ('Urban'),
  ('PublicWorks')
ON CONFLICT DO NOTHING;


-- ── 14. RPC FUNCTIONS ───────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS workload_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_workload(user_id UUID)
RETURNS void AS $$
  UPDATE users SET workload_count = workload_count + 1 WHERE id = user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrement_workload(user_id UUID)
RETURNS void AS $$
  UPDATE users SET workload_count = GREATEST(workload_count - 1, 0) WHERE id = user_id;
$$ LANGUAGE sql;


-- ── 15. ZONES (Taluks / Towns / Areas under each city/district) ──
CREATE TABLE IF NOT EXISTS zones (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(100) NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE
);

-- Seed zones using city names as reference
-- We use a subquery pattern: INSERT INTO zones (name, city_id) SELECT 'ZoneName', id FROM cities WHERE name = 'CityName'

-- Chennai zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Adyar'), ('Anna Nagar'), ('Ambattur'), ('Avadi'), ('Chromepet'),
  ('Guindy'), ('Kodambakkam'), ('Kolathur'), ('Madhavaram'), ('Manali'),
  ('Mylapore'), ('Perambur'), ('Porur'), ('Royapuram'), ('Sholinganallur'),
  ('T. Nagar'), ('Tambaram'), ('Thiruvottiyur'), ('Tondiarpet'), ('Velachery'),
  ('Villivakkam'), ('Washermanpet'), ('Egmore'), ('Nungambakkam'), ('Poonamallee')
) AS z(name_zone) WHERE cities.name = 'Chennai'
ON CONFLICT DO NOTHING;

-- Coimbatore zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Perur'), ('Singanallur'), ('Peelamedu'), ('Ganapathy'), ('Saibaba Colony'),
  ('RS Puram'), ('Gandhipuram'), ('Ukkadam'), ('Podanur'), ('Kuniyamuthur'),
  ('Vadavalli'), ('Thondamuthur'), ('Sulur'), ('Kinathukadavu'), ('Pollachi'),
  ('Mettupalayam'), ('Annur'), ('Karamadai'), ('Valparai'), ('Palladam'),
  ('Tirupur Road'), ('Avinashi Road'), ('Trichy Road'), ('Sathy Road'), ('Mettur Road')
) AS z(name_zone) WHERE cities.name = 'Coimbatore'
ON CONFLICT DO NOTHING;

-- Madurai zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Anna Nagar'), ('KK Nagar'), ('Tallakulam'), ('Palanganatham'), ('Thirunagar'),
  ('Vilangudi'), ('Avaniyapuram'), ('Koodal Nagar'), ('Teppakulam'), ('Goripalayam'),
  ('Usilampatti'), ('Melur'), ('Thirumangalam'), ('Vadipatti'), ('Peraiyur'),
  ('Kallikudi'), ('Sholavandan'), ('Sedapatti'), ('Tiruppuvanam'), ('Chellampatti')
) AS z(name_zone) WHERE cities.name = 'Madurai'
ON CONFLICT DO NOTHING;

-- Salem zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Fairlands'), ('Suramangalam'), ('Ammapet'), ('Hasthampatti'), ('Kondalampatti'),
  ('Attur'), ('Omalur'), ('Mettur'), ('Edappadi'), ('Sankari'),
  ('Yercaud'), ('Vazhapadi'), ('Thalaivasal'), ('Gangavalli'), ('Pethanaickenpalayam')
) AS z(name_zone) WHERE cities.name = 'Salem'
ON CONFLICT DO NOTHING;

-- Trichy zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Srirangam'), ('Ariyamangalam'), ('Thiruverumbur'), ('Golden Rock'), ('Woraiyur'),
  ('Thillai Nagar'), ('KK Nagar'), ('Palpannai'), ('Lalgudi'), ('Manachanallur'),
  ('Musiri'), ('Thuraiyur'), ('Manapparai'), ('Pullambadi'), ('Uppiliyapuram')
) AS z(name_zone) WHERE cities.name = 'Trichy'
ON CONFLICT DO NOTHING;

-- Tirunelveli zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Palayamkottai'), ('Melapalayam'), ('Pettai'), ('Vannarpettai'), ('Nanguneri'),
  ('Ambasamudram'), ('Tenkasi'), ('Sankarankovil'), ('Radhapuram'), ('Valliyur'),
  ('Cheranmahadevi'), ('Alangulam'), ('Kadayam'), ('Shencottai'), ('Courtallam')
) AS z(name_zone) WHERE cities.name = 'Tirunelveli'
ON CONFLICT DO NOTHING;

-- Vellore zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Katpadi'), ('Sathuvachari'), ('Bagayam'), ('Gandhinagar'), ('Ariyur'),
  ('Arcot'), ('Ranipet'), ('Walajah'), ('Arakkonam'), ('Sholingur'),
  ('Gudiyatham'), ('Vaniyambadi'), ('Ambur'), ('Jolarpet'), ('Tirupattur')
) AS z(name_zone) WHERE cities.name = 'Vellore'
ON CONFLICT DO NOTHING;

-- Erode zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Bhavani'), ('Perundurai'), ('Gobichettipalayam'), ('Sathyamangalam'), ('Anthiyur'),
  ('Kodumudi'), ('Nambiyur'), ('Thalavadi'), ('Modakurichi'), ('Kavindapadi'),
  ('Chithode'), ('Veerappanchatram'), ('Thindal'), ('Surampatti'), ('Uthukuli')
) AS z(name_zone) WHERE cities.name = 'Erode'
ON CONFLICT DO NOTHING;

-- Bengaluru zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Whitefield'), ('Electronic City'), ('Koramangala'), ('Indiranagar'), ('Jayanagar'),
  ('Rajajinagar'), ('Malleshwaram'), ('Yelahanka'), ('Hebbal'), ('Banashankari'),
  ('BTM Layout'), ('HSR Layout'), ('Marathahalli'), ('Sarjapur'), ('Bannerghatta Road')
) AS z(name_zone) WHERE cities.name = 'Bengaluru'
ON CONFLICT DO NOTHING;

-- Hyderabad zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Secunderabad'), ('Kukatpally'), ('LB Nagar'), ('Uppal'), ('Dilsukhnagar'),
  ('Ameerpet'), ('Banjara Hills'), ('Jubilee Hills'), ('Madhapur'), ('Gachibowli'),
  ('Mehdipatnam'), ('Tolichowki'), ('Miyapur'), ('Kompally'), ('Shamshabad')
) AS z(name_zone) WHERE cities.name = 'Hyderabad'
ON CONFLICT DO NOTHING;

-- Kochi zones
INSERT INTO zones (name, city_id) SELECT name_zone, id FROM cities, (VALUES
  ('Ernakulam'), ('Aluva'), ('Angamaly'), ('Perumbavoor'), ('Muvattupuzha'),
  ('Thrippunithura'), ('Kakkanad'), ('Edapally'), ('Kalamassery'), ('Vytila'),
  ('Fort Kochi'), ('Mattancherry'), ('Palluruthy'), ('Cheranalloor'), ('Piravom')
) AS z(name_zone) WHERE cities.name = 'Kochi'
ON CONFLICT DO NOTHING;


-- ── 16. DEMO DATA ───────────────────────────────────────────
-- Demo login: password = Demo@12345

INSERT INTO users (id, aadhaar_number, password_hash, role, name, city, officer_id, department, verified, workload_count) VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    '111111111111',
    '$2b$10$ATZwn1ZBUBfi.sfa.VTRieOi2quv1zWAlvefkeY4Zrxs5/L4Az/2e',
    'citizen',
    'Arun Kumar',
    'Chennai',
    NULL,
    NULL,
    true,
    0
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    '222222222222',
    '$2b$10$ATZwn1ZBUBfi.sfa.VTRieOi2quv1zWAlvefkeY4Zrxs5/L4Az/2e',
    'officer',
    'Meera Iyer',
    'Chennai',
    'OFF-2048',
    'PublicWorks',
    true,
    3
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    '333333333333',
    '$2b$10$ATZwn1ZBUBfi.sfa.VTRieOi2quv1zWAlvefkeY4Zrxs5/L4Az/2e',
    'admin',
    'System Admin',
    'Chennai',
    NULL,
    NULL,
    true,
    0
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO requests (id, citizen_id, assigned_officer_id, title, description, category, service_type, department, location, image_url, status, priority, resolution_notes, resolved_at, created_at, updated_at) VALUES
  (
    'd2000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000002',
    'Income Certificate Application',
    'Need an income certificate for scholarship verification.',
    'service',
    'Income Certificate',
    'Revenue',
    'Chennai / T. Nagar',
    NULL,
    'pending',
    'medium',
    NULL,
    NULL,
    timezone('utc'::text, now()) - interval '5 days',
    timezone('utc'::text, now()) - interval '5 days'
  ),
  (
    'd2000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000002',
    'Birth Certificate Follow-up',
    'Submitted additional document for birth certificate issuance.',
    'service',
    'Birth Certificate',
    'Health',
    'Chennai / Anna Nagar',
    NULL,
    'in_progress',
    'medium',
    NULL,
    NULL,
    timezone('utc'::text, now()) - interval '4 days',
    timezone('utc'::text, now()) - interval '2 days'
  ),
  (
    'd2000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000002',
    'Water Supply Grievance',
    'Frequent low pressure and intermittent supply in the neighborhood.',
    'grievance',
    NULL,
    'Urban',
    'Chennai / Mylapore',
    NULL,
    'resolved',
    'high',
    'Field team inspected the line and restored pressure at the feeder point.',
    timezone('utc'::text, now()) - interval '1 day',
    timezone('utc'::text, now()) - interval '6 days',
    timezone('utc'::text, now()) - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO complaints (id, user_id, type_id, assigned_officer_id, dynamic_data, city, routing_note, status, resolution_notes, escalated_at, resolved_at, created_at, updated_at) VALUES
  (
    'd3000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    (SELECT id FROM complaint_types WHERE name = 'Electricity Problem' LIMIT 1),
    'd1000000-0000-0000-0000-000000000002',
    '{"connection_number":"CN-7788","outage_duration":"6 hours","issue_type":"Voltage Fluctuation"}'::jsonb,
    'Chennai',
    'Assigned to PublicWorks officer in Chennai with the lowest verified workload.',
    'in_progress',
    NULL,
    timezone('utc'::text, now()) - interval '2 days',
    NULL,
    timezone('utc'::text, now()) - interval '2 days',
    timezone('utc'::text, now()) - interval '1 day'
  ),
  (
    'd3000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    (SELECT id FROM complaint_types WHERE name = 'Road Damage' LIMIT 1),
    'd1000000-0000-0000-0000-000000000002',
    '{"road_name":"Anna Salai","damage_type":"Pothole","severity":"Severe"}'::jsonb,
    'Chennai',
    'Assigned for inspection and closure after pothole report.',
    'resolved',
    'Road patch work completed and marked safe for traffic.',
    timezone('utc'::text, now()) - interval '3 days',
    timezone('utc'::text, now()) - interval '12 hours',
    timezone('utc'::text, now()) - interval '4 days',
    timezone('utc'::text, now()) - interval '12 hours'
  )
ON CONFLICT (id) DO NOTHING;
