const fs = require('fs');
const data = fs.readFileSync('public/bmw_m5_cs_f90.glb');
const str = data.toString('utf8');
const matches = str.match(/"name":"[^"]+"/g);
if (matches) {
    const unique = [...new Set(matches)];
    console.log(unique.join('\n'));
} else {
    console.log("No matches found");
}
