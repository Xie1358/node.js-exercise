// 1. 引入 express *************************************************************************
const express = require('express'); 

express.shin = 'abc';

const url = require('url');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({dest:'tmp_uploads/'}); // form-data要用multer
const fs = require('fs'); // 處理檔案的核心套件  File System
const session = require('express-session');
const moment = require('moment-timezone');
const mysql = require('mysql');
const bluebird = require('bluebird');
const cors = require('cors');
var db = mysql.createConnection({ // 不是middleware 是全域變數
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'mytest' 
});
db.connect(); 

bluebird.promisifyAll(db);

// 2. 建立 web server 物件 *************************************************************************
const app = express(); 
// app.use(cors());
const whitelist = ['http://localhost:5000', undefined, 'http://localhost:8080', 'http://localhost:3000'];
const corsOptions = {
    credentials: true,
    origin: function(origin, callback){
        console.log('origin: ' + origin);

        if(whitelist.indexOf(origin)>=0){ // >=0就是有找到
            callback(null, true); // 不要有錯誤 允許
        } else {
            callback(new Error('EEEEEEEEError'));
            callback(null, false); // 不要有錯誤 不允許
        }
    }
};
app.use(cors(corsOptions)); //使用use的都是middleware 不同檔案可共用

// const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(bodyParser.urlencoded({extended: false}));// top level :會自動判斷進來是否是POST 是才解析
app.use(bodyParser.json()); //現在node可以處理2種格式
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'akjdfaki',
    cookie: {
        maxAge: 1200000,
    }
}));

app.set('view engine', 'ejs');  // 註冊樣版引擎 
app.use(express.static('public'));

// 3. 路由 *************************************************************************
app.get('/', function(request, response){ // (req, res)是callback function, 發"需求"的物件 和 "回應"給用戶的物件
    response.render('home', {name: 'hello',a:123});
    // response.send('Hello World!'); 
}); 

app.get('/b.html', (req, res)=>{
    res.send(`<h2>
        Hello world!
        </h2>`);
});

app.get('/sales01', (req, res)=>{
    const sales = require('./../data/sales01');
    //res.send(JSON.stringify(sales));
    // res.json(sales);
    res.render('sales01', { // 這裡的sales01是sales01.ejs
        my_var:  sales
    });
});

app.get('/try-qs', (req, res)=>{
    const urlParts = url.parse(req.url, true);
    console.log(urlParts);
// 網址加上 ?a=5&b=10
    res.render('try-qs', {
        query:  urlParts.query
    });
});
// app.get('/aaa', function(request, response){ 
//     response.send('Hello aaa'); 
// }); 

//用get拜訪不會送資料過來 所以不需要解析 因為get不會帶http的body 只有headers
app.get('/try-post-form', (req, res)=>{ 
    res.render('try-post-form');
});
//表單送出http的方法是POST 所以表單資料過來才要urlencodedParser解析 解析完送到req.body
app.post('/try-post-form', (req, res)=>{
    res.render('try-post-form', req.body);
    // res.send(JSON.stringify(req.body));
});

app.get('/try-post-form2', (req, res)=>{ 
    res.send('get: try-post-form2'); //send是直接送文字 所以不需要template
});
app.post('/try-post-form2', (req, res)=>{
    res.json(req.body);
});
app.put('/try-post-form2', (req, res)=>{
    res.send("PUT: try-post-form2");
});

// https://www.npmjs.com/package/multer    單圖上傳
app.post('/try-upload', upload.single('avatar'),(req, res)=>{ //只有一個上傳檔用single 多個用array, 欄位名avatar
    if(req.file && req.file.originalname){ // originalname: '25.png',
        console.log(req.file); //單個file沒+s, req.file存upload.single('avatar')處理完的資訊
// console.log(req.file)顯示fieldname,originalname,destination:...
        switch(req.file.mimetype){
            case 'image/png':
            case 'image/jpeg':
                fs.createReadStream(req.file.path) //path: 'tmp_uploads\\1e9c50eda6edc50fa9585233b8df1520'
                    .pipe( //來源接到目的地
                        fs.createWriteStream('public/img/' + req.file.originalname)
                    );

                res.send('ok');
                break;
            default:
                return res.send('bad file type');
        }
    } else {
        res.send('no uploads');
    }
});

// app.post('/try-upload', upload.array('file',3),(req, res)=>{ //  多圖上傳
//     res.send(req.files)
//     for(let file of req.files){
//         // if(req.file && req.file.originalname){ 
//             console.log(file.originalname); 
    
//             switch(file.mimetype){
//                 case 'image/png':
//                 case 'image/jpeg':
//                     fs.createReadStream(file.path) 
//                         .pipe( //來源接到目的地
//                             fs.createWriteStream('public/img/' + file.originalname)
//                         );
    
//                    // res.send('ok');
//                     break;
//                 default:
//                     //return res.send('bad file type');
//             }
//         //} 
//         // else {
//         //     res.send('no uploads');
//         // }
//     }
// });

