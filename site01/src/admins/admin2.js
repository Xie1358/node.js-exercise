const express = require('express');
const router = express.Router(); // router 相當於const app = express(); 的app

router.get('/admin2/:a1?/:a2?', (req, res)=> {
    res.json(req.params);
});

module.exports = router;


