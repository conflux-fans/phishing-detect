import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {sync, sha256} from './sync.mjs'

const commit = 'a'.repeat(40), license = 'fixture license', json = x => JSON.stringify(x,null,2)+'\n'
const fixture = {version:2,whitelist:Array.from({length:20},(_,i)=>`a${i}.test`).sort(),blacklist:Array.from({length:50000},(_,i)=>`b${i}.test`).sort()}
async function setup(t) {
  const dir=await mkdtemp(path.join(tmpdir(),'fluent-feed-')); t.after(()=>rm(dir,{recursive:true,force:true}))
  const stamp=json({commit:'b'.repeat(40),licenseSha256:sha256(license),domainsSha256:sha256(json(fixture)),allowed:20,blocked:50000})
  for(const [f,data] of [['source.json',stamp],['domains.json',json(fixture)],['LICENSE-MetaMask.txt',license]]) await writeFile(path.join(dir,f),data)
  return { read:f=>readFile(path.join(dir,f),'utf8'), run(feed, lic=license) {return sync(async url => {
    if(url.endsWith('/commits/main')) return JSON.stringify({sha:commit})
    assert(url.includes('/'+commit+'/')); if(url.endsWith('/LICENSE')) return lic
    if(feed instanceof Error) throw feed; return JSON.stringify(feed)
  },pathToFileURL(dir+'/'))},stamp }
}
test('unchanged effective hosts never advance the publication stamp', async t=>{
 const f=await setup(t);assert.equal(await f.run({...fixture,blacklist:[...fixture.blacklist].reverse().concat('shared.test/path')}),false); assert.equal(await f.read('source.json'),f.stamp)
})
test('publishes paired rules from a single commit and records source and output digests',async t=>{
 const f=await setup(t), data={...fixture,blacklist:[...fixture.blacklist,'NEW.test'],whitelist:[...fixture.whitelist,'safe.new.test']};assert.equal(await f.run(data),true);const domains=await f.read('domains.json'),s=JSON.parse(await f.read('source.json'));assert.equal(s.commit,commit);assert.equal(s.domainsSha256,sha256(domains));assert.equal(s.configSha256,sha256(JSON.stringify(data)));assert(JSON.parse(domains).blacklist.includes('new.test'));assert(JSON.parse(domains).whitelist.includes('safe.new.test'))
})
test('network, schema, size and license failures leave the previous pair untouched',async t=>{
 const f=await setup(t);for(const [value,lic] of [[new Error('offline')],[{...fixture,whitelist:[]}],[{...fixture,version:3}],[{...fixture,blacklist:['short.test']}],[fixture,'changed license']]){await assert.rejects(f.run(value,lic));assert.equal(await f.read('source.json'),f.stamp);assert.equal(await f.read('domains.json'),json(fixture))}
})
