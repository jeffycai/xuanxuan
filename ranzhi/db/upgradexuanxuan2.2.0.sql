ALTER TABLE `sys_user` ADD `clientStatus` enum('online', 'away', 'busy', 'offline') NOT NULL DEFAULT 'offline';
