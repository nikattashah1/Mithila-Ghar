const fs = require('fs');
const files = [
  'catalogController.js', 
  'cartController.js', 
  'wishlistController.js', 
  'walletController.js', 
  'orderPaymentController.js', 
  '../seed/seed.js'
];
files.forEach(f => { 
  const p = 'controllers/' + f; 
  if(fs.existsSync(p)){ 
    const c = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, c.replace(/\\`/g, '`')); 
  } 
});
