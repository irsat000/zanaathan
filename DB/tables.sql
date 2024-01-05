CREATE DATABASE ZanaatHan;
USE ZanaatHan;

/*
CREATE TABLE `City` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `District` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `CityId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_District_City` FOREIGN KEY (`CityId`) REFERENCES `City`(`Id`)
);
*/

/* NOT NECESSARY
CREATE TABLE `Neighborhood` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `DistrictId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Hood_District` FOREIGN KEY (`DistrictId`) REFERENCES `District`(`Id`)
);*/

/* CHANGED MY MIND
CREATE TABLE `MThread` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `MThreadParticipant` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `LastSeenAt` DATETIME NOT NULL,
    `AccountId` INT NOT NULL,
    `ThreadId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MTParticipant_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_MTParticipant_Thread` FOREIGN KEY (`ThreadId`) REFERENCES `MThreadParticipant`(`Id`)
);

CREATE TABLE `Message` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL,
    `AccountId` INT NOT NULL,
    `ThreadId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Message_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_Message_Thread` FOREIGN KEY (`ThreadId`) REFERENCES `MThreadParticipant`(`Id`)
);*/

CREATE TABLE `oauth_provider` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(64) NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `Account` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Username` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    `FullName` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `Email` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `IsEmailValid` BOOLEAN NOT NULL,
    `Password` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `Avatar` VARCHAR(255) NULL,
    `ExternalId` VARCHAR(128) NULL,
    `OAuthProviderId` INT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Account_oauth_provider` FOREIGN KEY (`OAuthProviderId`) REFERENCES `oauth_provider`(`Id`)
);

CREATE TABLE `contact_type` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `contact_information` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `AccountId` INT NOT NULL,
    `ContactTypeId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_contact_information_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_contact_information_contact_type` FOREIGN KEY (`ContactTypeId`) REFERENCES `contact_type`(`Id`)
);

CREATE TABLE `Message` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL,
    `ReceiverId` INT NOT NULL,
    `SenderId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Message_Receiver` FOREIGN KEY (`ReceiverId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_Message_Sender` FOREIGN KEY (`SenderId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `MNotification` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `ReceiverId` INT NOT NULL,
    `SenderId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MNotification_Receiver` FOREIGN KEY (`ReceiverId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_MNotification_Sender` FOREIGN KEY (`SenderId`) REFERENCES `Account`(`Id`)
);



CREATE TABLE `Category` (
	`Id` INT NOT NULL,
    `Code` VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `sub_category` (
	`Id` INT NOT NULL,
    `Name` VARCHAR(255) NOT NULL,
    `CategoryId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_sub_category_Category` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`)
);

CREATE TABLE `current_status` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `job_posting` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(255) NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `Description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `DistrictId` INT NOT NULL,
    `SubCategoryId` INT NOT NULL,
    `CurrentStatusId` INT NOT NULL,
    `AccountId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_job_posting_District` FOREIGN KEY (`DistrictId`) REFERENCES `District`(`Id`),
    CONSTRAINT `FK_job_posting_sub_category` FOREIGN KEY (`SubCategoryId`) REFERENCES `sub_category`(`Id`),
    CONSTRAINT `FK_job_posting_current_status` FOREIGN KEY (`CurrentStatusId`) REFERENCES `current_status`(`Id`),
    CONSTRAINT `FK_job_posting_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `job_posting_images` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` VARCHAR(255) NOT NULL,
    `ImgIndex` INT NOT NULL,
    `JobPostingId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_job_posting_images_job_posting` FOREIGN KEY (`JobPostingId`) REFERENCES `job_posting`(`Id`)
);

USE ZanaatHan;
DROP TABLE `job_posting_images`;
DROP TABLE `job_posting`;



CREATE TABLE `user_block` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `AccountId` INT NOT NULL,
    `TargetId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_user_block_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_user_block_Target` FOREIGN KEY (`TargetId`) REFERENCES `Account`(`Id`)
);




CREATE TABLE `Role` (
	`Id` INT NOT NULL,
    `RoleCode` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `account_role` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `AccountId` INT NOT NULL,
    `RoleId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_account_role_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_account_role_Role` FOREIGN KEY (`RoleId`) REFERENCES `Role`(`Id`)
);


CREATE TABLE `user_bans` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `BannedAt` DATETIME NOT NULL,
    `LiftDate` DATETIME NOT NULL,
    `Reason` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `AccountId` INT NOT NULL,
    `AdminId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_BannedAccount_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_BannedAccount_Admin` FOREIGN KEY (`AdminId`) REFERENCES `Account`(`Id`)
);


CREATE TABLE `Notification` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `AccountId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Notification_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `sign_in_log` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `IpAddress` TEXT NOT NULL,
    `UserAgent` TEXT NOT NULL,
    `Date` DATETIME NOT NULL,
    `AccountId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_sign_in_log_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`)
);