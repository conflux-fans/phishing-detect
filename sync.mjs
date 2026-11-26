import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile, writeFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

const repo = 'MetaMask/eth-phishing-detect'
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const json = obj => JSON.stringify(obj, null, 2) + '\n'
function hosts(entries) {
  assert(Array.isArray(entries) && entries.length > 0 && entries.length <= 500000, 'unexpected list size')
  const result = new Set()
  for (const value of entries) {
    assert(typeof value === 'string' && value.length <= 1024, 'bad list entry')
    if (!value || /[\s\\/@:?#%*]/u.test(value)) continue // never broaden a path or wildcard
    let host = value.toLowerCase().replace(/\.$/, '')
    if (/\P{ASCII}/u.test(host)) host = new URL(`https://${host}`).hostname
    assert(/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*$/.test(host) && host.length <= 253 && host.split('.').every(label => label.length <= 63), 'invalid hostname')
    if (host.includes('.') || host === 'localhost') result.add(host)
  }
  return [...result].sort()
}
export function candidate({commit, config, license}, previous, licenseBytes) {
  assert(/^[0-9a-f]{40}$/.test(commit), 'invalid upstream commit')
  assert.equal(sha256(licenseBytes), previous.licenseSha256, 'invalid local license')
  assert.equal(sha256(license), previous.licenseSha256, 'upstream license changed: review before redistribution')
  const feed = JSON.parse(config)
  assert.equal(feed.version, 2)
  const whitelist = hosts(feed.whitelist), blacklist = hosts(feed.blacklist)
  for (const [count, old, min] of [[whitelist.length, previous.allowed, 20], [blacklist.length, previous.blocked, 50000]]) {
    assert(count >= min && count >= old / 2 && count <= old * 2, 'unexpected change in domain count: review manually')
  }
  const domains = json({version: 2, whitelist, blacklist}), hash = sha256(domains)
  if (hash === previous.domainsSha256) return null
  return {domains, stamp: json({repository: `https://github.com/${repo}`, commit, configSha256: sha256(config), licenseSha256: sha256(license), domainsSha256: hash, allowed: whitelist.length, blocked: blacklist.length})}
}
async function download(url, limit) {
  const response = await fetch(url, {redirect:'error', signal:AbortSignal.timeout(30000)})
  assert(response.ok && Number(response.headers.get('content-length')) <= limit, 'invalid upstream response')
  const chunks = []; let size = 0
  for await (const chunk of response.body) {
    size += chunk.length; assert(size <= limit, 'upstream response too large'); chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
export async function sync(get = download, dir = new URL('./', import.meta.url)) {
  const file = name => new URL(name, dir)
  const [published, stamp, localLicense] = await Promise.all(['domains.json','source.json','LICENSE-MetaMask.txt'].map(name => readFile(file(name))))
  const previous = JSON.parse(stamp)
  assert.equal(sha256(published), previous.domainsSha256, 'published list and stamp do not agree')
  const {sha:commit} = JSON.parse(await get(`https://api.github.com/repos/${repo}/commits/main`, 1024 * 1024))
  assert(/^[0-9a-f]{40}$/.test(commit), 'invalid upstream commit')
  const root = `https://raw.githubusercontent.com/${repo}/${commit}`
  const [config,license] = await Promise.all([get(`${root}/src/config.json`, 12 * 1024 * 1024),get(`${root}/LICENSE`, 64 * 1024)])
  const result = candidate({commit,config,license},previous,localLicense)
  if (!result) return false
  // Files become visible to consumers together only when the workflow pushes one Git commit.
  await Promise.all([writeFile(file('domains.json'),result.domains), writeFile(file('source.json'),result.stamp)])
  return true
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(await sync() ? 'Validated new domain lists' : 'Unchanged; nothing to publish')
