CREATE DATABASE ZanaatHan;
USE ZanaatHan;


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

CREATE TABLE `Neighborhood` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `DistrictId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Hood_District` FOREIGN KEY (`DistrictId`) REFERENCES `District`(`Id`)
);


CREATE TABLE `Account` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Username` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    `FullName` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `Email` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `IsEmailValid` BOOLEAN NOT NULL,
    `Password` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `Avatar` VARCHAR(255) NULL,
    PRIMARY KEY (`Id`)
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


CREATE TABLE `Chat` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `AccountId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Inbox_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `Chat_Account`(
	`Id` INT NOT NULL AUTO_INCREMENT,
    `LastSeen` DATETIME NOT NULL,
    `AccountId` INT NOT NULL,
    `ChatId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Chat_Account_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_Chat_Account_Chat` FOREIGN KEY (`ChatId`) REFERENCES `Account`(`Id`)
);

CREATE TABLE `Message` (
	`Id` INT NOT NULL AUTO_INCREMENT,
    `Body` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL,
    `AccountId` INT NOT NULL,
    `ChatId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Message_Account` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`),
    CONSTRAINT `FK_Message_Chat` FOREIGN KEY (`ChatId`) REFERENCES `Chat`(`Id`)
);



CREATE TABLE `Category` (
	`Id` INT NOT NULL,
    `Name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `JobPosting` (
	`Id` INT NOT NULL,
    `Title` VARCHAR(255) NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `Description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `NeighborhoodId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_JobPosting_Hood` FOREIGN KEY (`NeighborhoodId`) REFERENCES `Neighborhood`(`Id`)
);

CREATE TABLE `JobPostingImages` (
	`Id` INT NOT NULL,
    `Body` VARCHAR(255) NOT NULL,
    `ImgIndex` INT NOT NULL,
    `JobPostingId` INT NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_JobPostingImages_JobPosting` FOREIGN KEY (`JobPostingId`) REFERENCES `JobPosting`(`Id`)
);


