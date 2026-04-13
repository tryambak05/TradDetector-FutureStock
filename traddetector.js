var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'Trad Detector FutureStock',
  description: 'The trad detector signal option trad.',
  script: 'D:\\TreadingView\\Projects\\TradDetector-FutureStock\\dist\\index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
  //, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
});

svc.on('uninstall', function () {
  svc.start();
});


const args = process.argv.slice(2);

// Do something with the command line arguments
args.forEach((arg, index) => {
  if (arg == "install") {
    console.log("expiry trad bot installing...")
    svc.install();
  } else if (arg == "uninstall") {
    console.log("expiry trad bot expiry un-installing...")
    svc.uninstall();
  }
});