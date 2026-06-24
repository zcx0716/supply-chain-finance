addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (path.startsWith('/assets/') || path.includes('.')) {
    const response = await fetch(`https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist${path}`)
    if (response.status === 200) {
      return response
    }
  }

  const indexResponse = await fetch('https://raw.githubusercontent.com/zcx0716/supply-chain-finance/main/dist/index.html')
  if (!indexResponse.ok) {
    return new Response('Failed to fetch index.html', { status: 500 })
  }
  
  return new Response(await indexResponse.text(), {
    headers: { 'Content-Type': 'text/html' },
  })
}