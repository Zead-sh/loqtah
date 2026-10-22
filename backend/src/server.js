import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const app=express(),PORT=Number(process.env.PORT||4000);
app.use(cors({origin:process.env.FRONTEND_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'100kb'}));
const catalog=[{id:1,name:'منظّم المكتب الذكي',price:79},{id:2,name:'مصباح أجواء متعدد الألوان',price:99},{id:3,name:'زجاجة حرارية يومية',price:69},{id:4,name:'حامل جوال قابل للتعديل',price:49},{id:5,name:'وسادة سفر مريحة',price:59},{id:6,name:'منظّم أغراض السيارة',price:89}];
const orders=new Map(),clean=v=>typeof v==='string'?v.trim():'';
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'loqtah-api',mode:'demo'}));
app.get('/api/products',(_req,res)=>res.json({items:catalog,source:'demo-catalog'}));
app.post('/api/orders',(req,res)=>{
 const c=req.body?.customer||{},items=req.body?.items;
 const name=clean(c.name),phone=clean(c.phone),city=clean(c.city),district=clean(c.district),address=clean(c.address);
 if(name.length<2||name.length>100)return res.status(400).json({message:'الاسم غير صالح'});
 if(!/^[0-9+() -]{8,20}$/.test(phone))return res.status(400).json({message:'رقم الجوال غير صالح'});
 if(!city||city.length>80||!district||district.length>100||address.length<5||address.length>300)return res.status(400).json({message:'يرجى إدخال المدينة والحي والعنوان بشكل صحيح'});
 if(!Array.isArray(items)||items.length<1||items.length>30)return res.status(400).json({message:'السلة فارغة أو غير صالحة'});
 const normalized=[];
 for(const item of items){const p=catalog.find(x=>x.id===Number(item.productId)),q=Number(item.quantity);if(!p||!Number.isInteger(q)||q<1||q>20)return res.status(400).json({message:'أحد المنتجات أو الكميات غير صالح'});normalized.push({productId:p.id,name:p.name,unitPrice:p.price,quantity:q,lineTotal:p.price*q})}
 const total=normalized.reduce((s,i)=>s+i.lineTotal,0);if(total>50000)return res.status(400).json({message:'قيمة الطلب أعلى من الحد التجريبي'});
 const orderId=`LQ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
 orders.set(orderId,{orderId,customer:{name,phone,city,district,address},items:normalized,total,currency:'SAR',paymentMethod:'cod',status:'pending_demo',createdAt:new Date().toISOString()});
 return res.status(201).json({orderId,status:'pending_demo',total,currency:'SAR',demo:true});
});
app.get('/api/orders/:id',(req,res)=>{const o=orders.get(req.params.id);if(!o)return res.status(404).json({message:'الطلب غير موجود في جلسة الخادم الحالية'});res.json({orderId:o.orderId,status:o.status,total:o.total,currency:o.currency,demo:true})});
if(process.env.NODE_ENV==='production'){const __dirname=path.dirname(fileURLToPath(import.meta.url)),dist=path.resolve(__dirname,'../../dist');app.use(express.static(dist));app.get('*',(_req,res)=>res.sendFile(path.join(dist,'index.html')))}
app.listen(PORT,()=>console.log(`LOQTAH API listening on http://localhost:${PORT}`));
