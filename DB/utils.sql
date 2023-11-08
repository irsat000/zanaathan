

INSERT INTO JobPosting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId) VALUES ("aasdf", NOW(), "asdf", "5", "5", 1);


USE ZanaatHan;
INSERT INTO JobPostingImages(Body, ImgIndex, JobPostingId) VALUES ("000asdfasdf.jpg", 0, 1);
INSERT INTO JobPostingImages(Body, ImgIndex, JobPostingId) VALUES ("111asdfasdf.jpg", 1, 1);
INSERT INTO JobPostingImages(Body, ImgIndex, JobPostingId) VALUES ("222asdfasdf.jpg", 2, 1);



INSERT INTO ContactInformation(Body, AccountId, ContactTypeId) VALUES ("0 (555) 555 55 55", 11, 1);
INSERT INTO ContactInformation(Body, AccountId, ContactTypeId) VALUES ("irsat@gmail.com", 11, 4);
INSERT INTO ContactInformation(Body, AccountId, ContactTypeId) VALUES ("@irsatirsat", 11, 5);






# MESSAGING
USE ZanaatHan;

INSERT INTO MThread() VALUES();

INSERT INTO MThreadParticipant(LastSeenAt, AccountId, ThreadId) VALUES(NOW(), 9, 1);
INSERT INTO MThreadParticipant(LastSeenAt, AccountId, ThreadId) VALUES(NOW(), 11, 1);

INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('Helloooo!', NOW(), 0, 9, 1);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('Hi, how are you? What are you up to?', NOW(), 0, 11, 1);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('Just working on a project.', NOW(), 0, 9, 1);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('No money?', NOW(), 0, 11, 1);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('No money...', NOW(), 0, 9, 1);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('But I have some time.', NOW(), 0, 9, 1);

# second - This is a TEST, will not create an another thread with the same two users

INSERT INTO MThreadParticipant(LastSeenAt, AccountId, ThreadId) VALUES(NOW(), 9, 2);
INSERT INTO MThreadParticipant(LastSeenAt, AccountId, ThreadId) VALUES(NOW(), 11, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('1111111!', NOW(), 0, 9, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('2222222222222', NOW(), 0, 11, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('33333333', NOW(), 0, 11, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('44444444444444444444', NOW(), 0, 11, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('55555555555', NOW(), 0, 9, 2);
INSERT INTO Message(Body, CreatedAt, IsDeleted, AccountId, ThreadId) VALUES('666666666666666666666', NOW(), 0, 9, 2);



SET SQL_SAFE_UPDATES = 0;
DELETE FROM `Message`;
SET SQL_SAFE_UPDATES = 1;









