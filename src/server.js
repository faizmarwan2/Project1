const cfg = require('./config');
require('./seed').ensureSeed();
require('./app').listen(cfg.port, () => console.log(`Attendance API jalan di http://localhost:${cfg.port}`));
