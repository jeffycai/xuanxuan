/**
 * The sysrun file of util current module of xxd.
 *
 * @copyright   Copyright 2009-2017 青岛易软天创网络科技有限公司(QingDao Nature Easy Soft Network Technology Co,LTD, www.cnezsoft.com)
 * @license     ZPL (http://zpl.pub/page/zplv12.html)
 * @author      Archer Peng <pengjiangxiu@cnezsoft.com>
 * @package     util
 * @link        http://www.zentao.net
 */
package util

import (
	"flag"
	"os"
	"runtime"
)

const Version = "V1.2.0"

var Run bool = true
var IsTest bool = false
var Token []byte
var TempToken string

func init() {

	isTest := flag.Bool("test", false, "server test model")
	flag.Parse()
	IsTest = *isTest

	// xxd 启动时根据时间生成token
	timeStr := Int642String(GetUnixTime())
	Token = []byte(GetMD5(timeStr))
	if IsTest {
		Printf("Server test model is %t \n", IsTest)
		Printf("Test token: %s \n", string(Token))
		Printf("xuan xuan chat listen port:%s\n", Config.ChatPort)
	}

	LogInfo().Println()
	Printf("sys start,version:%s, server test model is %v\n", Version, IsTest)
	Printf("ProgramName:%s,System:%s-%s\n", GetProgramName(), runtime.GOOS, runtime.GOARCH)

	LogInfo().Printf("sys start,version:%s, server test model is %v\n", Version, IsTest)
	LogInfo().Printf("ProgramName:%s,System:%s-%s\n", GetProgramName(), runtime.GOOS, runtime.GOARCH)

	// 设置 cpu 使用
	runtime.GOMAXPROCS(runtime.NumCPU())
}

func GetNumGoroutine() int {
	return runtime.NumGoroutine()
}

func Exit(extStr string) {
	Println(extStr)
	os.Exit(1)
}
