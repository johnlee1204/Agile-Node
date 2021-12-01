
CREATE DATABASE agile;

USE `agile`;


CREATE TABLE `chat` (
  `chatId` int NOT NULL AUTO_INCREMENT,
  `DATE` datetime DEFAULT NULL,
  `message` text,
  PRIMARY KEY (`chatId`)
);

CREATE TABLE `gameranking` (
  `gameRankingId` int NOT NULL AUTO_INCREMENT,
  `date` datetime DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `game` varchar(50) DEFAULT NULL,
  `plot` int DEFAULT NULL,
  `gameplay` int DEFAULT NULL,
  `graphics` int DEFAULT NULL,
  `atmosphere` int DEFAULT NULL,
  PRIMARY KEY (`gameRankingId`)
);

CREATE TABLE `logaccess` (
  `accessId` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `userName` varchar(50) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `url` text,
  `query` text,
  `body` text,
  PRIMARY KEY (`accessId`)
);

CREATE TABLE `session` (
  `sessionId` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `createDate` datetime DEFAULT NULL,
  `token` varchar(64) NOT NULL,
  PRIMARY KEY (`sessionId`)
);

CREATE TABLE `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(30) NOT NULL,
  `passwordHash` varchar(64) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `lastActivity` datetime DEFAULT NULL,
  PRIMARY KEY (`userId`)
);
