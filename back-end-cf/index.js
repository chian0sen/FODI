/**
 * IS_CN: 如果为世纪互联版本，请将 0 改为 1
 * EXPOSE_PATH：暴露路径，如全盘展示请留空，否则按 '/媒体/音乐' 的格式填写
 * ONEDRIVE_REFRESHTOKEN: refresh_token
 */
const IS_CN = 1;
const EXPOSE_PATH = ""
const ONEDRIVE_REFRESHTOKEN = "OAQABAAAAAAD32Me_adtYS4A5iUsE7inoKcEE2zzR2un6wM9qYza_kKmg5sSbdXwtbn-z_5ArVbKJTEp6ELpPMMpsLTClTiCf6JG8YZsqF4qeTwc0McjPowFtyrqElIVN_PEwymUzyjexwdffKGAUQ_Via0TSjZOFq5DKlYEikUGGRxWQ8nd1FzY-ugo7JaYPS2bs4x4uns0USHqvcFalQJ2xJShzVx3LuGe_rCW-vX0wWWvkjP7K6HCYUnemkWcFuuSpek6XmLQL7J-dA2utbEj0HVh0tQSeM3mveBvbTUAZ65LllCAf2wPp5k_aGZZwWvK_2HJ-SOKkb0x_F6NtM7Xv9L08-OxxShbQYDYqtI32CV-9nnZUcZ04sjcR7_ekUVd8yZulDnl9_dUUie6ckMpPiLc2P0qubLNS8u1Kun3Ky3vq7KkfANQlAXb4_4nRYmyDirJjTGu1WgERH3hDnJyVKE8QcBTm8hj0V9LWkPyB9MdwGjnnD6U1HxCw7qOTyYpGyAe46zcAPue1w35hcAXxIlnctwlJDWC9TWJvIYs32gRPRS9YGS_-GF4jqxbyftlLrjGQ1Ixq6fuqsit7PEHe1MELsqj2Q6p2rIPyzX6jCfH__Orms00ylWnKAR8utG0QozFcA63J3bj5sccUFYN7W5x9Try_poQu47exBaKZLfyZUbszaRx-ugPRF3NgrEHjnNmYLLkItZcKcxkeCu9t1b2EEsj0CBjJ5D4dWXM-kV1_D20hYd7SRZZaUW5yHz57Pi505osCdhEHalV8l7lGSxrKddmbq054HimPHtO8fLYhwm-rgyAA"


async function handleRequest(request) {
  let requestPath
  let querySplited
  let queryString = request.url.split('?')[1]
  if (queryString) {
    querySplited = queryString.split('=')
  }
  if (querySplited && querySplited[0] === 'file') {
    const file = querySplited[1]
    const fileName = file.split('/').pop();
    requestPath = file.replace('/' + fileName, '')
    const url = await fetchFiles(requestPath, fileName)
    return Response.redirect(url, 302)
  } else {
    const { headers } = request
    const contentType = headers.get('content-type')
    let body={}
    if (contentType && contentType.includes('form')) {
      const formData = await request.formData()
      for (let entry of formData.entries()) {
        body[entry[0]] = entry[1]
      }
    }
    requestPath = body ? body['?path'] : '';
    const files = await fetchFiles(requestPath, null, body.passwd);
    return new Response(files, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})


const clientId = [
  '4da3e7f2-bf6d-467c-aaf0-578078f0bf7c',
  '04c3ca0b-8d07-4773-85ad-98b037d25631'

]
const clientSecret = [
  '7/+ykq2xkfx:.DWjacuIRojIaaWL0QI6',
  'h8@B7kFVOmj0+8HKBWeNTgl@pU/z4yLB'
]

const oauthHost = [
  'https://login.microsoftonline.com',
  'https://login.partner.microsoftonline.cn'
]

const apiHost = [
  'https://graph.microsoft.com',
  'https://microsoftgraph.chinacloudapi.cn'
]

const OAUTH = {
  'redirectUri': 'https://scfonedrive.github.io',
  'refreshToken': ONEDRIVE_REFRESHTOKEN,
  'clientId': clientId[IS_CN],
  'clientSecret': clientSecret[IS_CN],
  'oauthUrl': oauthHost[IS_CN] + '/common/oauth2/v2.0/',
  'apiUrl': apiHost[IS_CN] + '/v1.0/me/drive/root',
  'scope': apiHost[IS_CN] + '/Files.ReadWrite.All offline_access'
}

async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type')
  if (contentType.includes('application/json')) {
    return await response.json()
  } else if (contentType.includes('application/text')) {
    return await response.text()
  } else if (contentType.includes('text/html')) {
    return await response.text()
  } else {
    return await response.text()
  }
}

async function getContent(url) {
  const response = await fetch(url)
  const result = await gatherResponse(response)
  return result
}

async function getContentWithHeaders(url, headers) {
  const response = await fetch(url, { headers: headers })
  const result = await gatherResponse(response)
  return result
}

async function fetchFormData(url, data) {
  const formdata = new FormData();
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      formdata.append(key, data[key])
    }
  }
  const requestOptions = {
    method: 'POST',
    body: formdata
  };
  const response = await fetch(url, requestOptions)
  const result = await gatherResponse(response)
  return result
}

async function fetchAccessToken() {
  url = OAUTH['oauthUrl'] + 'token'
  data = {
    'client_id': OAUTH['clientId'],
    'client_secret': OAUTH['clientSecret'],
    'grant_type': 'refresh_token',
    'requested_token_use': 'on_behalf_of',
    'refresh_token': OAUTH['refreshToken']
  }
  const result = await fetchFormData(url, data)
  return result.access_token
}

async function fetchFiles(path, fileName, passwd) {
  if (!path || path === '/') {
    if (EXPOSE_PATH === '') {
      path = ''
    } else {
      path = ':' + EXPOSE_PATH
    }
  } else {
    if (EXPOSE_PATH === '') {
      path = ':' + path
    } else {
      path = ':' + EXPOSE_PATH + path
    }
  }

  const accessToken = await fetchAccessToken()
  const uri = OAUTH.apiUrl + encodeURI(path) + '?expand=children(select=name,size,parentReference,lastModifiedDateTime,@microsoft.graph.downloadUrl)'

  const body = await getContentWithHeaders(uri, {
    Authorization: 'Bearer ' + accessToken
  })
  if (fileName) {
    let thisFile = null
    body.children.forEach(file => {
      if (file.name === decodeURIComponent(fileName)) {
        thisFile = file['@microsoft.graph.downloadUrl']
        return
      }
    })
    return thisFile
  } else {
    let files = []
    let encrypted = false
    for (let i = 0; i < body.children.length; i++) {
      const file = body.children[i]
      if (file.name === '.password') {
        const PASSWD = await getContent(file['@microsoft.graph.downloadUrl'])
        if (PASSWD !== passwd) {
          encrypted = true;
          break
        } else {
          continue
        }
      }
      files.push({
        name: file.name,
        size: file.size,
        time: file.lastModifiedDateTime,
        url: file['@microsoft.graph.downloadUrl']
      })
    }
    let parent
    if (body.children.length) {
      parent = body.children[0].parentReference.path
    } else {
      parent = body.parentReference.path
    }
    parent = parent.split(':').pop().replace(EXPOSE_PATH, '') || '/'
    parent = decodeURIComponent(parent)
    if (encrypted) {
      return JSON.stringify({ parent: parent, files: [], encrypted: true })
    } else {
      return JSON.stringify({ parent: parent, files: files })
    }
  }
}
