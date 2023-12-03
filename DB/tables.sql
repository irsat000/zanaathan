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

CREATE TABLE `OAuthProvider` (
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
    CONSTRAINT `FK_Account_OAuthProvider` FOREIGN KEY (`OAuthProviderId`) REFERENCES `OAuthProvider`(`Id`)
);

CREATE TABLE `ContactType` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `ContactInformation` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `AccountId` INT NOT NULL,
    `ContactTypeId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ContactInformation_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_ContactInformation_ContactType` FOREIGN KEY (`ContactTypeId`) REFERENCES `ContactType`(`Id`)
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

CREATE TABLE `SubCategory` (
	`Id` INT NOT NULL,
    `Name` VARCHAR(255) NOT NULL,
    `CategoryId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SubCategory_Category` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`)
);

CREATE TABLE `CurrentStatus` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `JobPosting` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(255) NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `Description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `DistrictId` INT NOT NULL,
    `SubCategoryId` INT NOT NULL,
    `CurrentStatusId` INT NOT NULL,
    `AccountId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_JobPosting_District` FOREIGN KEY (`DistrictId`) REFERENCES `District`(`Id`),
    CONSTRAINT `FK_JobPosting_SubCategory` FOREIGN KEY (`SubCategoryId`) REFERENCES `SubCategory`(`Id`),
    CONSTRAINT `FK_JobPosting_CurrentStatus` FOREIGN KEY (`CurrentStatusId`) REFERENCES `CurrentStatus`(`Id`),
    CONSTRAINT `FK_JobPosting_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `JobPostingImages` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` VARCHAR(255) NOT NULL,
    `ImgIndex` INT NOT NULL,
    `JobPostingId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_JobPostingImages_JobPosting` FOREIGN KEY (`JobPostingId`) REFERENCES `JobPosting`(`Id`)
);

USE ZanaatHan;
DROP TABLE `JobPostingImages`;
DROP TABLE `JobPosting`;



CREATE TABLE `UserBlock` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `AccountId` INT NOT NULL,
    `TargetId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_UserBlock_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_UserBlock_Target` FOREIGN KEY (`TargetId`) REFERENCES `Account`(`Id`)
);




CREATE TABLE `Role` (
	`Id` INT NOT NULL,
    `RoleCode` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `Admin` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Username` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `Password` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `RoleId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Admin_Role` FOREIGN KEY (`RoleId`) REFERENCES `Role`(`Id`)
);

CREATE TABLE `UserBans` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `BannedAt` DATETIME NOT NULL,
    `LiftDate` DATETIME NOT NULL,
    `Reason` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `AccountId` INT NOT NULL,
    `AdminId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_BannedAccount_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_BannedAccount_Admin` FOREIGN KEY (`AdminId`) REFERENCES `Admin`(`Id`)
);
