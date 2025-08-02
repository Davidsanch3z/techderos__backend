-- ==============================================
-- DATOS INICIALES (SEED DATA)
-- ==============================================
-- Script para poblar la base de datos con datos iniciales
-- Ejecutado automáticamente después de init.sql

-- ==============================================
-- INSERTAR ROLES BÁSICOS
-- ==============================================
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('superadmin', 'Super Administrador del sistema', '[
    "usuarios:crear", "usuarios:leer", "usuarios:actualizar", "usuarios:eliminar",
    "roles:crear", "roles:leer", "roles:actualizar", "roles:eliminar",
    "auditoria:leer", "sistema:configurar", "reportes:generar"
]'::jsonb),

('admin', 'Administrador', '[
    "usuarios:crear", "usuarios:leer", "usuarios:actualizar",
    "roles:leer", "auditoria:leer", "reportes:generar"
]'::jsonb),

('gerente', 'Gerente Comercial', '[
    "usuarios:leer", "usuarios:actualizar",
    "clientes:crear", "clientes:leer", "clientes:actualizar",
    "ventas:crear", "ventas:leer", "ventas:actualizar",
    "reportes:leer"
]'::jsonb),

('vendedor', 'Vendedor', '[
    "clientes:crear", "clientes:leer", "clientes:actualizar",
    "ventas:crear", "ventas:leer", "productos:leer"
]'::jsonb),

('cliente', 'Cliente Final', '[
    "perfil:leer", "perfil:actualizar",
    "pedidos:crear", "pedidos:leer",
    "productos:leer"
]'::jsonb)
ON CONFLICT (nombre) DO NOTHING;

-- ==============================================
-- INSERTAR USUARIO SUPERADMIN INICIAL
-- ==============================================
-- Contraseña: Admin123!
-- Hash generado con bcrypt (12 rounds)
INSERT INTO usuarios (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    rol_id, 
    activo, 
    email_verificado,
    metadata
) VALUES (
    'admin@gestioncomercial.com',
    '$2b$12$LQv3c1yqBwEHIrLDKU5.UeIeQdPeBP5QyQNLPZZF8Paw9/ZRuqd1K',
    'Super',
    'Administrador',
    (SELECT id FROM roles WHERE nombre = 'superadmin'),
    TRUE,
    TRUE,
    '{"created_by": "system", "initial_setup": true}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- INSERTAR USUARIOS DE PRUEBA
-- ==============================================
-- Contraseña para todos: Test123!
-- Hash: $2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Administrador
INSERT INTO usuarios (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono,
    rol_id, 
    activo, 
    email_verificado,
    metadata
) VALUES (
    'administrador@gestioncomercial.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Carlos',
    'Rodríguez',
    '+34 600 123 456',
    (SELECT id FROM roles WHERE nombre = 'admin'),
    TRUE,
    TRUE,
    '{"departamento": "TI", "ubicacion": "Madrid"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Gerente
INSERT INTO usuarios (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono,
    rol_id, 
    activo, 
    email_verificado,
    metadata
) VALUES (
    'gerente@gestioncomercial.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'María',
    'García',
    '+34 600 234 567',
    (SELECT id FROM roles WHERE nombre = 'gerente'),
    TRUE,
    TRUE,
    '{"departamento": "Ventas", "region": "Norte", "equipo": 5}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Vendedor
INSERT INTO usuarios (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono,
    rol_id, 
    activo, 
    email_verificado,
    metadata
) VALUES (
    'vendedor@gestioncomercial.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Juan',
    'López',
    '+34 600 345 678',
    (SELECT id FROM roles WHERE nombre = 'vendedor'),
    TRUE,
    TRUE,
    '{"territorio": "Madrid-Centro", "supervisor": "María García"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Cliente de prueba
INSERT INTO usuarios (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono,
    rol_id, 
    activo, 
    email_verificado,
    metadata
) VALUES (
    'cliente@example.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Ana',
    'Martín',
    '+34 600 456 789',
    (SELECT id FROM roles WHERE nombre = 'cliente'),
    TRUE,
    TRUE,
    '{"empresa": "Empresa Demo S.L.", "sector": "Tecnología"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- REGISTRAR AUDITORÍA DE CONFIGURACIÓN INICIAL
-- ==============================================
INSERT INTO auditoria (
    usuario_id,
    accion,
    recurso,
    datos_nuevos,
    ip_address
) VALUES (
    (SELECT id FROM usuarios WHERE email = 'admin@gestioncomercial.com'),
    'sistema_inicializado',
    'sistema',
    '{"roles_creados": 5, "usuarios_creados": 5, "fecha": "' || NOW() || '"}'::jsonb,
    '127.0.0.1'::inet
);

-- ==============================================
-- CONFIGURAR SECUENCIAS
-- ==============================================
-- Asegurar que las secuencias empiecen en el valor correcto
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- ==============================================
-- VERIFICAR DATOS INSERTADOS
-- ==============================================
-- Mostrar resumen de roles creados
DO $$
DECLARE
    total_roles INTEGER;
    total_usuarios INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_roles FROM roles;
    SELECT COUNT(*) INTO total_usuarios FROM usuarios;
    
    RAISE NOTICE 'Configuración inicial completada:';
    RAISE NOTICE '- Roles creados: %', total_roles;
    RAISE NOTICE '- Usuarios creados: %', total_usuarios;
    RAISE NOTICE '- Usuario admin: admin@gestioncomercial.com (Admin123!)';
    RAISE NOTICE '- Usuarios de prueba: contraseña Test123!';
END $$;
