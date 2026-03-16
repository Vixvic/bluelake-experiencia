const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const html = await fetchUrl('https://vixvic.github.io/bluelake-experiencia/');
  const match = html.match(/src="\/bluelake-experiencia\/(assets\/index-[^"]+\.js)"/);
  
  if (!match) {
    console.log('NO SE ENCONTRO EL ARCHIVO JS');
    return;
  }
  
  const jsPath = match[1];
  const jsUrl = 'https://vixvic.github.io/bluelake-experiencia/' + jsPath;
  console.log('JS en produccion:', jsPath);
  
  const js = await fetchUrl(jsUrl);
  console.log('Tamanio JS (kb):', Math.round(js.length/1024));
  console.log('Tiene setTempPassword (ultimo cambio):', js.includes('setTempPassword'));
  console.log('Tiene emailRedirectTo void (BUG):', js.includes('emailRedirectTo:void 0'));
  console.log('Tiene Bluelake en signUp:', js.includes('Bluelake'));
}

main().catch(console.error);
