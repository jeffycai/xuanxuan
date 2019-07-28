<?php
public function createTable($version)
{
    $result = parent::createTable($version);
    if($result) $this->setXuanxuan();
    return $result;
}

/**
 * Set version and key for xuanxuan.
 *
 * @access public
 * @return bool
 */
public function setXuanxuan()
{
    $sql  = "REPLACE INTO `{$this->config->db->name}`.`{$this->config->db->prefix}sys_config` (`owner`, `app`, `module`, `section`, `key`, `value`) VALUES ('system', 'sys', 'xuanxuan', 'global', 'version', '{$this->config->xuanxuan->version}');";
    $sql .= "REPLACE INTO `{$this->config->db->name}`.`{$this->config->db->prefix}sys_config` (`owner`, `app`, `module`, `section`, `key`, `value`) VALUES ('system', 'sys', 'xuanxuan', '', 'key', '" . md5(md5(time()) . rand()). "');";
    try
    {
        $this->dbh->query($sql);
    }
    catch(PDOException $e)
    {
        return false;
    }

    return true;
}
