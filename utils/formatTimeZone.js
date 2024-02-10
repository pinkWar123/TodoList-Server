const moment = require('moment-timezone');
const formatTimeZone = (ts, offset) => {
  return new Date(new Date(ts).getTime() - offset * 60000);
};

module.exports = formatTimeZone;
