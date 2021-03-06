let session_id=undefined;
let halt_probes=false;
let session_info={};
let start_path='';

$(document).ready(function() {
	let query=parse_url_params();
	let source=query.source;
	start_path=query.path||'';
	let query_string=window.location.search.substring(1);
	if (!source) {
		set_status(`Missing query parameter: source`);
		return;
	}
	set_status(`Building from ${source} ...`);

	$.getJSON('../startSession/?'+query_string,function(data) {
		if (!data.success) {
			set_status(`Problem building from ${source}: `+data.error);
			return;
		}
		session_info=JSON.parse(JSON.stringify(data));
		$('#close_session').click(on_close_session);
		session_id=data.id;
		set_status(`Building image from ${source} ...`);
		setTimeout(function() {
			next_probe();
		},2000);
	});
});

function next_probe() {
	if (halt_probes) return;
	$.getJSON('../probeSession/?id='+session_id,function(data) {
		console.log(data);
		if (!data.success) {
			set_status(`Problem probing session: `+data.error);
			return;
		}
		let status=data.status;
		set_console_out(status.console_out);
		if (status.finished) {
			console.log(status.console_out);
			set_status('Build has stopped (probably with an error).');
			return;
		}
		if (status.console_out.indexOf('The Jupyter Notebook is running at:')>0) {
			$('#session_link').empty();
			let pathstr='';
			if (start_path)
				pathstr='/tree/'+start_path;
			let link=`
			<a href="http://${location.hostname}:${session_info.port}/lab${pathstr}?token=${session_info.id}" target=_blank>Open jupyterlab session</a>
			-- keep this tab open while you work
			`;
			$('#session_link').append(link);
			set_status(`Session has started.`);
		}
		else {
			set_status(`Building session ...`);
		}
		setTimeout(function() {
			next_probe();
		},5000);
	});
}

function set_status(status) {
	$('#status').html(status);
}

function set_console_out(txt) {
	$('#console_out').html(txt);
}

function on_close_session() {
	halt_probes=true;
	$.getJSON('../stopSession/?id='+session_id,function(data) {
		console.log(data);
		if (!data.success) {
			set_status(`Problem stopping session: `+data.error);
			return;
		}
		set_status('Session stopped');
	});
}




function parse_url_params() {
  var match;
  var pl = /\+/g; // Regex for replacing addition symbol with a space
  var search = /([^&=]+)=?([^&]*)/g;
  var decode = function(s) {
    return decodeURIComponent(s.replace(pl, " "));
  };
  var query = window.location.search.substring(1);
  var url_params = {};
  while (match = search.exec(query))
    url_params[decode(match[1])] = decode(match[2]);
  return url_params;
}