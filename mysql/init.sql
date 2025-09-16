CREATE TABLE IF NOT EXISTS users (
    roleId VARCHAR(50) DEFAULT 'user',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    empresaId CHAR(36),
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_negocio VARCHAR(50),
    rol VARCHAR(50) DEFAULT 'tendero',
    status VARCHAR(20) DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(150),
    user_id VARCHAR(100),
    address VARCHAR(255),
    delivery_day VARCHAR(250),
    object_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sales_pd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date VARCHAR(50),
    customer VARCHAR(255),
    customer_email VARCHAR(255),
    products TEXT,
    payment_method VARCHAR(100),
    total DECIMAL(10, 2) NOT NULL,
    user_id VARCHAR(255),
    amount INT DEFAULT 0,
    dni VARCHAR(50),
    address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS inventory_pd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(100),
    user_id VARCHAR(100),
    supplier_name VARCHAR(100),
    presentation VARCHAR(50),
    expiration_date VARCHAR(250),
    profit_margin DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS objects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS qrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    object_id VARCHAR(100),
    user_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS orders_pd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(100),
    supplier VARCHAR(100),
    quantity VARCHAR(100),
    date VARCHAR(100),
    status VARCHAR(100),
    user_id VARCHAR(100)
);