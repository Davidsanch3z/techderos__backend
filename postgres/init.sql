CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    "roleId" VARCHAR(50) DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "empresaId" UUID,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_negocio VARCHAR(50),
    rol VARCHAR(50) DEFAULT 'tendero',
    status VARCHAR(20) DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(150),
    user_id VARCHAR(100),
    address VARCHAR(255),
    delivery_day DATE,
    object_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sales_pd (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    products TEXT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    user_id VARCHAR(255),
    amount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_pd (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(100),
    user_id VARCHAR(100),
    supplier_name VARCHAR(100),
    presentation VARCHAR(50),
    expiration_date DATE,
    profit_margin DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS objects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS qrs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    object_id VARCHAR(100),
    user_id VARCHAR(100)
);