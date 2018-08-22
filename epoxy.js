#!/usr/bin/env node

const fs = require('fs');
const findPort = require('find-port');
const opn = require('opn');

function print_usage() {
  console.info('Usage on local machine:');
  console.info('epoxy-jupyterlab [source_directory_or_url] --port=[8888]');
  console.info('epoxy-bash [source_directory_or_url]');
  console.info('epoxy-run [source_directory_or_url] [command]');
  console.info('');
  console.info('To start the server:');
  console.info('PORT=8080 nmp start');
}

var CLP = new CLParams(process.argv);

let arg1 = CLP.unnamedParameters[0] || '';
let arg2 = CLP.unnamedParameters[1] || '';

let source_directory_or_url=arg1;
if (!source_directory_or_url) {
  print_usage();
  process.exit(-1);
}
if ('help' in CLP.namedParameters) {
  print_usage();
  return;
}

let session_id=make_random_id(10);
let env={};

// When SIGINT or SIGTERM is received, we clean up prior to truly exiting with error code -1
process.on('SIGTERM', cleanup_and_exit);
process.on('SIGINT', cleanup_and_exit);
function cleanup_and_exit() {
  console.info('cleanup_and_exit()');
  clean_up_session()
    .then(function() {
      process.exit(-1);
    })
    .catch(function(err) {
      process.exit(-1);
    });
}

async function main() {
  let build_directory=create_new_build_directory(session_id);
  let template_directory=__dirname+'/template';
  env.SESSION_ID=session_id;
  env.BUILD_DIR=build_directory;
  env.TEMPLATE_DIR=template_directory;
  env.SOURCE_DIR_OR_URL=source_directory_or_url;
  if ('install_jupyterlab' in CLP.namedParameters) {
    env.EPOXY_INSTALL_JUPYTERLAB='true';
  }
  try {
    console.info('[ Preparing source ... ]');
    await execute_script(__dirname+'/scripts/prepare_source.sh',{env:env});
    let capsule_mode=is_a_capsule(build_directory+'/source');
    if (capsule_mode)
      env.EPOXY_CAPSULE_MODE='true';
    console.info('[ Copying files to build directory ... ]');
    await execute_script(__dirname+'/scripts/copy_files_to_build_directory.sh',{env:env});
    console.info('[ Building image ... ]');
    await execute_script(__dirname+'/scripts/build_image.sh',{env:env});
    let run_mode=CLP.namedParameters['run_mode']||'bash';
    if (run_mode=='jupyterlab') {
      let port=CLP.namedParameters.port;
      if (!port) {
        port=await find_free_port(8101,8999);
      }
      env.PORT=port;
      if (!('no-browser' in CLP.namedParameters)) {
        opn('http://localhost:'+port);
      }
      env.EPOXY_JUPYTER_TOKEN=CLP.namedParameters.jupyter_token||'';
    }
    else {
      env.PORT=""
    }
    env.EPOXY_RUN_MODE=run_mode;
    if (run_mode=='command') {
      env.EPOXY_RUN_COMMAND=arg2||'cd code && sh run.sh';
    }
    if ('mount' in CLP.namedParameters) {
      env.EPOXY_MOUNT_WORKSPACE=source_directory_or_url;
    }
    else {
      env.EPOXY_MOUNT_WORKSPACE='';
    }
    if ('results' in CLP.namedParameters) {
      if (!capsule_mode) {
        throw new Error('results option is only supported for capsules')
      }
      env.EPOXY_CAPSULE_RESULTS_DIRECTORY=CLP.namedParameters['results'];
    }
    console.info('[ Running container ... ]');
    await execute_script(__dirname+'/scripts/run_container.sh',{env:env,stdio:'inherit'});
  }
  catch(err) {
    console.error(err);
  }
  await clean_up_session();
}
main();

async function clean_up_session() {
  console.info('Cleaning up session');
  try {
    await execute_script(__dirname+'/scripts/cleanup.sh',{env:env});
  }
  catch(err) {
    console.error(err);
  }
  if (!('keep_build_dir' in CLP.namedParameters))
    remove_build_directory(env.BUILD_DIR);
}

function get_epoxy_base_dir() {
  let ret = process.env.EPOXY_BASE_DIR || process.env.HOME + '/.epoxy';
  if (!fs.existsSync(ret)) {
    fs.mkdirSync(ret);
  }
  return ret;
}

