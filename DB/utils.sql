

INSERT INTO job_posting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId) VALUES ("aasdf", NOW(), "asdf", "5", "5", 1);


USE ZanaatHan;
INSERT INTO job_posting_images(Body, ImgIndex, JobPostingId) VALUES ("000asdfasdf.jpg", 0, 1);
INSERT INTO job_posting_images(Body, ImgIndex, JobPostingId) VALUES ("111asdfasdf.jpg", 1, 1);
INSERT INTO job_posting_images(Body, ImgIndex, JobPostingId) VALUES ("222asdfasdf.jpg", 2, 1);



INSERT INTO contact_information(Body, AccountId, ContactTypeId) VALUES ("0 (555) 555 55 55", 11, 1);
INSERT INTO contact_information(Body, AccountId, ContactTypeId) VALUES ("irsat@gmail.com", 11, 4);
INSERT INTO contact_information(Body, AccountId, ContactTypeId) VALUES ("@irsatirsat", 11, 5);






# MESSAGING
USE ZanaatHan;

INSERT INTO Message(Body, CreatedAt, IsDeleted, ReceiverId, SenderId) VALUES('Helloooo!', NOW(), 0, 9, 11);
INSERT INTO Message(Body, CreatedAt, IsDeleted, ReceiverId, SenderId) VALUES('Hi, how are you? What are you up to?', NOW(), 0, 11, 9);


SET SQL_SAFE_UPDATES = 0;
DELETE FROM `Message`;
SET SQL_SAFE_UPDATES = 1;


SELECT * FROM job_posting;
DELETE FROM job_posting_images WHERE JobPostingId = 7;
DELETE FROM job_posting WHERE Id = 7;




INSERT INTO job_posting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId, AccountId) VALUES ('Infinite scrolling 10', NOW(), '<p>Infinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrollingInfinite scrolling</p>', 5, 40, 1, 14);



USE ZANAATHAN;

SET SQL_SAFE_UPDATES = 0;
DELETE FROM `job_posting_images`;
DELETE FROM `job_posting_expiration`;
DELETE FROM `job_posting`;
DELETE FROM `account_role`;
DELETE FROM `contact_information`;
DELETE FROM `notification`;
DELETE FROM `message`;
DELETE FROM `mnotification`;
DELETE FROM `sign_in_log`;
DELETE FROM `user_bans`;
DELETE FROM `user_block`;
DELETE FROM `account`;
SET SQL_SAFE_UPDATES = 1;


DELETE FROM `district` WHERE CityId NOT IN (10, 16, 34);
DELETE FROM `city` WHERE Id NOT IN (10, 16, 34);




INSERT INTO account_role(AccountId, RoleId) VALUES(x, 1);