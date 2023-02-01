var express = require('express');
var router = express.Router();

let mysql = require('mysql');
let conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_webboard'
})

const sessions = require('express-session');
const { application } = require('express');

router.use(sessions({
  secret: "mysecrettest",
  saveUninitialized:true,
  cookie: { maxAge: 100 * 60 * 24 * 30 },
  resave: false
}));

router.use((req, res, next) => {
  res.locals.session = req.session;
  next();
})

conn.connect((err) => {
  if(err) throw err;
  console.log('connect db_webboard success')
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  if (req.body['user'] != undefined) {
    let sql = 'SELECT * FROM tb_member WHERE user = ? AND pass = ?';
    let params = [req.body['user'],req.body['pass']];
    conn.query(sql, params, (err, result) => {
      if (err) throw err;
      if (result[0].id != undefined) {
        req.session.user_id = result[0].id;
        req.session.user_name = result[0].name;

        res.redirect('/board')
      } 
    })
  } else {
    res.send('enter username & password');
  }
});

router.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/')
});

router.get('/register', (req, res) => {
  res.render('register');
});


//still can register with empty var

router.post('/register' ,(req, res) => {
  if (req.body['name'] != undefined) {
    let sql = 'INSERT INTO tb_member SET ?';
    conn.query(sql, req.body, (err, result) => {
      if (err) throw err;
      res.redirect('register_success')
    })
  }else{
    res.send('please enter data');
  }
});

router.get('/register_success', (req, res) => {
  res.render('register_success');
});

router.get('/board', (req, res) => {
  let sql = `
  SELECT tb_topic.*, tb_member.name FROM tb_topic 
  LEFT JOIN tb_member ON tb_member.id = tb_topic.member_id
  ORDER BY tb_topic.id DESC`

  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.render('board', {topics: result})
  res.render('board');
  });
});

router.get('/topic', (req, res) => {
  res.render('topic');
});

router.post('/topic' ,(req, res) => {
  let sql = 'INSERT INTO tb_topic(topic, member_id) VALUES(?, ?)';
  let params = [
    req.body.topic,
    req.session.user_id
  ]

  conn.query(sql, params, (err, result) => {
    if (err) throw err;
    res.redirect('/board');
  })
});

router.get('/comment/:topic_id', (req, res) => {
  let sql = 'SELECT * FROM tb_topic WHERE id = ?';
  let params = [req.params.topic_id];
  conn.query(sql, params, (err, result) => {
    if (err) throw err;
    let topic = result[0];

    sql = `SELECT * FROM tb_comment 
    LEFT JOIN tb_member ON tb_member.id = tb_comment.member_id
    WHERE tb_comment.topic_id = ? ORDER BY tb_comment.id DESC`;
    conn.query(sql, params, (err, result) => {
      if (err) throw err;
      res.render('comment', {topic: topic, comments: result});
    })
  })
})


router.post('/comment/:topic_id', (req, res) => {
  let sql = 'INSERT INTO  tb_comment(member_id, topic_id, detail) VALUES(?, ?, ?)';
  let params = [
    req.session.user_id,
    req.params.topic_id,
    req.body.detail
  ]

  conn.query(sql, params, (err,result)=> {
    if(err) throw err;
    res.redirect('/comment/' + req.params.topic_id);
  })
})

module.exports = router;
  