function create_new_build_directory(session_id) {
  let path = get_epoxy_base_dir() + '/builds';
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  let ret = path + '/' + session_id;
  if (!fs.existsSync(ret)) {
    fs.mkdirSync(ret);
  }
  return ret;
}

function is_a_capsule(source_dir) {
  if (!fs.existsSync(source_dir+'/environment/Dockerfile')) return false;
  //other criteria?
  return true;
}

function is_safe_to_remove_build_directory(dir) {
  return dir.startsWith(get_epoxy_base_dir() + /builds/);
}

async function execute_script(script, opts) {
  opts.env=opts.env||{};
  let env=process.env;
  for (let key in opts.env) {
    env[key]=opts.env[key];
  }
  let exe = script.split(' ')[0];
  let args = script.split(' ').slice(1);
  let spawn_opts={
    env:env
  };
  if (opts.working_directory)
    spawn_opts.cwd=opts.working_directory;
  if (opts.stdio)
    spawn_opts.stdio=opts.stdio;

  return new Promise(function(resolve, reject) {
    const spawn = require('child_process').spawn;
    let P;
    try {
      console.info(`Running: ${exe} ${args.join(' ')}`);
      P = spawn(exe, args, spawn_opts);
    } catch (err) {
      reject(new Error('Error running ' + script + ': ' + err.message));
      return;
    }
    if (opts.stdio!='inherit') {
      P.stdout.on('data', (data) => {
        console.info(data.toString());
      });
      P.stderr.on('data', (data) => {
        console.info(data.toString());
      });
    }
    P.on('close', (code) => {
      if (code != 0) {
        reject(new Error(`Script exited with non-zero exit code: ${script}`));
        return;
      }
      resolve();
    });
  });
}

async function remove_build_directory(dir) {
  if (!is_safe_to_remove_build_directory(dir)) {
    throw new Error(`Unexpected problem: Unable to remove (unsafe) directory: ${dir}`);
  }
  let files = fs.readdirSync(dir);
  for (let i in files) {
    let fname = dir + '/' + files[i];
    let stat0;
    try {
      stat0 = fs.lstatSync(fname);
    }
    catch(err) {
      console.warn('Unable to stat file: '+fname);
      stat0=null;
    }
    if (stat0) {
      if ((stat0.isFile())||(stat0.isSymbolicLink())) {
        try {
          fs.unlinkSync(fname);
        }
        catch(err) {
          console.warn('Unable to remove file: '+fname);
        }
      } else if (stat0.isDirectory()) {
        await remove_build_directory(fname);
      }
    }
  }
  fs.rmdirSync(dir);
}

function readJsonSync(fname) {
  return JSON.parse(fs.readFileSync(fname, 'utf8'));
}

function writeJsonSync(fname, obj) {
  fs.writeFileSync(fname, JSON.stringify(obj, null, 4), 'utf8');
}

async function find_free_port(range_min,range_max) {
  return new Promise(function(resolve,reject) {
    findPort('127.0.0.1', range_min, range_max, function(ports) {
      if (ports.length == 0) {
        reject(new Error(`No free ports found in range ${range[0]}-${range[1]}`));
        return;
      }
      resolve(ports[0]); 
    });
  });
}

function CLParams(argv) {
  this.unnamedParameters = [];
  this.namedParameters = {};

  var args = argv.slice(2);
  for (var i = 0; i < args.length; i++) {
    var arg0 = args[i];
    if (arg0.indexOf('--') === 0) {
      arg0 = arg0.slice(2);
      var ind = arg0.indexOf('=');
      if (ind >= 0) {
        this.namedParameters[arg0.slice(0, ind)] = arg0.slice(ind + 1);
      } else {
        this.namedParameters[arg0] = '';
        if (i + 1 < args.length) {
          var str = args[i + 1];
          if (str.indexOf('-') != 0) {
            this.namedParameters[arg0] = str;
            i++;
          }
        }
      }
    } else if (arg0.indexOf('-') === 0) {
      arg0 = arg0.slice(1);
      this.namedParameters[arg0] = '';
    } else {
      this.unnamedParameters.push(arg0);
    }
  }
}

function make_random_id(len) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}