/**
 * Host Configuration
 *
 * Is used in main.js line:28
 * Like so:
 *
 * this.connection = new Connection(new WebSocket("ws://"+config['host']+":"+config['port']+"/"+config['port']+"/"), { host: config['host'], port: config['port'] });
 * this.connection = new Connection(new WebSocket("ws://127.0.0.1:7777/eighty/"), { host: "127.0.0.1", port: 7777 });
 */
config=[];
// Host or IP
config["host"]="cloud.gamedev.pl";
// PORT
config["port"]=1750;

// Channel for proxy
config["channel"]="eightyV.2";