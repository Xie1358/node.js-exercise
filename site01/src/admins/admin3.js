const express = require('express');
const router = express.Router();

router.route('/member/edit/:id') // router.route表示還沒決定要用甚麼方法但是只要是這個url就進到這裡來 router.get表示要用get, res.locals跟著res這個物件
    .all((req, res, next)=>{ // all指的是所有方法都進到這來,這個all是middleware格式
       // 找到該會員資料 
        res.locals.memberData = { // res.locals會在不同middleware流傳,這邊應該撈資料庫 不過這邊先寫死
            name: 'bill',
            id: req.params.id // 抓:後的參數, expressjs里的请求参数,有req.params, req.body, req.query
        };
        next(); //因為是middleware 所以做完事情要呼叫 當初做404頁面(也是middleware)因為沒有呼叫 所以跑完就結束 不會進到下面get and post
    })
    .get((req, res)=>{ // get 是先把表單給用戶,用router url已經有了 所以這裡不用再定義一次url
        res.send('GET: ' + JSON.stringify(res.locals)); // send是回傳字串
    })
    .post((req, res)=>{ // post 是用戶改完已送出了 就進到post, 因為沒做表單 所以用post測試
        res.send('POST: ' + JSON.stringify(res.locals));
    })
;
// 此例重點 用route 依據不同方法處理(get or post) 方法重複事情放到all裡 要加next()往下執行
// all,get,post的res物件是同一個 所以可拿到res.locals
// 如用template 一樣把變數(memberData)塞進res.locals,可以在ejs用memberData這個變數
// res.locals 用render的話 會傳給template, 所以把要送到前端的物件塞進res.locals這個物件
module.exports = router;


