const router = require('koa-router')();

router.get('/', function* () {
  return yield this.render('lobby');
});

module.exports = router;