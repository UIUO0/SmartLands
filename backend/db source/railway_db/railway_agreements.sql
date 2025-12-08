-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: yamabiko.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `agreements`
--

DROP TABLE IF EXISTS `agreements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agreements` (
  `agreement_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `land_id` bigint unsigned NOT NULL,
  `buyer_user_id` bigint unsigned NOT NULL,
  `seller_user_id` bigint unsigned NOT NULL,
  `source` enum('request','auction','manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_id` bigint unsigned DEFAULT NULL,
  `auction_id` bigint unsigned DEFAULT NULL,
  `agreed_amount` decimal(12,2) NOT NULL,
  `currency_code` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SAR',
  `status` enum('draft','confirmed','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`agreement_id`),
  KEY `fk_ag_land` (`land_id`),
  KEY `fk_ag_buyer` (`buyer_user_id`),
  KEY `fk_ag_seller` (`seller_user_id`),
  KEY `fk_ag_req` (`request_id`),
  KEY `fk_ag_auc` (`auction_id`),
  KEY `idx_ag_status_ctime` (`status`,`created_at`),
  CONSTRAINT `fk_ag_auc` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`auction_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ag_buyer` FOREIGN KEY (`buyer_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ag_land` FOREIGN KEY (`land_id`) REFERENCES `lands` (`land_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ag_req` FOREIGN KEY (`request_id`) REFERENCES `requests` (`request_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ag_seller` FOREIGN KEY (`seller_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agreements`
--

LOCK TABLES `agreements` WRITE;
/*!40000 ALTER TABLE `agreements` DISABLE KEYS */;
/*!40000 ALTER TABLE `agreements` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 16:13:59
