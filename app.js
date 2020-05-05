//モジュールの読み込み
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const join = require('path').join;
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require("fs");

//passportの設定
var passport = require('passport');
var strategy = require('passport-azure-ad').OIDCStrategy;
passport.serializeUser(function (user, done)
{
  done(null, user);
});
passport.deserializeUser(function (user, done)
{
  done(null, user);
});

//認証用データ
var auth = "https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0/.well-known/openid-configuration";
var redirecturi = "http://localhost:3000/auth/callback";
var scope = [
  'profile',
  'offline_access',
  'user.read',
  'Files.ReadWrite'
]
var clientID = "26f733c3-0c7c-44e8-aa39-29d2cb805afc";
var clientsecret = "od4OU:Ee_KODvU[DPZRu6nE4GkjA.y56";

//Azure AD認証用のオプション
var options = {
  identityMetadata: auth,
  clientID: clientID,
  responseType: "code",
  responseMode: "form_post",
  redirectUrl: redirecturi,
  allowHttpForRedirectUrl: true,
  clientSecret: clientsecret,
  validateIssuer: false,
  scope: scope,
  passReqToCallback: false
};

//認証フロー
passport.use(new strategy(options,
  (iss, sub, profile, access_token, refresh_token, done) =>
  {
    try
    {
      if (profile.oid)
      {
        //データを組み立て
        const user = {
          iss,
          sub,
          profile,
          access_token,
          refresh_token
        };

        //Access Tokenをテキストに書き出す
        fs.writeFileSync("user.txt", user.access_token);

        //ユーザデータを返す
        return done(null, user);
      }

      //取得データを返す
      return done(null, false);

    } catch (err)
    {
      //エラートラップ
      return done(null, err);
    }
  }
));

//expressの設定
var app = express();

//セッション
app.use(session({
  secret: 'graphman super',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false
  }
}));

//ビューテンプレート
app.set('views', join(__dirname, '/views'));　//index.htmlを読み込ませる
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//passportの初期化
app.use(passport.initialize());
app.use(passport.session());

//その他の設定
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

//ルーティング
//★初期ページ
app.get('/', (req, res) =>
{
  //ejsの力でindex.html側へデータを反映する
  res.render('index.html', { user: req.user });
});

//サインインクリック時
app.get('/auth/signin',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' })
  , (req, res) =>
  {
    res.redirect('/');
  }
);

//サインイン後のコールバックを受け取った時
app.post('/auth/callback',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' })
  , (req, res) =>
  {
    res.redirect('/');
  }
);

//サインアウトをクリックした時
app.get('/auth/signout',
  (req, res) =>
  {
    req.session.destroy((err) =>
    {
      if (err)
      {
        res.send(err)
        return
      }
      res.redirect('/')
    })
  }
);

//404検知
app.use(function (req, res, next)
{
  next(createError(404));
});

//エラーハンドラー（リリース直前までコメントアウト推奨）
//app.use(function(err, req, res, next) {
//  res.locals.message = err.message;
//  res.locals.error = req.app.get('env') === 'development' ? err : {};

//エラーページを表示
//res.status(err.status || 500);
//res.render('error');
//});

//サーバ開始
module.exports = app;