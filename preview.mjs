// Local preview with byte ranges for streaming and seeking large audio files.
import http from 'node:http';
import {statSync,createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const base=resolve('.');
http.createServer((req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');const file=resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
    const stat=statSync(file);if(!stat.isFile()){res.writeHead(404).end();return;}
    const headers={'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json','.png':'image/png'})[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    let start=0,end=stat.size-1;const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
    if(match){if(!match[1])start=Math.max(0,stat.size-Number(match[2]));else start=Number(match[1]);if(match[1]&&match[2])end=Math.min(end,Number(match[2]));if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(match?206:200,headers);if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{res.writeHead(404).end();}
}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173/'));
