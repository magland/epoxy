#!/usr/bin/env node

const express = require('express');
//const cors = require('cors');

let listen_port = process.env.PORT || 7888;

let SESSIONS = {};

let app = express();
app.set('json spaces', 4); // when we respond with json, this is how it will be formatted
//m_app.use(cors());

app.use(express.json());

// API nodeinfo
app.get('/startSession', async function(req, res) {
  var query = req.query;
  let S = new Session();
  try {
    await S.start(query); // TODO
    SESSIONS[S.id()] = S;
    res.json({
      success: true,
      id: S.id()
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
    return;
  }
});

app.get('/probeSession', async function(req, res) {
  var query = req.query;
  if (!query.id) {
    res.json({
      success: false,
      error: 'missing id parameter'
    });
    return;
  }
  if (!(query.id in SESSIONS)) {
    res.json({
      success: false,
      error: 'No session found with id: ' + query.id
    });
    return;
  }
  let S=SESSIONS[query.id];
  try {
    let status = await S.getStatus(); // TODO
    res.json({
      success: true,
      status: status
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

app.get('/stopSession', async function(req, res) {
  var query = req.query;
  if (!query.id) {
    res.json({
      success: false,
      error: 'missing id parameter'
    });
    return;
  }
  if (!(query.id in SESSIONS)) {
    res.json({
      success: false,
      error: 'No session found with id: ' + query.id
    });
    return;
  }
  let S=SESSIONS[query.id];
  try {
    await S.stop();
    res.json({
      success: true
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

if (process.env.SSL != null ? process.env.SSL : listen_port % 1000 == 443) {
  // The port number ends with 443, so we are using https
  app.USING_HTTPS = true;
  app.protocol = 'https';
  // Look for the credentials inside the encryption directory
  // You can generate these for free using the tools of letsencrypt.org
  const options = {
    key: fs.readFileSync(__dirname + '/encryption/privkey.pem'),
    cert: fs.readFileSync(__dirname + '/encryption/fullchain.pem'),
    ca: fs.readFileSync(__dirname + '/encryption/chain.pem')
  };

  // Create the https server
  app.server = require('https').createServer(options, app);
} else {
  app.protocol = 'http';
  // Create the http server and start listening
  app.server = require('http').createServer(app);
}

app.server.listen(listen_port, function() {
  console.info(`Server is running ${app.protocol} on port ${listen_port}`);
});

function Session() {
  this.id = function() {
    return m_id;
  }
  this.start = async function(query) {
    return await start(query);
  }
  this.getStatus = async function() {
    return await getStatus();
  }
  this.stop = async function() {
    return await stop();
  }
  let m_id = make_random_id(10);
  let m_process = null;
  let m_console_out='';
  let m_running=false;
  let m_finished=false;
  let m_exit_code=null;
  let m_info={};

  async function start(query) {
    let exe=__dirname+'/epoxy.js';
    let args=[query.source];
    let opts={};
    m_info.query=JSON.parse(JSON.stringify(query));
    m_info.exe_command=exe+' '+args.join(' ');
    try {
      m_process=require('child_process').spawn(exe,args,opts);
    }
    catch(err) {
      throw new Error('Error spawning process: '+m_info.exe_command);
    }
    m_running=true;
    m_process.stdout.on('data', (data) => {
      m_console_out+=data.toString();
    });
    m_process.stderr.on('data', (data) => {
      m_console_out+=data.toString();
    });
    m_process.on('close', (code) => {
      m_running=false;
      m_finished=true;
      m_exit_code=code;
    });
  }
  async function getStatus() {
    let ret={
      info:m_info,
      console_out:m_console_out,
      running:m_running,
      finished:m_finished
    };
    return ret;
  }
  async function stop() {
    if (!m_running) {
      throw new Error('Cannot stop session... not running.');
    }
    m_process.kill('SIGINT');
  }
}

function make_random_id(len) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}