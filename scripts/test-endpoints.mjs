import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, snippet: data.substring(0, 120) });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log("Checking /placements...");
  console.log(await checkUrl("http://localhost:3000/placements"));

  console.log("Checking /placements/register...");
  console.log(await checkUrl("http://localhost:3000/placements/register"));

  console.log("Checking /api/placements/drives...");
  console.log(await checkUrl("http://localhost:3000/api/placements/drives"));
}

run();
