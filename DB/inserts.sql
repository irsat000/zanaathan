
USE ZanaatHan;

# SETTINGS

INSERT INTO `contact_type`(`Id`, `Body`) VALUES(1, 'Cep Telefonu');
INSERT INTO `contact_type`(`Id`, `Body`) VALUES(2, 'İş Telefonu');
INSERT INTO `contact_type`(`Id`, `Body`) VALUES(3, 'Ev Telefonu');
INSERT INTO `contact_type`(`Id`, `Body`) VALUES(4, 'E-Posta');
INSERT INTO `contact_type`(`Id`, `Body`) VALUES(5, 'İnstagram');

INSERT INTO `oauth_provider`(`Id`, `Body`) VALUES(1, 'Google');
INSERT INTO `oauth_provider`(`Id`, `Body`) VALUES(2, 'Facebook');

INSERT INTO `notification_type`(`Id`, `Code`, `Title`, `Description`)
	VALUES(1, 'postExpiration',
	'İlanınız işlem bekliyor',
    'Lütfen ilanınızın son durumu hakkında bizi bilgilendirin. Bu bildirime tıklayın.');
INSERT INTO `notification_type`(`Id`, `Code`, `Title`, `Description`)
	VALUES(2, 'postAutoSetToCompleted',
	'Bir ilanınız otomatik olarak yayından kaldırıldı',
    '7 gün önce gönderdiğimiz bildirimden yanıt alamadık. Detaylar için tıklayınız.');

/*--*/
INSERT INTO `current_status`(`Id`, `Body`) VALUES(1, 'Usta bekliyor');
INSERT INTO `current_status`(`Id`, `Body`) VALUES(2, 'Anlaşıldı');
INSERT INTO `current_status`(`Id`, `Body`) VALUES(3, 'Tamamlandı');
INSERT INTO `current_status`(`Id`, `Body`) VALUES(4, 'Kaldırıldı');
INSERT INTO `current_status`(`Id`, `Body`) VALUES(5, 'Onay bekliyor');

INSERT INTO `expiration_status`(`Id`, `Body`) VALUES(1, 'Warning');
INSERT INTO `expiration_status`(`Id`, `Body`) VALUES(2, 'Extended');
INSERT INTO `expiration_status`(`Id`, `Body`) VALUES(3, 'GuestPost');
/*--*/
INSERT INTO `role`(`Id`, `RoleCode`) VALUES(1, 'developer');
INSERT INTO `role`(`Id`, `RoleCode`) VALUES(2, 'admin');
INSERT INTO `role`(`Id`, `RoleCode`) VALUES(3, 'moderator');




SET SQL_SAFE_UPDATES = 0;
DELETE FROM `contact_type`;
SET SQL_SAFE_UPDATES = 1;

select * from category;
select * from sub_category;
select * from current_status;











INSERT INTO `category`(`Id`, `Code`) VALUES(1, 'elektrik');
INSERT INTO `category`(`Id`, `Code`) VALUES(2, 'isitma-ve-sogutma');
INSERT INTO `category`(`Id`, `Code`) VALUES(3, 'ahsap');
INSERT INTO `category`(`Id`, `Code`) VALUES(4, 'metal-kaynak');
INSERT INTO `category`(`Id`, `Code`) VALUES(5, 'sihhi-tesisat');
INSERT INTO `category`(`Id`, `Code`) VALUES(6, 'ev-tadilati');
INSERT INTO `category`(`Id`, `Code`) VALUES(7, 'boya-badana');
INSERT INTO `category`(`Id`, `Code`) VALUES(8, 'beyaz-esya-tamiri');
INSERT INTO `category`(`Id`, `Code`) VALUES(9, 'elektronik-onarimi');
INSERT INTO `category`(`Id`, `Code`) VALUES(30, 'temizlik');
INSERT INTO `category`(`Id`, `Code`) VALUES(31, 'bag-bahce');
INSERT INTO `category`(`Id`, `Code`) VALUES(32, 'nakliye-ve-tasima');
INSERT INTO `category`(`Id`, `Code`) VALUES(33, 'el-sanatlari');
INSERT INTO `category`(`Id`, `Code`) VALUES(50, 'hurda-satis');
INSERT INTO `category`(`Id`, `Code`) VALUES(60, 'diger');

INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(10, 'Elektrik', 1);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(20, 'Isıtma ve Soğutma', 2);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(30, 'Ahşap', 3);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(40, 'Metal Kaynak', 4);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(50, 'Sıhhi Tesisat', 5);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(60, 'Ev Tadilatı', 6);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(70, 'Boya Badana', 7);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(80, 'Beyaz Eşya Tamiri', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(90, 'Elektronik Onarımı', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(300, 'Temizlik', 30);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(310, 'Bağ Bahçe', 31);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(320, 'Nakliye ve Taşıma', 32);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(330, 'El Sanatları', 33);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(500, 'Hurda Satış', 50);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(600, 'Diğer', 60);









INSERT INTO `category`(`Id`, `Code`) VALUES(1, 'boya-badana');
INSERT INTO `category`(`Id`, `Code`) VALUES(2, 'sihhi-tesisat');
INSERT INTO `category`(`Id`, `Code`) VALUES(3, 'nakliye-ve-tasima');
INSERT INTO `category`(`Id`, `Code`) VALUES(4, 'elektrik');
INSERT INTO `category`(`Id`, `Code`) VALUES(5, 'marangozluk');
INSERT INTO `category`(`Id`, `Code`) VALUES(6, 'temizlik');
INSERT INTO `category`(`Id`, `Code`) VALUES(7, 'insaat-ve-tadilat');
INSERT INTO `category`(`Id`, `Code`) VALUES(8, 'sogutma-ve-isitma');
INSERT INTO `category`(`Id`, `Code`) VALUES(9, 'bahce-bakimi');
INSERT INTO `category`(`Id`, `Code`) VALUES(10, 'beyaz-esya-tamiri');
INSERT INTO `category`(`Id`, `Code`) VALUES(11, 'elektronik-onarimi');
INSERT INTO `category`(`Id`, `Code`) VALUES(12, 'diger');
# UPDATE `Category` SET `Code` = '' WHERE Id = 0;

# Boya Badana
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(10, 'Boya Badana', 1);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(11, 'Diğer', 1);
# Sıhhi Tesisat
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(20, 'Sıhhi Tesisat Kurulumu', 2);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(21, 'Arıza Tespiti ve Onarımı', 2);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(22, 'Diğer', 2);
# Nakliye ve Taşıma
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(30, 'Ev Taşıma', 3);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(31, 'Kargo ve Kurye Hizmetleri', 3);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(32, 'Uluslararası Nakliye', 3);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(33, 'Diğer', 3);
# Elektrik
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(40, 'Elektrik Tesisatı Kurulumu', 4);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(41, 'Arıza Tespiti ve Onarımı', 4);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(42, 'Diğer', 4);
# Marangozluk
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(50, 'Üretim', 5);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(51, 'Kurulum', 5);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(52, 'Tamir', 5);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(53, 'Diğer', 5);
# Temizlik
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(60, 'Ev Temizliği', 6);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(61, 'Halı ve Mobilya Temizliği', 6);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(62, 'Diğer', 6);
# İnşaat ve Tadilat
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(70, 'Yenileme İşleri', 7);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(71, 'Fayans Döşeme', 7);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(72, 'Zemin Kaplama', 7);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(73, 'Diğer', 7);
# Soğutma ve Isıtma
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(80, 'Klima', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(81, 'Kombi', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(82, 'Şömine', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(83, 'Soba', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(84, 'Zemin Isıtma Sistemi', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(85, 'Havalandırma Sistemi', 8);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(86, 'Diğer', 8);
# Bahçe Bakımı
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(90, 'Çim Biçme', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(91, 'Ağaç Budama', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(92, 'Bitki Bakımı', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(93, 'Çiçek Dikimi', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(94, 'Sulama Sistemi', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(95, 'Bahçe Temizliği', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(96, 'Çit Yapımı ve Kurulumu', 9);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(97, 'Diğer', 9);
# Beyaz Eşya Tamiri
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(100, 'Buzdolabı', 10);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(101, 'Çamaşır Makinesi', 10);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(102, 'Bulaşık Makinesi', 10);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(103, 'Fırın ve Ocak', 10);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(104, 'Parça Değişimi', 10);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(105, 'Diğer', 10);
# Elektronik Onarımı
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(110, 'Televizyon', 11);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(111, 'Bilgisayar', 11);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(112, 'Cep Telefonu ve Tablet', 11);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(113, 'Oyun Konsolu', 11);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(114, 'Kamera', 11);
INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(115, 'Diğer', 11);

# INSERT INTO `sub_category`(`Id`, `Name`, `CategoryId`) VALUES(, '', );



