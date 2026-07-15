-- Initialize database schema and tables for HDB resale insights
CREATE SCHEMA IF NOT EXISTS hdb;

CREATE TABLE IF NOT EXISTS hdb.hdb_resale_prices (
    month DATE,
    town VARCHAR(50),
    flat_type VARCHAR(20),
    block VARCHAR(10),
    street_name VARCHAR(100),
    storey_range VARCHAR(20),
    floor_area_sqm NUMERIC,
    flat_model VARCHAR(50),
    lease_commence_date INTEGER,
    resale_price NUMERIC,
    source_filename VARCHAR(100)
);
