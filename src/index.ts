import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event: FetchEvent): Promise<Response> {
  try {
    let request = event.request
    let response = await getAssetFromKV(event, {
      mapRequestToAsset: (req) => {
        let defaultAssetKey = mapRequestToAsset(req)
        let url = new URL(defaultAssetKey.url)
        
        if (!url.pathname.startsWith('/assets/') && !url.pathname.includes('.')) {
          url.pathname = '/index.html'
        }
        
        return new Request(url.toString(), defaultAssetKey)
      }
    })
    
    if (response.status === 404) {
      const indexAsset = await getAssetFromKV(event, {
        mapRequestToAsset: () => new Request(`${new URL(event.request.url).origin}/index.html`, event.request)
      })
      return indexAsset
    }
    
    return response
  } catch (e) {
    return new Response(`Error fetching asset: ${e}`, { status: 500 })
  }
}