const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ADMIN_USER || 'ltdadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'ChangeMe123!');
const DB = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.set('trust proxy', 1);
app.use(session({ secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? 'temporary-demo-secret-change-me' : 'replace-this-secret'), resave:false, saveUninitialized:false, cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV === 'production',maxAge:8*60*60*1000} }));
app.use(express.static(path.join(__dirname, 'public')));

function readDb(){ return JSON.parse(fs.readFileSync(DB,'utf8')); }
function writeDb(db){ fs.writeFileSync(DB, JSON.stringify(db,null,2)); }
function id(){ return crypto.randomUUID(); }
function auth(req,res,next){ if(req.session.authenticated) return next(); res.status(401).json({error:'Unauthorized'}); }

app.post('/api/login',(req,res)=>{
  const {username,password}=req.body||{};
  if(username===ADMIN_USER && password===ADMIN_PASSWORD){ req.session.authenticated=true; return res.json({ok:true}); }
  res.status(401).json({error:'Invalid login'});
});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/me',(req,res)=>res.json({authenticated:!!req.session.authenticated}));

app.get('/api/availability',(req,res)=>{
  const date=String(req.query.date||'');
  const db=readDb();
  const slots=['10:00','12:00','14:00','16:00'];
  const taken=db.appointments.filter(a=>a.date===date).map(a=>a.time);
  const blocked=db.blocked.filter(a=>a.date===date).map(a=>a.time);
  res.json({date,slots:slots.map(time=>({time,available:!taken.includes(time)&&!blocked.includes(time)}))});
});

app.post('/api/book',(req,res)=>{
  const {name,phone,email,service,date,time}=req.body||{};
  if(!name||!phone||!service||!date||!time) return res.status(400).json({error:'Name, phone, service, date and time are required.'});
  const db=readDb();
  const allowed=['10:00','12:00','14:00','16:00'];
  if(!allowed.includes(time)) return res.status(400).json({error:'Invalid time.'});
  if(db.appointments.some(a=>a.date===date&&a.time===time) || db.blocked.some(a=>a.date===date&&a.time===time)) return res.status(409).json({error:'That time is no longer available.'});
  const appointment={id:id(),name,phone,email:email||'',service,date,time,status:'booked',createdAt:new Date().toISOString()};
  db.appointments.push(appointment); writeDb(db); res.status(201).json(appointment);
});

app.get('/api/admin/appointments',auth,(req,res)=>{
  const db=readDb();
  res.json({appointments:db.appointments.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),blocked:db.blocked});
});
app.post('/api/admin/block',auth,(req,res)=>{
  const {date,time}=req.body||{}; if(!date||!time) return res.status(400).json({error:'Date and time required.'});
  const db=readDb();
  if(db.appointments.some(a=>a.date===date&&a.time===time)) return res.status(409).json({error:'An appointment already exists at that time.'});
  if(!db.blocked.some(a=>a.date===date&&a.time===time)) db.blocked.push({id:id(),date,time});
  writeDb(db); res.json({ok:true});
});
app.delete('/api/admin/block/:id',auth,(req,res)=>{ const db=readDb(); db.blocked=db.blocked.filter(x=>x.id!==req.params.id); writeDb(db); res.json({ok:true}); });
app.delete('/api/admin/appointments/:id',auth,(req,res)=>{ const db=readDb(); db.appointments=db.appointments.filter(x=>x.id!==req.params.id); writeDb(db); res.json({ok:true}); });

app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.listen(PORT, HOST, ()=>console.log(`LTD booking demo running on ${HOST}:${PORT}`));
