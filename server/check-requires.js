const fs = require('fs');
const p = require('path');
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const full = p.join(d, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.js')) {
      const src = fs.readFileSync(full, 'utf8');
      const re = /require\((['"])(\.[^'"]+)\1\)/g;
      let m;
      while ((m = re.exec(src))) {
        const t = p.resolve(p.dirname(full), m[2]);
        const ok = fs.existsSync(t) || fs.existsSync(t + '.js') || fs.existsSync(p.join(t, 'index.js'));
        if (!ok) console.log(full.split('\\').join('/') + ' -> ' + m[2]);
      }
    }
  }
}
walk('src');
console.log('done');