// 文件看http://expressjs.com/en/4x/api.html
// 路徑強度(此用法)比參數強度強 seo問題 所以node少用get
app.get('/my-params1/:action/:id', (req, res)=>{ // 較常用這種 : 冒號之後為代稱名  http://localhost:3000/my-params1/e/25
    res.json(req.params); 
});
app.get('/my-params2/:action?/:id?', (req, res)=>{ // ?代表為選擇性的
    res.json(req.params); 
});
app.get('/my-params3/*/*?', (req, res)=>{ // * 為 wildcard ,索引功能 此法不要用
    res.json(req.params); 
});
app.get(/^\/09\d{2}\-?\d{3}\-?\d{3}$/, (req, res)=>{ // ^\/跳脫
    let str = req.url.slice(1);  // 不要拿到路徑第一個/ 從0開始 req.url會抓到?後參數 改?參數會發request #則不會(#是舊技術)
    str = str.split('?')[0];   // 切? 取前面那段 就不會顯示?後參數
    str = str.split('-').join(''); //去掉-
    res.send('手機: ' + str); });

// 4.5.3 路由模組化*****************************************************************
        const admin1 = require(__dirname + '/admins/admin1'); // 法一 把原本要寫的放另一檔案 這種不要用
        admin1(app);

        app.use( require(__dirname + '/admins/admin2') ); // 法二 沒指定路徑 接到router 變成 middleware 
        app.use('/admin3', require(__dirname + '/admins/admin3') ); // 法三 可指定路徑
      
        app.use('/address-book', require(__dirname + '/address_book') ); 

        app.get('/try-session', (req, res)=>{
            req.session.my_views = req.session.my_views || 0;
            req.session.my_views++;
        
            res.json({
                aa: 'hello',
                'my views': req.session.my_views
            });
        });

        app.get('/try-moment', (req, res)=>{  // timezone city全球時區
            const fm = 'YYYY-MM-DD HH:mm:ss';
            const mo1 = moment(req.session.cookie.expires); // cookie過期時間
            const mo2 = moment(new Date());
            res.contentType('text/plain');
            // res.write(req.session.cookie.expires + "\n"); // 這個是Date類型
            res.write(req.session.cookie.expires.toString() + "\n");
            res.write(req.session.cookie.expires.constructor.name + "\n");
            res.write(new Date() + "\n");
            res.write(mo1.format(fm) + "\n");
            res.write(mo2.format(fm) + "\n");
            res.write('倫敦:'+mo1.tz('Europe/London').format(fm) + "\n");
            res.write(mo2.tz('Asia/Tokyo').format(fm) + "\n");
            res.end('');
        });

        // app.get('/try-db', (req, res)=> {
        //     const sql = "SELECT * FROM `address_book` LIMIT 0, 5";
        //     db.query(sql, (error, results, fields)=>{ // callback function
        //         console.log(error); // 一般就算不處理 也秀出來 沒問題再註解掉
        //         console.log(results);
        //         console.log(fields); // 拿到欄位名稱
        //         //res.json(results); // 已經轉成json字串傳給前端
        //         for(let r of results){ // 換格式
        //             r.birthday2 = moment(r.birthday).format('YYYY-MM-DD');
        //         }
                
        //         res.render('try-db',{
        //             rows: results // 傳給前端
        //         })
        //     });
        //     //res.send('ok'); // 如果有這行只會顯示ok 其他就不會跑 因為連資料庫要時間 先跑這行
        //     //send render json end 這4個在callback function只會跑到一個 就不會執行其他個
        // });

        // bluebird功能是可做多個promise, axios是熱門專案 功能跟fetch一樣 但server端沒fetch
        // 如果server要呈現氣象資料(抓政府api(可存到資料庫)))) node不是瀏覽器 所以沒fetch api,所以可透過axios.get 去別的server要東西
        app.get('/try-db', (req, res)=> {
            const sql = "SELECT * FROM `address_book` WHERE `name` LIKE ? ";
            db.query(sql, [ "%張小明%" ], (error, results, fields)=>{ //results結果就是fetchAll
                console.log(error);
                console.log(results);
                console.log(fields);
                //res.json(results);
        
                for(let r of results){
                    r.birthday2 = moment(r.birthday).format('YYYY-MM-DD');
                }
        
        
                res.render('try-db',{
                    rows: results
                });
            });
            //res.send('ok');
        });
// transaction解決效能問題
        app.get('/try-db2/:page?', (req, res)=> {
            let page = req.params.page || 1; // req.params拿url // 可在網址切換頁數
            let perPage = 5;
            const output = {};
         // 看所有筆數和前5筆
            db.queryAsync("SELECT COUNT(1) total FROM `address_book`")
                .then(results=>{
                    // res.json(results);
                    output.總筆數 = results[0].total; 
                    return db.queryAsync(`SELECT * FROM address_book LIMIT ${(page-1)*perPage}, ${perPage}`);// 從第幾筆到第幾筆
                })
                .then(results=>{
                    output.rows = results;
                    res.json(output);
                })
                .catch(error=>{
                    console.log(error);
                    res.send(error); //打錯會秀到頁面上
                });
        });

        app.get('/try-session2', (req, res)=> {
            req.session.views = req.session.views || 0;
            req.session.views++;
        
            res.json({views: req.session.views});
        });

// 此段放在所有路由設定的後面 
app.use((req, res)=>{ 
    res.type('text/plain'); 
    res.status(404); 
    res.send('404 - 找不到網頁'); 
});

// 4. Server 偵聽 *************************************************************************
app.listen(3000, function(){ 
    console.log('啟動 server 偵聽埠號 3000'); 
});