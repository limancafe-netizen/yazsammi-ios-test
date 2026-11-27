// CI vekili: 127.0.0.1:8787 -> deneme servisi; kimlik jetonunu X-Serverless-Authorization ile ekler (uygulamanin Authorization basligina dokunmaz).
const http = require('http'), https = require('https');
const HEDEF = new URL(process.env.HEDEF), JETON = process.env.JETON;
http.createServer((q, s) => {
  const b = { ...q.headers, host: HEDEF.host, 'x-serverless-authorization': 'Bearer ' + JETON };
  const u = https.request({ host: HEDEF.hostname, path: q.url, method: q.method, headers: b }, (r) => { s.writeHead(r.statusCode, r.headers); r.pipe(s); });
  u.on('error', () => { s.statusCode = 502; s.end(); });
  q.pipe(u);
}).listen(8787, '127.0.0.1');
