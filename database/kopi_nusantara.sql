-- Database asli untuk Kopi Nusantara
-- Import file ini lewat phpMyAdmin: pilih menu Import, lalu upload file ini.
-- Pastikan MySQL/MariaDB menggunakan utf8mb4 agar emoji menu tersimpan dengan benar.

CREATE DATABASE IF NOT EXISTS kopi_nusantara
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kopi_nusantara;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS menus;

CREATE TABLE menus (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '☕',
  available TINYINT(1) NOT NULL DEFAULT 1,
  recommended TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id VARCHAR(80) NOT NULL,
  short_id VARCHAR(30) NOT NULL,
  meja VARCHAR(20) NOT NULL,
  nama VARCHAR(120) NOT NULL DEFAULT 'Pelanggan Anonim',
  total INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Masuk',
  tanggal DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pembayaran VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_short_id_unique (short_id),
  KEY orders_status_index (status),
  KEY orders_meja_index (meja),
  KEY orders_tanggal_index (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(80) NOT NULL,
  menu_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  customization LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_items_order_id_index (order_id),
  KEY order_items_menu_id_index (menu_id),
  CONSTRAINT order_items_order_id_fk
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT order_items_menu_id_fk
    FOREIGN KEY (menu_id) REFERENCES menus(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expenses (
  id VARCHAR(80) NOT NULL,
  tanggal DATE NOT NULL,
  kategori VARCHAR(80) NOT NULL DEFAULT 'Lainnya',
  deskripsi TEXT NOT NULL,
  jumlah INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY expenses_tanggal_index (tanggal),
  KEY expenses_kategori_index (kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO menus (id, name, category, price, description, icon, available, recommended) VALUES
(1, 'Espresso', 'Kopi Panas', 25000, 'Biji robusta pilihan, shot 30ml.', '☕', 1, 1),
(2, 'Americano', 'Kopi Panas', 28000, 'Espresso dan air panas dengan rasa bersih.', '☕', 1, 1),
(3, 'Cappuccino', 'Kopi Panas', 35000, 'Espresso, steamed milk, dan foam lembut.', '☕', 1, 1),
(4, 'Latte', 'Kopi Panas', 38000, 'Espresso dan susu lembut, creamy.', '☕', 1, 0),
(5, 'V60 Drip Aceh Gayo', 'Kopi Panas', 45000, 'Single origin dengan karakter fruity dan floral.', '🌿', 1, 0),
(6, 'Kopi Toraja', 'Kopi Panas', 42000, 'Earthy, full body, klasik Sulawesi.', '🌋', 1, 0),
(7, 'Es Kopi Susu', 'Kopi Dingin', 32000, 'Kopi, susu segar, dan es batu.', '🧊', 1, 0),
(8, 'Cold Brew', 'Kopi Dingin', 38000, 'Seduh dingin 18 jam, smooth dan bold.', '🧊', 1, 0),
(9, 'Iced Caramel Latte', 'Kopi Dingin', 42000, 'Latte dingin dengan karamel homemade.', '🍯', 1, 0),
(10, 'Iced Matcha Latte', 'Kopi Dingin', 40000, 'Matcha premium dengan oat milk.', '🍵', 1, 0),
(11, 'Dirty Coffee', 'Kopi Dingin', 35000, 'Espresso shot di atas susu dingin.', '🥛', 1, 0),
(12, 'Kopi Aren', 'Kopi Dingin', 33000, 'Espresso dengan gula aren asli Sulawesi.', '🧋', 1, 0),
(13, 'Coklat Panas', 'Non-Kopi', 32000, 'Dark chocolate 70%, creamy.', '🍫', 1, 0),
(14, 'Teh Tarik', 'Non-Kopi', 25000, 'Teh pekat dan susu kental.', '🫖', 1, 0),
(15, 'Strawberry Smoothie', 'Non-Kopi', 38000, 'Buah segar blend dengan tekstur lembut.', '🍓', 1, 0),
(16, 'Lemon Squash', 'Non-Kopi', 28000, 'Lemon segar, soda, dan madu.', '🍋', 1, 0),
(17, 'Croissant Butter', 'Makanan', 28000, 'Renyah di luar dan lembut di dalam.', '🥐', 1, 0),
(18, 'Banana Bread', 'Makanan', 30000, 'Homemade dengan pisang cavendish.', '🍌', 1, 0),
(19, 'Roti Bakar Nusantara', 'Makanan', 25000, 'Kaya, selai kacang, dan coklat.', '🍞', 1, 0),
(20, 'Nasi Goreng Kampung', 'Makanan', 45000, 'Nasi goreng, telur, dan ayam.', '🍛', 1, 0),
(21, 'Sandwich Ayam', 'Makanan', 42000, 'Roti gandum, ayam panggang, dan sayur.', '🥪', 1, 0),
(22, 'Kue Lapis Surabaya', 'Makanan', 35000, 'Kue tradisional Indonesia yang lembut.', '🍰', 1, 0);

ALTER TABLE menus AUTO_INCREMENT = 23;
