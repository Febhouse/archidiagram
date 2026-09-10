const SunCalc = require('suncalc');

const lat = 21.0285;
const lng = 105.8542;
const currentYear = 2026;

for (let d = 1; d <= 365; d+= 30) {
  const targetDate = new Date(currentYear, 0, 1);
  targetDate.setDate(d);
  targetDate.setHours(12, 0, 0);
  
  const pos = SunCalc.getPosition(targetDate, lat, lng);
  console.log(`Day ${d}: Altitude = ${pos.altitude}`);
}
