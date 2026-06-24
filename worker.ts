import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', (event: any) => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event: any): Promise<Response> {
  try {
    const request = event.request
    const url = new URL(request.url)
    
    if (!url.pathname.startsWith('/assets/') && !url.pathname.includes('.')) {
      const indexAsset = await getAssetFromKV(event, {
        mapRequestToAsset: () => new Request(`${url.origin}/index.html`, request)
      })
      return indexAsset
    }
    
    return getAssetFromKV(event)
  } catch (e) {
    return new Response(`Error: ${e}`, { status: 500 })
  }
}