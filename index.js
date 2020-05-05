'use strict';

//標準モジュールの呼び出し
const electron = require('electron');
const { app, Tray, Menu, dialog } = require('electron');
const BrowserWindow = electron.BrowserWindow;
var fs = require('fs');

//Node.js側とHTML側で通信をするモジュール
const ipcMain = require('electron').ipcMain;

// メインウィンドウはグローバル宣言
let mainWindow = null;

//Expressにアクセスする
const express = require('./app');
express.listen(3000, 'localhost');

// Electronの初期化完了後に実行
app.on('ready', () =>
{
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  mainWindow = new BrowserWindow({
    'width': 800,
    'height': 600,
    'autoHideMenuBar': true,
    //nodeIntegrationを有効にしないとrenderProcessでrequireを使えない。v5.0.0ではデフォルトで廃止
    webPreferences: {
      nodeIntegration: true
    },
    'resizable': true,
    'fullscreenable': true,
    'fullscreen': false
  });

  //初期ページの表示
  mainWindow.loadURL('http://localhost:3000')

  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', () =>
  {
    mainWindow = null
  })
})

//全てのウィンドウが閉じたら終了
app.on('window-all-closed', () =>
{
  if (process.platform !== 'darwin')
  {
    app.quit()
  }
})