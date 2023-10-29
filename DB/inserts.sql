
USE ZanaatHan;

INSERT INTO `ContactType`(`Id`, `Body`) VALUES(1, 'Cep Telefonu');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(2, 'İş Telefonu');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(3, 'Ev Telefonu');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(4, 'E-Posta');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(5, 'İnstagram');


INSERT INTO `Category`(`Id`, `Code`) VALUES(1, 'boya-badana');
INSERT INTO `Category`(`Id`, `Code`) VALUES(2, 'sihhi-tesisat');
INSERT INTO `Category`(`Id`, `Code`) VALUES(3, 'nakliye-ve-tasima');
INSERT INTO `Category`(`Id`, `Code`) VALUES(4, 'elektrik');
INSERT INTO `Category`(`Id`, `Code`) VALUES(5, 'marangozluk');
INSERT INTO `Category`(`Id`, `Code`) VALUES(6, 'temizlik');
INSERT INTO `Category`(`Id`, `Code`) VALUES(7, 'insaat-ve-tadilat');
INSERT INTO `Category`(`Id`, `Code`) VALUES(8, 'sogutma-ve-isitma');
INSERT INTO `Category`(`Id`, `Code`) VALUES(9, 'bahce-bakimi');
INSERT INTO `Category`(`Id`, `Code`) VALUES(10, 'beyaz-esya-tamiri');
INSERT INTO `Category`(`Id`, `Code`) VALUES(11, 'elektronik-onarimi');
INSERT INTO `Category`(`Id`, `Code`) VALUES(12, 'diger');
# UPDATE `Category` SET `Code` = '' WHERE Id = 0;

# Boya Badana
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(10, 'Boya Badana', 1);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(11, 'Diğer', 1);
# Sıhhi Tesisat
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(20, 'Sıhhi Tesisat Kurulumu', 2);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(21, 'Arıza Tespiti ve Onarımı', 2);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(22, 'Diğer', 2);
# Nakliye ve Taşıma
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(30, 'Ev Taşıma', 3);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(31, 'Kargo ve Kurye Hizmetleri', 3);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(32, 'Uluslararası Nakliye', 3);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(33, 'Diğer', 3);
# Elektrik
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(40, 'Elektrik Tesisatı Kurulumu', 4);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(41, 'Arıza Tespiti ve Onarımı', 4);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(42, 'Diğer', 4);
# Marangozluk
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(50, 'Üretim', 5);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(51, 'Kurulum', 5);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(52, 'Tamir', 5);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(53, 'Diğer', 5);
# Temizlik
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(60, 'Ev Temizliği', 6);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(61, 'Halı ve Mobilya Temizliği', 6);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(62, 'Diğer', 6);
# İnşaat ve Tadilat
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(70, 'Yenileme İşleri', 7);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(71, 'Fayans Döşeme', 7);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(72, 'Zemin Kaplama', 7);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(73, 'Diğer', 7);
# Soğutma ve Isıtma
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(80, 'Klima', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(81, 'Kombi', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(82, 'Şömine', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(83, 'Soba', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(84, 'Zemin Isıtma Sistemi', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(85, 'Havalandırma Sistemi', 8);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(86, 'Diğer', 8);
# Bahçe Bakımı
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(90, 'Çim Biçme', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(91, 'Ağaç Budama', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(92, 'Bitki Bakımı', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(93, 'Çiçek Dikimi', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(94, 'Sulama Sistemi', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(95, 'Bahçe Temizliği', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(96, 'Çit Yapımı ve Kurulumu', 9);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(97, 'Diğer', 9);
# Beyaz Eşya Tamiri
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(100, 'Buzdolabı', 10);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(101, 'Çamaşır Makinesi', 10);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(102, 'Bulaşık Makinesi', 10);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(103, 'Fırın ve Ocak', 10);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(104, 'Parça Değişimi', 10);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(105, 'Diğer', 10);
# Elektronik Onarımı
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(110, 'Televizyon', 11);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(111, 'Bilgisayar', 11);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(112, 'Cep Telefonu ve Tablet', 11);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(113, 'Oyun Konsolu', 11);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(114, 'Kamera', 11);
INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(115, 'Diğer', 11);

# INSERT INTO `SubCategory`(`Id`, `Name`, `CategoryId`) VALUES(, '', );



INSERT INTO `CurrentStatus`(`Id`, `Body`) VALUES(1, 'Cevap bekliyor');
INSERT INTO `CurrentStatus`(`Id`, `Body`) VALUES(2, 'Anlaşıldı');
INSERT INTO `CurrentStatus`(`Id`, `Body`) VALUES(3, 'Tamamlandı');
INSERT INTO `CurrentStatus`(`Id`, `Body`) VALUES(4, 'Kaldırıldı');



SET SQL_SAFE_UPDATES = 0;
DELETE FROM `ContactType`;
SET SQL_SAFE_UPDATES = 1;

select * from category;
select * from SubCategory;
select * from CurrentStatus;
