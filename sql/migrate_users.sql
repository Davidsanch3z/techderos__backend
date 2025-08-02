-- ==============================================
-- MIGRACIÓN PARA MICROSERVICIO DE USUARIOS
-- ==============================================
-- Actualiza el esquema para coincidir con el modelo de código

-- Crear tabla users (compatible con el modelo del código)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_negocio VARCHAR(50) DEFAULT 'tienda',
    rol VARCHAR(50) DEFAULT 'tendero',
    status VARCHAR(20) DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- ==============================================
-- TABLA DE REFRESH TOKENS (SIMPLIFICADA)
-- ==============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices para refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_active ON refresh_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ==============================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a la tabla users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCIÓN PARA LIMPIAR TOKENS EXPIRADOS
-- ==============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    tokens_deleted INTEGER;
BEGIN
    UPDATE refresh_tokens 
    SET is_active = FALSE, revoked_at = NOW()
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    GET DIAGNOSTICS tokens_deleted = ROW_COUNT;
    
    RETURN tokens_deleted;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VALIDACIONES CON CONSTRAINTS
-- ==============================================

-- Validar tipo_negocio
ALTER TABLE users ADD CONSTRAINT check_tipo_negocio 
CHECK (tipo_negocio IN ('tienda', 'supermercado', 'farmacia', 'restaurante', 'otro'));

-- Validar rol
ALTER TABLE users ADD CONSTRAINT check_rol 
CHECK (rol IN ('tendero', 'administrador', 'supervisor'));

-- Validar status
ALTER TABLE users ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));

-- Validar email formato básico
ALTER TABLE users ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ==============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ==============================================
COMMENT ON TABLE users IS 'Usuarios del sistema de gestión comercial';
COMMENT ON COLUMN users.tipo_negocio IS 'Tipo de negocio del usuario: tienda, supermercado, farmacia, restaurante, otro';
COMMENT ON COLUMN users.rol IS 'Rol del usuario: tendero, administrador, supervisor';
COMMENT ON COLUMN users.status IS 'Estado de la cuenta: pending, active, inactive, suspended';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt de la contraseña del usuario';
COMMENT ON COLUMN users.email_verification_token IS 'Token para verificación de email';
COMMENT ON COLUMN users.password_reset_token IS 'Token para reset de contraseña';
COMMENT ON COLUMN users.failed_login_attempts IS 'Número de intentos fallidos de login consecutivos';
COMMENT ON COLUMN users.locked_until IS 'Fecha hasta la cual la cuenta está bloqueada';

COMMENT ON TABLE refresh_tokens IS 'Tokens de renovación para autenticación JWT';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hash del refresh token para mayor seguridad';
