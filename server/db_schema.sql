-- 管理员表
CREATE TABLE IF NOT EXISTS "AdminUsers" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(128) NOT NULL
);

-- 脚本表
CREATE TABLE IF NOT EXISTS "Scripts" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  file_path_obfuscated TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_config JSONB,
  exec_args TEXT,
  file_type VARCHAR(16)
);

-- 安装会话令牌表
CREATE TABLE IF NOT EXISTS "InstallSessionTokens" (
  id SERIAL PRIMARY KEY,
  token_value VARCHAR(64) UNIQUE NOT NULL,
  fk_script_id INTEGER REFERENCES "Scripts"(id),
  customer_info TEXT,
  status VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 激活记录表
CREATE TABLE IF NOT EXISTS "ActivatedInstallations" (
  id SERIAL PRIMARY KEY,
  fk_ist_id INTEGER REFERENCES "InstallSessionTokens"(id),
  hardware_ids_hash VARCHAR(128) NOT NULL,
  platform_info TEXT,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 