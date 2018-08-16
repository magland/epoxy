#!/usr/bin/env node

const express = require('express');
//const cors = require('cors');

let listen_port = process.env.PORT || 8080;

let SESSIONS = {};

let app = express();
app.set('json spaces', 4); // when we respond with json, this is how it will be formatted
//m_app.use(cors());

app.use(express.json());

// API nodeinfo
app.get('/startSession', async function(req, res) {
  var query = req.query;
  let S = new Session();
  let port=get_available_port();
  if (!port) {
    ret.json({
      success:false,
      error:'No ports available.'
    });
    return;
  }
  S.setPort(port);
  try {
    await S.start(query); // TODO
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
    return;
  }
  SESSIONS[S.id()] = S;
  res.json({
    success: true,
    id: S.id(),
    port: S.port()
  });
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

app.use('/web', express.static('web'));

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

function get_available_port() {
  let used_ports={};
  for (let id in SESSIONS) {
    let S=SESSIONS[id];
    used_ports[S.port()]=true;
  }
  for (let pp=8101; pp<9000; pp++) {
    if (!used_ports[pp])
      return pp;
  }
  return 0;
}

function check_expired_sessions() {
  let ids=Object.keys(SESSIONS);
  for (let ii in ids) {
    let id=ids[ii];
    let S=SESSIONS[id];
    if (S.elapsedTimeSinceProbeSec()>20) {
      console.info('Stopping session after timeout...');
      S.stop();
      delete SESSIONS[id];
    }
  }
  setTimeout(function() {
    check_expired_sessions();
  },5000);
}
check_expired_sessions();

function Session() {
  this.id = function() {
    return m_id;
  };
  this.setPort=function(port) {
    m_port=port;
  };
  this.port=function() {
    return m_port;
  }
  this.start = async function(query) {
    console.info('Starting session: '+query.source);
    return await start(query);
  };
  this.getStatus = async function() {
    return await getStatus();
  };
  this.stop = async function() {
    console.info('Stopping session.');
    return await stop();
  };
  this.elapsedTimeSinceProbeSec=function() {
    let elapsed=(new Date())-m_last_probe;
    return elapsed/1000;
  }
  let m_id = make_random_id(10);
  let m_process = null;
  let m_console_out='';
  let m_running=false;
  let m_finished=false;
  let m_exit_code=null;
  let m_info={};
  let m_last_probe=new Date();
  let m_port=null;

  async function start(query) {
    let exe=__dirname+'/epoxy.js';
    let args=[query.source];
    if (m_port)
      args.push('--port='+m_port);
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
    m_last_probe=new Date();
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