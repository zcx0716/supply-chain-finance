addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})

const ASSETS = {
  '/': () => fetch('https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist/index.html'),
  '/index.html': () => fetch('https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist/index.html'),
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (path.startsWith('/assets/')) {
    return fetch(`https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist${path}`)
  }

  if (path.includes('.') && !path.endsWith('/')) {
    return fetch(`https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist${path}`)
  }

  const indexResponse = await fetch('https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist/index.html')
  return new Response(await indexResponse.text(), {
    headers: { 'Content-Type': 'text/html' },
  })
}