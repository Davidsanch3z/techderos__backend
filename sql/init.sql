-- ==============================================
-- INICIALIZACIÓN DE BASE DE DATOS
-- ==============================================
-- Script ejecutado automáticamente al crear el container
-- Crea las estructuras iniciales de la base de datos
-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- TABLA DE ROLES
-- ==============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(150),
    address VARCHAR(255),
    delivery_day DATE,
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
    profit_margin DECIMAL(5, 2)
);

-- Crear índice en nombre de rol
CREATE INDEX IF NOT EXISTS idx_roles_nombre ON roles(nombre);

-- ==============================================
-- TABLA DE USUARIOS
-- ==============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    avatar_url TEXT,
    rol_id INTEGER REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    fecha_ultimo_acceso TIMESTAMP WITH TIME ZONE,
    intentos_login INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE,
    token_verificacion VARCHAR(255),
    token_reset_password VARCHAR(255),
    fecha_expiracion_reset TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios(email_verificado);

CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON usuarios(token_verificacion);

CREATE INDEX IF NOT EXISTS idx_usuarios_token_reset ON usuarios(token_reset_password);

-- ==============================================
-- TABLA DE SESIONES (REFRESH TOKENS)
-- ==============================================
CREATE TABLE IF NOT EXISTS sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    dispositivo VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_ultimo_uso TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_sesiones_refresh_token ON sesiones(refresh_token_hash);

CREATE INDEX IF NOT EXISTS idx_sesiones_activa ON sesiones(activa);

CREATE INDEX IF NOT EXISTS idx_sesiones_expiracion ON sesiones(fecha_expiracion);

-- ==============================================
-- TABLA DE AUDITORÍA DE ACCIONES
-- ==============================================
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    recurso VARCHAR(100),
    recurso_id VARCHAR(255),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha);

CREATE INDEX IF NOT EXISTS idx_auditoria_recurso ON auditoria(recurso, recurso_id);

-- ==============================================
-- FUNCIONES AUXILIARES
-- ==============================================
-- Función para actualizar fecha_actualizacion automáticamente
CREATE
OR REPLACE FUNCTION actualizar_fecha_modificacion() RETURNS TRIGGER AS $ $ BEGIN NEW.fecha_actualizacion = NOW();

RETURN NEW;

END;

$ $ language 'plpgsql';

-- ==============================================
-- TRIGGERS
-- ==============================================
-- Trigger para actualizar fecha_actualizacion en roles
DROP TRIGGER IF EXISTS trigger_roles_fecha_actualizacion ON roles;

CREATE TRIGGER trigger_roles_fecha_actualizacion BEFORE
UPDATE
    ON roles FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para actualizar fecha_actualizacion en usuarios
DROP TRIGGER IF EXISTS trigger_usuarios_fecha_actualizacion ON usuarios;

CREATE TRIGGER trigger_usuarios_fecha_actualizacion BEFORE
UPDATE
    ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ==============================================
-- FUNCIÓN PARA LIMPIAR SESIONES EXPIRADAS
-- ==============================================
CREATE
OR REPLACE FUNCTION limpiar_sesiones_expiradas() RETURNS INTEGER AS $ $ DECLARE sesiones_eliminadas INTEGER;

BEGIN
DELETE FROM
    sesiones
WHERE
    fecha_expiracion < NOW()
    OR activa = FALSE;

GET DIAGNOSTICS sesiones_eliminadas = ROW_COUNT;

RETURN sesiones_eliminadas;

END;

$ $ LANGUAGE plpgsql;

-- ==============================================
-- FUNCIÓN PARA REGISTRAR AUDITORÍA
-- ==============================================
CREATE
OR REPLACE FUNCTION registrar_auditoria(
    p_usuario_id UUID,
    p_accion VARCHAR(100),
    p_recurso VARCHAR(100) DEFAULT NULL,
    p_recurso_id VARCHAR(255) DEFAULT NULL,
    p_datos_anteriores JSONB DEFAULT NULL,
    p_datos_nuevos JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $ $ DECLARE auditoria_id UUID;

BEGIN
INSERT INTO
    auditoria (
        usuario_id,
        accion,
        recurso,
        recurso_id,
        datos_anteriores,
        datos_nuevos,
        ip_address,
        user_agent
    )
VALUES
    (
        p_usuario_id,
        p_accion,
        p_recurso,
        p_recurso_id,
        p_datos_anteriores,
        p_datos_nuevos,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO auditoria_id;

RETURN auditoria_id;

END;

$ $ LANGUAGE plpgsql;

-- ==============================================
-- VISTA PARA USUARIOS CON ROL
-- ==============================================
CREATE
OR REPLACE VIEW vista_usuarios AS
SELECT
    u.id,
    u.email,
    u.nombre,
    u.apellido,
    u.telefono,
    u.fecha_nacimiento,
    u.avatar_url,
    u.activo,
    u.email_verificado,
    u.fecha_ultimo_acceso,
    u.fecha_creacion,
    u.fecha_actualizacion,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    r.permisos as rol_permisos
FROM
    usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id;

-- ==============================================
-- COMENTARIOS EN TABLAS
-- ==============================================
COMMENT ON TABLE roles IS 'Roles del sistema con permisos asociados';

COMMENT ON TABLE usuarios IS 'Usuarios registrados en el sistema';

COMMENT ON TABLE sesiones IS 'Sesiones activas y refresh tokens';

COMMENT ON TABLE auditoria IS 'Registro de auditoría de acciones del sistema';

COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt de la contraseña';

COMMENT ON COLUMN usuarios.intentos_login IS 'Contador de intentos fallidos de login';

COMMENT ON COLUMN usuarios.bloqueado_hasta IS 'Fecha hasta la cual el usuario está bloqueado';

COMMENT ON COLUMN usuarios.metadata IS 'Información adicional en formato JSON';

COMMENT ON COLUMN sesiones.refresh_token_hash IS 'Hash del refresh token para seguridad';

COMMENT ON COLUMN roles.permisos IS 'Array de permisos en formato JSON';