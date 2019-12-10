/*
讀取 (get)
    /address-book/:page?/:keyword?

新增 (get, post)
    /address-book/add
修改 (get, post)
    /address-book/edit/:id
刪除 (get, post)
    /address-book/remove/:id

*/
const express = require('express');

console.log('express.shin:', express.shin);

const mysql = require('mysql');
const bluebird = require('bluebird');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mytest'
});
db.connect();
bluebird.promisifyAll(db);

const router = express.Router();


const perPage = 10; // 每頁幾筆
router.get('/:page?/:keyword?', (req, res)=>{
    const output = {};
    output.params = req.params;
    output.perPage = perPage;
    let page = parseInt(req.params.page) || 1;
    let keyword = req.params.keyword || '';
    let where = " WHERE 1 ";
    if(keyword){
        keyword = keyword.split("'").join("\\'"); // 避免 SQL injection
        where += " AND `name` LIKE '%" + keyword +  "%' ";
        output.keyword = keyword;
    }

    let t_sql = "SELECT COUNT(1) `total` FROM `address_book` " + where;
    console.log(t_sql);
    db.queryAsync(t_sql)
        .then(results=>{
            output.totalRows = results[0]['total'];
            output.totalPage = Math.ceil(output.totalRows/perPage);
            if(output.totalPage==0){
                return;
            }
            if(page<1) page = 1;
            if(page>output.totalPage) page = output.totalPage;
            output.page = page;

            //return db.queryAsync("SELECT * FROM `address_book` LIMIT " + (page-1)*perPage + ", "+ perPage)
            return db.queryAsync("SELECT * FROM `address_book` " + where + " LIMIT ?, ? ", [(page-1)*perPage, perPage]);
        })
        .then(results=>{
            output.rows = results;
            res.json(output);
        })
        .catch(error=>{
            console.log(error);
        });
});

module.exports = router;