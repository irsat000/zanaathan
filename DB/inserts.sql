
USE ZanaatHan;

INSERT INTO `ContactType`(`Id`, `Body`) VALUES(1, 'İş Telefonu');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(2, 'Cep Telefonu');
INSERT INTO `ContactType`(`Id`, `Body`) VALUES(3, 'E-Posta');


INSERT INTO `Category`(`Id`, `Code`) VALUES(1, 'boya-badana');
INSERT INTO `Category`(`Id`, `Code`) VALUES(2, 'tesisat');
INSERT INTO `Category`(`Id`, `Code`) VALUES(3, 'nakliye-ve-tasima');
INSERT INTO `Category`(`Id`, `Code`) VALUES(4, 'elektrik');
INSERT INTO `Category`(`Id`, `Code`) VALUES(5, 'marangozluk');
INSERT INTO `Category`(`Id`, `Code`) VALUES(6, 'temizlik');
INSERT INTO `Category`(`Id`, `Code`) VALUES(7, 'insaat-ve-tadilat');
INSERT INTO `Category`(`Id`, `Code`) VALUES(8, 'hava-sogutma-ve-isitma');
INSERT INTO `Category`(`Id`, `Code`) VALUES(9, 'bahce-bakimi');
INSERT INTO `Category`(`Id`, `Code`) VALUES(10, 'beyaz-esya-tamiri');
INSERT INTO `Category`(`Id`, `Code`) VALUES(11, 'elektronik-onarimi');
INSERT INTO `Category`(`Id`, `Code`) VALUES(12, 'diger');



SET SQL_SAFE_UPDATES = 0;
DELETE FROM `Category`;
SET SQL_SAFE_UPDATES = 1;

select * from category;
