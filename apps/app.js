const app = require('koa')();
const render = require('koa-ejs');
const path = require('path');
const fs = require('fs');
const routes = require(path.join(__dirname, './routes'));
const resources = require('koa-static')(path.join(__dirname, './public'), { maxage: 86400000 });
const appPort = 8080;
const jsonMessages = path.join(__dirname, './models/messages.json');

const storeMessage = (displayName, message) => {
  fs.readFile(jsonMessages, 'utf8', (error, contentJson) => {
    let contents = JSON.parse(contentJson);
    contents.push({
      displayName,
      message
    });
    fs.writeFile(jsonMessages, JSON.stringify(contents));
  });
};

const getMessages = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(jsonMessages, 'utf8', (error, contents) => {
      if (error) reject(error);
      resolve(JSON.parse(contents));
    });
  });
};

const start = () => {
  try {
    render(app, {
      root: path.join(__dirname, './views'),
      viewExt: 'ejs',
      cache: false
    });

    app.use(routes.routes());
    app.use(resources);

    const server = require('http').createServer(app.callback());
    const io = require('socket.io')(server);

    io.on('connection', (socket) => {
      socket.on('chat message', (message) => {
        storeMessage(socket.displayName, message);
        io.emit('chat message', `${socket.displayName}: ${message}`);
      });

      socket.on('add user', (displayName) => {
        socket.displayName = displayName;
        getMessages().then(contents => {
          io.emit('chat message', contents);
        });
      });
    });

    console.log(`application is listening on port ${appPort}`);
    server.listen(appPort);
  } catch (e) {
    console.error('e ->', e.message);
  }
};

module.exports = start;