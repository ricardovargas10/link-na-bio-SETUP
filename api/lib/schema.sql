-- Tabelas do link na bio da Set Up (MySQL / MariaDB da Hostinger).
-- Criadas pelo instalar.php. Todas com o prefixo setup_ para não misturar com outros sistemas no mesmo banco.

-- Conteúdo editável (botões, redes, página), guardado como JSON em uma linha por chave.
CREATE TABLE IF NOT EXISTS setup_kv (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v MEDIUMTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imagens enviadas pelo painel (logo, ícones próprios e imagens de destaque).
CREATE TABLE IF NOT EXISTS setup_media (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  data MEDIUMBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cliques por botão ou rede.
CREATE TABLE IF NOT EXISTS setup_clicks (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  n INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitas por dia (horário de Brasília).
CREATE TABLE IF NOT EXISTS setup_visits (
  day DATE NOT NULL PRIMARY KEY,
  n INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pessoas por dia: só um código aleatório do navegador, embaralhado (nada pessoal).
CREATE TABLE IF NOT EXISTS setup_visitors (
  visitor CHAR(64) NOT NULL,
  day DATE NOT NULL,
  PRIMARY KEY (visitor, day),
  KEY day_idx (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tentativas de login por IP (bloqueio de 15 min depois de 5 erradas).
CREATE TABLE IF NOT EXISTS setup_login_attempts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  at DATETIME NOT NULL,
  KEY ip_at (ip, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuários do painel (senha só como hash bcrypt).
CREATE TABLE IF NOT EXISTS setup_admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
