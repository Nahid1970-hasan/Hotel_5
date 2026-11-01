PRAGMA foreign_keys = ON;

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  kind TEXT NOT NULL DEFAULT 'guest',
  reset_token TEXT,
  reset_expires TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE guests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  nationality TEXT,
  preferences TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE hotel_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL,
  currency TEXT NOT NULL,
  check_in_time TEXT NOT NULL,
  check_out_time TEXT NOT NULL,
  tax_percent REAL NOT NULL,
  service_fee_percent REAL NOT NULL,
  hold_minutes INTEGER NOT NULL DEFAULT 15
);

CREATE TABLE room_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  capacity_adults INTEGER NOT NULL,
  capacity_children INTEGER NOT NULL,
  bed_config TEXT,
  size_sqm INTEGER,
  view_name TEXT,
  category TEXT,
  base_price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  accessibility TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE amenities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE room_type_amenities (
  room_type_id INTEGER NOT NULL,
  amenity_id INTEGER NOT NULL,
  PRIMARY KEY (room_type_id, amenity_id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);

CREATE TABLE room_images (
  id INTEGER PRIMARY KEY,
  room_type_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type_id INTEGER NOT NULL,
  floor TEXT,
  wing TEXT,
  operational_status TEXT NOT NULL DEFAULT 'READY',
  accessible INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE TABLE cancellation_policies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  hours_before INTEGER NOT NULL,
  fee_percent REAL NOT NULL DEFAULT 0
);

CREATE TABLE rate_plans (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  meal_plan TEXT NOT NULL,
  cancellation_policy_id INTEGER NOT NULL,
  price_adjust_percent REAL NOT NULL DEFAULT 0,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (cancellation_policy_id) REFERENCES cancellation_policies(id)
);

CREATE TABLE room_rates (
  id INTEGER PRIMARY KEY,
  room_type_id INTEGER NOT NULL,
  rate_plan_id INTEGER NOT NULL,
  stay_date TEXT NOT NULL,
  currency TEXT NOT NULL,
  nightly_price_cents INTEGER NOT NULL,
  UNIQUE (room_type_id, rate_plan_id, stay_date),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id)
);

CREATE TABLE inventory_blocks (
  id INTEGER PRIMARY KEY,
  room_type_id INTEGER,
  room_id INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE promotions (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value REAL NOT NULL,
  terms TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  guest_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  rooms_requested INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  service_fee_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  special_requests TEXT,
  promo_code TEXT,
  hold_expires_at TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE TABLE booking_rooms (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  room_type_id INTEGER NOT NULL,
  room_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate_plan_id INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id)
);

CREATE TABLE booking_nights (
  id INTEGER PRIMARY KEY,
  booking_room_id INTEGER NOT NULL,
  stay_date TEXT NOT NULL,
  nightly_rate_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL,
  FOREIGN KEY (booking_room_id) REFERENCES booking_rooms(id) ON DELETE CASCADE
);

CREATE TABLE booking_status_history (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  actor_user_id INTEGER,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_reference TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE payment_events (
  id INTEGER PRIMARY KEY,
  payment_id INTEGER NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE refunds (
  id INTEGER PRIMARY KEY,
  payment_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE service_catalog (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE service_requests (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER,
  guest_id INTEGER,
  service_type TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE TABLE housekeeping_tasks (
  id INTEGER PRIMARY KEY,
  room_id INTEGER NOT NULL,
  assigned_user_id INTEGER,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE maintenance_tickets (
  id INTEGER PRIMARY KEY,
  room_id INTEGER,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_user_id INTEGER,
  notes TEXT,
  blocks_inventory INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER,
  guest_id INTEGER,
  guest_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'PENDING',
  response TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE TABLE facilities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hours TEXT,
  booking_note TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE dining_venues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT,
  description TEXT,
  hours TEXT,
  dress_code TEXT,
  dietary_notes TEXT,
  image_url TEXT
);

CREATE TABLE experiences (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  inclusions TEXT,
  exclusions TEXT,
  schedule TEXT,
  capacity INTEGER,
  price_cents INTEGER,
  currency TEXT,
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE offers (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  terms TEXT,
  discount_label TEXT,
  valid_from TEXT,
  valid_to TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  image_url TEXT
);

CREATE TABLE gallery_images (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE attractions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  travel_time TEXT,
  image_url TEXT
);

CREATE TABLE faqs (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pages (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  topic TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  booking_id INTEGER,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  actor_user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data TEXT,
  after_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bookings_ref ON bookings (booking_reference);
CREATE INDEX idx_bookings_guest ON bookings (guest_id);
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out, status);
CREATE INDEX idx_room_rates_lookup ON room_rates (room_type_id, rate_plan_id, stay_date);
CREATE INDEX idx_rooms_type ON rooms (room_type_id, operational_status);
CREATE INDEX idx_audit_created ON audit_logs (created_at);
