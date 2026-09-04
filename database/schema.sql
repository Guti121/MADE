-- Auto-generated schema dump
-- Database: essence_DB
-- Generated: 2026-08-20T00:25:26.906Z

CREATE TYPE user_role AS ENUM ('admin', 'owner', 'client');

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE users (
  id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  location_id INTEGER,
  role user_role NOT NULL,
  lastname VARCHAR(30) NOT NULL,
  state BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- ============================================
-- Table: brands
-- ============================================
CREATE TABLE brands (
  id INTEGER NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  weight BOOLEAN DEFAULT false,
  PRIMARY KEY (id),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT fk_user_brand FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL
);

-- ============================================
-- Table: user_sessions
-- ============================================
CREATE TABLE user_sessions (
  id INTEGER NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  user_id INTEGER NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- ============================================
-- Table: formulas
-- ============================================
CREATE TABLE formulas (
  id INTEGER NOT NULL DEFAULT nextval('formulas_id_seq'::regclass),
  name VARCHAR(150) NOT NULL,
  brand_id INTEGER NOT NULL,
  final_quantity NUMERIC(14,4) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  container_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  state BOOLEAN NOT NULL DEFAULT true,
  consumer_price NUMERIC(12,0),
  wholesale_price NUMERIC(12,0),
  PRIMARY KEY (id),
  CONSTRAINT fk_formula_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE INDEX idx_formulas_brand ON public.formulas USING btree (brand_id);

-- ============================================
-- Table: locations
-- ============================================
CREATE TABLE locations (
  id INTEGER NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  brand_id INTEGER NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: type_components
-- ============================================
CREATE TABLE type_components (
  id INTEGER NOT NULL DEFAULT nextval('type_components_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30),
  PRIMARY KEY (id),
  CONSTRAINT uq_type_components_name UNIQUE (name),
  CONSTRAINT uq_type_components_code UNIQUE (code)
);

-- Default global catalog: shared by every brand and location.
-- Managed by SQL/seed only (there is no runtime API to create/edit/delete these).
INSERT INTO type_components (name, code) VALUES
  ('Esencias', 'ESSENCE'),
  ('Absolutos', NULL),
  ('Aromas', NULL),
  ('Fijadores', NULL),
  ('Feromonas', NULL),
  ('Alcohol', NULL),
  ('Diluyentes', NULL),
  ('Agua destilada', NULL),
  ('Solubilizantes', NULL),
  ('Conservantes', NULL),
  ('Antioxidantes', NULL),
  ('Colorantes', NULL),
  ('Resinas y bálsamos', NULL);

-- ============================================
-- Table: type_containers
-- ============================================
CREATE TABLE type_containers (
  id INTEGER NOT NULL DEFAULT nextval('type_containers_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  state BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  brand_id INTEGER NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_type_container_brand UNIQUE (name, brand_id),
  CONSTRAINT fk_type_containers_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: components
-- ============================================
CREATE TABLE components (
  id INTEGER NOT NULL DEFAULT nextval('components_id_seq'::regclass),
  name VARCHAR(255) NOT NULL,
  type_component_id INTEGER NOT NULL,
  brand_id INTEGER,
  state BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT fk_type_component FOREIGN KEY (type_component_id) REFERENCES type_components(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

CREATE INDEX idx_components_location ON public.components USING btree (type_component_id);

-- ============================================
-- Table: containers
-- ============================================
CREATE TABLE containers (
  id INTEGER NOT NULL DEFAULT nextval('containers_id_seq'::regclass),
  name VARCHAR(100) NOT NULL,
  capacity NUMERIC(12,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  brand_id INTEGER NOT NULL,
  state BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_by INTEGER,
  updated_by INTEGER,
  type_container_id INTEGER NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_containers_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_containers_type FOREIGN KEY (type_container_id) REFERENCES type_containers(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- ============================================
-- Table: sales
-- ============================================
CREATE TABLE sales (
  id INTEGER NOT NULL DEFAULT nextval('sales_id_seq'::regclass),
  location_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  client_id INTEGER,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  is_wholesale BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER,
  PRIMARY KEY (id),
  CONSTRAINT fk_sales_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_sales_location FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- ============================================
-- Table: clients
-- ============================================
CREATE TABLE clients (
  id INTEGER NOT NULL DEFAULT nextval('clients_id_seq'::regclass),
  document VARCHAR(50),
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  last_sale_id INTEGER,
  last_sale_at TIMESTAMP WITHOUT TIME ZONE,
  total_spend NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_clients_document UNIQUE (document),
  CONSTRAINT fk_clients_last_sale FOREIGN KEY (last_sale_id) REFERENCES sales(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- ============================================
-- Table: containers_stock
-- ============================================
CREATE TABLE containers_stock (
  id INTEGER NOT NULL DEFAULT nextval('containers_stock_id_seq'::regclass),
  container_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity NUMERIC(12,0) NOT NULL DEFAULT 0,
  avg_price NUMERIC(12,0) DEFAULT 0,
  wholesale_price NUMERIC(12,0) DEFAULT 0,
  consumer_price NUMERIC(12,0) DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_by INTEGER,
  updated_by INTEGER,
  PRIMARY KEY (id),
  CONSTRAINT unique_container_location UNIQUE (container_id, location_id),
  CONSTRAINT fk_container_stock_container FOREIGN KEY (container_id) REFERENCES containers(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_container_stock_location FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: formula_components
-- ============================================
CREATE TABLE formula_components (
  id INTEGER NOT NULL DEFAULT nextval('formula_components_id_seq'::regclass),
  formula_id INTEGER NOT NULL,
  component_id INTEGER,
  type_component_id INTEGER,
  quantity NUMERIC(12,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_formula_line CHECK (component_id IS NOT NULL OR type_component_id IS NOT NULL),
  CONSTRAINT fk_formula_components_component FOREIGN KEY (component_id) REFERENCES components(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_formula_components_type_component FOREIGN KEY (type_component_id) REFERENCES type_components(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT fk_formula_components_formula FOREIGN KEY (formula_id) REFERENCES formulas(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE INDEX idx_formula_components_formula ON public.formula_components USING btree (formula_id);
CREATE INDEX idx_formula_components_component ON public.formula_components USING btree (component_id);

-- ============================================
-- Table: sales_items
-- ============================================
CREATE TABLE sales_items (
  id INTEGER NOT NULL DEFAULT nextval('sales_items_id_seq'::regclass),
  sale_id INTEGER NOT NULL,
  formula_id INTEGER,
  formula_name_snapshot VARCHAR(150),
  quantity NUMERIC(14,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  discount NUMERIC(14,2) DEFAULT 0,
  tax NUMERIC(14,2) DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL,
  formula_unit_price NUMERIC(12,0),
  formula_base_price NUMERIC(12,0),
  PRIMARY KEY (id),
  CONSTRAINT fk_sales_items_formula FOREIGN KEY (formula_id) REFERENCES formulas(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_sales_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: stock
-- ============================================
CREATE TABLE stock (
  id INTEGER NOT NULL DEFAULT nextval('stock_id_seq'::regclass),
  component_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  consumer_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  state BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT unique_component_location UNIQUE (component_id, location_id),
  CONSTRAINT fk_stock_component FOREIGN KEY (component_id) REFERENCES components(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_stock_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT fk_stock_location FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_stock_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL
);

-- ============================================
-- Table: component_jar_stock
-- ============================================
CREATE TABLE component_jar_stock (
  id INTEGER NOT NULL DEFAULT nextval('component_jar_stock_id_seq'::regclass),
  component_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  state BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT unique_jar_component_location UNIQUE (component_id, location_id),
  CONSTRAINT fk_jar_stock_component FOREIGN KEY (component_id) REFERENCES components(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_jar_stock_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT fk_jar_stock_location FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_jar_stock_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL
);

-- ============================================
-- Table: jar_movements
-- ============================================
CREATE TABLE jar_movements (
  id INTEGER NOT NULL DEFAULT nextval('jar_movements_id_seq'::regclass),
  jar_stock_id INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_jar_movement_stock FOREIGN KEY (jar_stock_id) REFERENCES component_jar_stock(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_jar_movement_user FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

-- ============================================
-- Table: container_movements
-- ============================================
CREATE TABLE container_movements (
  id INTEGER NOT NULL DEFAULT nextval('container_movements_id_seq'::regclass),
  container_stock_id INTEGER NOT NULL,
  container_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(14,4) NOT NULL,
  unit_price NUMERIC(14,6) NOT NULL,
  total_price NUMERIC(14,2) NOT NULL,
  reason TEXT,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_by INTEGER,
  PRIMARY KEY (id),
  CONSTRAINT fk_container_movement_stock FOREIGN KEY (container_stock_id) REFERENCES containers_stock(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: sale_item_components
-- ============================================
CREATE TABLE sale_item_components (
  id INTEGER NOT NULL DEFAULT nextval('sale_item_components_id_seq'::regclass),
  sale_item_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  component_name_snapshot VARCHAR(255),
  is_essence BOOLEAN NOT NULL DEFAULT false,
  quantity_used NUMERIC(14,4) NOT NULL,
  unit_cost NUMERIC(14,6) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,0) NOT NULL,
  total_price NUMERIC(14,0) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_sale_item_component_component FOREIGN KEY (component_id) REFERENCES components(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_sale_item_component_sale_item FOREIGN KEY (sale_item_id) REFERENCES sales_items(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: sale_item_containers
-- ============================================
CREATE TABLE sale_item_containers (
  id INTEGER NOT NULL DEFAULT nextval('sale_item_containers_id_seq'::regclass),
  sale_item_id INTEGER NOT NULL,
  container_id INTEGER NOT NULL,
  container_name_snapshot VARCHAR(100),
  quantity_used NUMERIC(14,2) NOT NULL,
  unit_cost NUMERIC(14,6) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,0) NOT NULL,
  total_price NUMERIC(14,0) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_sale_item_container_container FOREIGN KEY (container_id) REFERENCES containers(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_sale_item_container_sale_item FOREIGN KEY (sale_item_id) REFERENCES sales_items(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- ============================================
-- Table: stock_movements
-- ============================================
CREATE TABLE stock_movements (
  id INTEGER NOT NULL DEFAULT nextval('stock_movements_id_seq'::regclass),
  stock_id INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  total_price NUMERIC(14,2) NOT NULL,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_stock_movement_stock FOREIGN KEY (stock_id) REFERENCES stock(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT fk_stock_movement_user FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

-- ============================================
-- Deferred foreign keys (break circular dependencies)
-- ============================================
ALTER TABLE users ADD CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE SET NULL;
