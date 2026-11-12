import{r as p,j as a,B as O,M as ot,i as nt,E as it,J as dt,K as lt}from"./index-BEKakvfd.js";import{b as fe,P as ct,w as pt,T as ut,I as J,C as mt}from"./PrivateApp-rsFxxz4c.js";import{B as ht}from"./Badge-BPorQ-ic.js";import{P as gt,C as W,a as ve,b as be}from"./PageHeader-Bpw5Oh7n.js";import{D as ft}from"./Drawer-8UV1F69b.js";import{S as X}from"./SectionHeader-g8Qaa3fR.js";import{S as Z}from"./Select-DI9NtdOy.js";import{S as ye}from"./StatusBadge-DvLiKZAN.js";import{u as vt}from"./useConfirm-C2UgUOaG.js";import{u as bt}from"./useToast-NpA0h-Gf.js";import{D as yt}from"./DataTable-mvSMOaX2.js";import{D as xt}from"./DetailTable-DdjQm1zG.js";import{I as xe}from"./InfoGrid-Ct6B9IBu.js";import{c as m,f as we,b as ee}from"./format-W420N1b6.js";import{L as wt,T as Ie,A as Se}from"./DocParts-DG8Mp2-Y.js";import{a as v}from"./authFetch-q5443eLA.js";import{P as Ae}from"./plus-BVzZAQRI.js";import{T as Ce}from"./trash-2-BagYVL_q.js";import{D as It}from"./download-e1ZrxGP9.js";import{P as St}from"./pencil-DdUvcDq4.js";import"./Skeleton-Cx1cDV2l.js";import"./arrow-down-gq7z1Ca8.js";function je(d){return String(d??"").trim().toLowerCase()}function At(d){return d?.vendor_code??d?.vendorCode??d?.code??""}function Ne(d,I){const S=je(I);return!S||!Array.isArray(d)?null:d.find(R=>je(At(R))===S)||null}const h={vendor:{getAll:()=>v("/vendor"),getAddresses:d=>v(`/vendor/${d}/addresses?type=all`)},product:{getAll:()=>v("/product")},batch:{getAll:()=>v("/stock")},purchaseOrder:{getAll:()=>v("/purchase-orders"),getById:d=>v(`/purchase-orders/${d}`),create:d=>v("/purchase-orders",{method:"POST",body:JSON.stringify(d)}),update:(d,I)=>v(`/purchase-orders/${d}`,{method:"PUT",body:JSON.stringify(I)}),delete:d=>v(`/purchase-orders/${d}`,{method:"DELETE"})}};function Jt(){const d=bt(),I=vt(),[S,R]=p.useState([]),[D,Te]=p.useState([]),[M,Pe]=p.useState([]),[Oe,te]=p.useState([]),[De,q]=p.useState(!1),[ke,L]=p.useState(!1),[$e,G]=p.useState(!1),[i,z]=p.useState(null),[A,ae]=p.useState(null),[Ee,re]=p.useState(!1),[_e,C]=p.useState(null),[Ct,se]=p.useState(""),[j,U]=p.useState(null),[jt,B]=p.useState([]),[Nt,oe]=p.useState(!1),[u,w]=p.useState({orderDate:new Date().toISOString().split("T")[0],vendorId:"",vendorCode:"",paymentMethod:"cash",description:"",billToPartyId:"",shipToPartyId:"",lines:[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),[N,T]=p.useState({}),[ne,P]=p.useState(""),l=e=>{const t=parseFloat(e);return isNaN(t)?0:t},g=e=>l(e).toFixed(2),H=()=>{w({orderDate:new Date().toISOString().split("T")[0],vendorId:"",vendorCode:"",paymentMethod:"cash",description:"",billToPartyId:"",shipToPartyId:"",lines:[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),T({}),P(""),ae(null),se(""),U(null),B([])};p.useEffect(()=>{Ve()},[]);const Ve=async()=>{try{q(!0);const[e,t,r]=await Promise.all([h.vendor.getAll(),h.product.getAll(),h.batch.getAll()]);R(Array.isArray(e)?e:[]),Te(Array.isArray(t)?t:[]),Pe(Array.isArray(r)?r:[]),await k()}catch(e){console.error("Error fetching initial data:",e)}finally{q(!1)}},Re=async e=>{if(!e.trim()){U(null),B([]);return}oe(!0);try{let t=Ne(S,e);if(!t){const n=await h.vendor.getAll(),s=Array.isArray(n)?n:[];R(s),t=Ne(s,e)}if(!t)throw new Error("Vendor not found");U(t),w(n=>({...n,vendorId:t.id}));const r=await h.vendor.getAddresses(t.id);B(r.addresses||[])}catch(t){console.error("Error fetching vendor:",t),U(null),B([]),T(r=>({...r,vendorCode:"Vendor not found"}))}finally{oe(!1)}},k=async()=>{q(!0);try{const e=await h.purchaseOrder.getAll();te(Array.isArray(e)?e:[])}catch(e){console.error("Error fetching purchase orders:",e),te([])}finally{q(!1)}},Me=()=>{w(e=>({...e,lines:[...e.lines,{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}))},qe=e=>{u.lines.length>1&&w(t=>({...t,lines:t.lines.filter((r,n)=>n!==e)}))},F=(e,t,r)=>{const n=[...u.lines];if(t==="productId"){const s=D.find(c=>c.id===parseInt(r));n[e]={...n[e],[t]:r,pricePerUnit:s&&(s.purchasePrice||s.price)||"",batchId:"",material:""}}else if(t==="batchId"){const s=M.find(c=>c.id===parseInt(r));n[e]={...n[e],[t]:r,material:s?s.material_code||s.material||s.materialName||"N/A":"",pricePerUnit:s&&(s.price_per_unit||s.pricePerUnit||s.price)||""}}else t==="quantity"?n[e][t]=parseInt(r)||1:t==="pricePerUnit"?n[e][t]=parseFloat(r)||"":n[e][t]=r;w(s=>({...s,lines:n})),N[`lines.${e}.${t}`]&&T(s=>({...s,[`lines.${e}.${t}`]:""}))},Le=e=>e?M.filter(t=>t.productId===parseInt(e)):[],ie=e=>{const t=D.find(f=>f.id===parseInt(e.productId)),r=l(e.pricePerUnit)||(t?l(t.purchasePrice||t.price):0),n=l(e.quantity),s=r*n;if(!t)return{netValue:0,cgst:0,sgst:0,igst:0,total:0};const c=l(t?.hsn?.gst_rate);let b=0,y=0,o=0;j&&j.state&&j.state===j.distributorState?(b=s*c/200,y=s*c/200):o=s*c/100;const x=s+b+y+o;return{netValue:s,cgst:b,sgst:y,igst:o,total:x}},Ue=()=>u.lines.reduce((e,t)=>{const r=ie(t);return{netValue:e.netValue+r.netValue,cgst:e.cgst+r.cgst,sgst:e.sgst+r.sgst,igst:e.igst+r.igst,total:e.total+r.total}},{netValue:0,cgst:0,sgst:0,igst:0,total:0}),Be=()=>{let e={};return u.orderDate||(e.orderDate="Order date is required"),u.lines.forEach((t,r)=>{t.productId||(e[`lines.${r}.productId`]="Product is required"),(!t.quantity||t.quantity<=0)&&(e[`lines.${r}.quantity`]="Quantity must be greater than 0")}),T(e),Object.keys(e).length===0},Q=e=>{const{name:t,value:r}=e.target;w(n=>({...n,[t]:r})),T(n=>({...n,[t]:""})),P("")},Fe=async e=>{if(e.preventDefault(),!!Be()){re(!0);try{const{vendorId:t,vendorCode:r,...n}=u,s={...n,...A&&u.vendorId?{vendorId:u.vendorId}:{},lines:u.lines.map(c=>({productId:parseInt(c.productId),batchId:c.batchId?parseInt(c.batchId):null,quantity:parseInt(c.quantity),pricePerUnit:c.pricePerUnit?parseFloat(c.pricePerUnit):null,material:c.material}))};A?(await h.purchaseOrder.update(A.id,s),P("Purchase order updated successfully!")):(await h.purchaseOrder.create(s),P("Purchase order created successfully!")),H(),L(!1),k(),setTimeout(()=>P(""),3e3)}catch(t){console.error(t),T({submit:"Failed to save order"})}finally{re(!1)}}},Ge=async e=>{try{const t=await h.purchaseOrder.getById(e.id);if(t.vendorId){const r=await h.vendor.getAddresses(t.vendorId);t.vendorAddresses=r.addresses||[]}else t.vendorAddresses=[];z(t),G(!0)}catch(t){console.error("Error fetching order details:",t),z(e),G(!0)}},ze=async e=>{try{const t=await h.purchaseOrder.getById(e);w({orderDate:t.orderDate?t.orderDate.split("T")[0]:"",vendorId:t.vendorId||"",vendorCode:t.vendorCode||"",paymentMethod:t.paymentMethod||"cash",description:t.description||"",billToPartyId:t.billToPartyId||"",shipToPartyId:t.shipToPartyId||"",lines:t.lines?.length>0?t.lines.map(r=>({productId:r.productId?.toString()||"",batchId:r.batchId?.toString()||"",quantity:r.quantity||1,pricePerUnit:r.pricePerUnit||"",material:r.material_code||r.material||""})):[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),t.vendorCode&&(se(t.vendorCode),await Re(t.vendorCode)),ae(t),L(!0)}catch(t){console.error("Error fetching order for edit:",t)}},He=async e=>{if(await I({title:"Delete purchase order?",message:"Are you sure you want to delete this order?",tone:"danger",confirmLabel:"Delete"})){C(e);try{await h.purchaseOrder.delete(e),k()}catch(t){console.error("Error deleting order:",t),d.error(t.message||"Failed to delete order",{title:"Delete failed"})}finally{C(null)}}},Qe=async e=>{C(e);try{await v(`/purchase-orders/${e}/confirm`,{method:"POST"}),k()}catch(t){console.error("Error confirming order:",t),d.error(t.message||"Failed to confirm order",{title:"Confirm failed"})}finally{C(null)}},Ye=async e=>{if(await I({title:"Cancel purchase order?",message:"Cancel this purchase order? This cannot be undone.",tone:"danger",confirmLabel:"Cancel order",cancelLabel:"Keep order"})){C(e);try{await v(`/purchase-orders/${e}/cancel`,{method:"POST"}),k()}catch(t){console.error("Error cancelling order:",t),d.error(t.message||"Failed to cancel order",{title:"Cancel failed"})}finally{C(null)}}},$=e=>e.status||"DRAFT",de=e=>$(e)==="DRAFT",Ke=e=>$(e)==="DRAFT",Je=e=>["DRAFT","CONFIRMED"].includes($(e)),We=e=>{const t=S.find(o=>o.id===e.vendorId),r=e.vendorAddresses||[],n=r.find(o=>o.type==="bill_to_party"||o.type==="sold_to_party"),s=r.find(o=>o.type==="ship_to_party"),c=o=>{if(!o)return null;const x=[o.street1,o.street2,o.street3,o.street4,o.city,o.region,o.pincode||o.postalCode||o.postal_code,o.country].filter(Boolean);return x.length>0?x.join(", "):null},b=c(n),y=c(s);return`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Purchase Order - ${e.id}</title>
    <style>
        @page { margin: 15mm; size: A4; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #0066cc; 
            padding-bottom: 20px; 
            margin-bottom: 25px; 
        }
        .company-name { 
            font-size: 26px; 
            font-weight: bold; 
            color: #0066cc; 
            margin-bottom: 5px; 
            letter-spacing: 1px;
        }
        .document-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-top: 10px; 
            color: #333;
        }
        .order-number {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .vendor-section {
            margin-bottom: 25px;
            border: 2px solid #0066cc;
            border-radius: 8px;
            overflow: hidden;
        }
        .vendor-header {
            background-color: #0066cc;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }
        .vendor-content {
            display: flex;
            flex-wrap: wrap;
        }
        .vendor-info-box {
            flex: 1;
            min-width: 300px;
            padding: 15px;
            border-right: 1px solid #ddd;
        }
        .vendor-info-box:last-child {
            border-right: none;
        }
        .info-box-title {
            font-weight: bold;
            color: #0066cc;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 12px;
            font-size: 12px;
        }
        .vendor-detail {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
        }
        .detail-label {
            font-weight: bold;
            width: 90px;
            color: #555;
            flex-shrink: 0;
        }
        .detail-value {
            flex: 1;
            font-weight: 600;
        }
        .not-specified {
            color: #999;
            font-style: italic;
            font-weight: normal;
        }
        
        .order-info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 25px; 
            gap: 20px;
        }
        .info-box { 
            flex: 1;
            border: 1px solid #ccc; 
            padding: 15px; 
            background-color: #f9f9f9; 
            border-radius: 6px;
        }
        .info-title { 
            font-weight: bold; 
            color: #0066cc; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
            margin-bottom: 12px; 
            font-size: 13px;
        }
        .field-row { 
            margin-bottom: 8px; 
            display: flex; 
            align-items: flex-start;
        }
        .field-label { 
            font-weight: bold; 
            width: 100px; 
            color: #555; 
            flex-shrink: 0;
        }
        .field-value { 
            flex: 1; 
            word-wrap: break-word;
        }
        
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            border: 2px solid #0066cc; 
            font-size: 10px;
        }
        .items-table th { 
            background-color: #0066cc; 
            color: white; 
            padding: 10px 8px; 
            text-align: left; 
            font-weight: bold; 
            font-size: 10px;
        }
        .items-table td { 
            padding: 8px; 
            border-bottom: 1px solid #ddd; 
            vertical-align: top;
        }
        .items-table tr:nth-child(even) { 
            background-color: #f9f9f9; 
        }
        .currency { 
            font-family: monospace; 
            text-align: right;
        }
        
        .total-section { 
            margin-top: 20px; 
            padding: 15px; 
            border: 2px solid #0066cc; 
            border-radius: 8px;
            background-color: #f8f9fa;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 3px 0;
        }
        .total-label {
            font-weight: bold;
            color: #555;
        }
        .total-amount { 
            font-size: 16px; 
            font-weight: bold; 
            color: #0066cc; 
            border-top: 2px solid #0066cc;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .description-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 6px;
        }
        .generated-info {
            font-size: 9px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">DISTRIBUTION MANAGEMENT SYSTEM</div>
        <div style="font-size: 14px; color: #666; margin: 5px 0;">Professional Purchase Order Document</div>
        <div class="document-title">PURCHASE ORDER</div>
        <div class="order-number">Order No: ${e.id}</div>
    </div>

    <div class="vendor-section">
        <div class="vendor-header">VENDOR INFORMATION & ADDRESSES</div>
        <div class="vendor-content">
            <div class="vendor-info-box">
                <div class="info-box-title">PRIMARY VENDOR DETAILS</div>
                <div class="vendor-detail">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${t?.name||"N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Code:</span>
                    <span class="detail-value">${t?.vendorCode||t?.vendor_code||"N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${t?.email||"N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${t?.phone||"N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">GST No:</span>
                    <span class="detail-value">${t?.taxNumber||t?.gstNumber||"N/A"}</span>
                </div>
            </div>

            <div class="vendor-info-box">
                <div class="info-box-title">BILL TO PARTY</div>
                ${b?`
                    <div class="vendor-detail">
                        <span class="detail-value">${b}</span>
                    </div>
                `:`
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Billing address not provided
                        </span>
                    </div>
                `}
            </div>

            <div class="vendor-info-box">
                <div class="info-box-title">SHIP TO PARTY</div>
                ${y?`
                    <div class="vendor-detail">
                        <span class="detail-value">${y}</span>
                    </div>
                `:b?`
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Same as billing address
                        </span>
                    </div>
                `:`
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Shipping address not provided
                        </span>
                    </div>
                `}
            </div>
        </div>
    </div>

    <div class="order-info-section">
        <div class="info-box">
            <div class="info-title">ORDER INFORMATION</div>
            <div class="field-row">
                <span class="field-label">Order No:</span>
                <span class="field-value">${e.id}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Order Date:</span>
                <span class="field-value">${e.orderDate?new Date(e.orderDate).toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"}):"N/A"}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Payment:</span>
                <span class="field-value">${e.paymentMethod||"Cash"}</span>
            </div>
        </div>
        
        <div class="info-box">
            <div class="info-title">DELIVERY INFORMATION</div>
            <div class="field-row">
                <span class="field-label">Status:</span>
                <span class="field-value">${e.status||"Pending"}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Priority:</span>
                <span class="field-value">${e.priority||"Normal"}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Expected:</span>
                <span class="field-value">${e.expectedDelivery?new Date(e.expectedDelivery).toLocaleDateString("en-IN"):"TBD"}</span>
            </div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 20%;">Product Name</th>
                <th style="width: 10%;">Batch No.</th>
                <th style="width: 12%;">Material</th>
                <th style="width: 8%;">Qty</th>
                <th style="width: 10%;">Unit Price</th>
                <th style="width: 10%;">Net Value</th>
                <th style="width: 7%;">CGST</th>
                <th style="width: 7%;">SGST</th>
                <th style="width: 7%;">IGST</th>
                <th style="width: 10%;">Line Total</th>
            </tr>
        </thead>
        <tbody>
            ${e.lines&&e.lines.length>0?e.lines.map((o,x)=>{const f=D.find(K=>K.id===o.productId),ue=M.find(K=>K.id===o.batchId),V=l(o.lineNetValue),me=f?V*l(f.cgst)/100:0,he=f?V*l(f.sgst)/100:0,ge=f?V*l(f.igst)/100:0,st=V+me+he+ge;return`
                <tr>
                    <td style="text-align: center;">${x+1}</td>
                    <td>
                        <strong>${f?.name||o.product?.name||"N/A"}</strong>
                        ${f?.description?`<br><small style="color: #666;">${f.description}</small>`:""}
                    </td>
                    <td style="text-align: center;">${ue?.batch_no||ue?.batch_number||o.batch?.batch_no||"N/A"}</td>
                    <td style="text-align: center;">${o.material_code||o.material||"N/A"}</td>
                    <td style="text-align: center;">${l(o.quantity)}</td>
                    <td class="currency">₹ ${g(o.pricePerUnit)}</td>
                    <td class="currency">₹ ${g(V)}</td>
                    <td class="currency">₹ ${g(me)}</td>
                    <td class="currency">₹ ${g(he)}</td>
                    <td class="currency">₹ ${g(ge)}</td>
                    <td class="currency"><strong>₹ ${g(st)}</strong></td>
                </tr>
              `}).join(""):'<tr><td colspan="11" style="text-align: center; color: #666; font-style: italic; padding: 20px;">No line items found</td></tr>'}
        </tbody>
    </table>

    <div class="total-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; margin-right: 30px;">
                <h4 style="color: #0066cc; margin-bottom: 10px; font-size: 14px;">ORDER SUMMARY</h4>
                <div style="font-size: 11px; color: #666;">
                    <div style="margin-bottom: 5px;">Total Items: ${e.lines?.length||0}</div>
                    <div style="margin-bottom: 5px;">Total Quantity: ${e.lines?.reduce((o,x)=>o+l(x.quantity),0)||0}</div>
                    <div>Payment Terms: ${e.paymentMethod||"Cash"}</div>
                </div>
            </div>
            
            <div style="min-width: 250px;">
                <div class="total-row">
                    <span class="total-label">Net Value:</span>
                    <span class="currency">₹ ${g(e.netValue)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">CGST Amount:</span>
                    <span class="currency">₹ ${g(e.cgstAmount)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">SGST Amount:</span>
                    <span class="currency">₹ ${g(e.sgstAmount)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">IGST Amount:</span>
                    <span class="currency">₹ ${g(e.igstAmount)}</span>
                </div>
                <div class="total-row total-amount">
                    <span>GRAND TOTAL:</span>
                    <span class="currency">₹ ${g(e.totalAmount)}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        ${e.description?`
            <div class="description-section">
                <h4 style="color: #0066cc; margin-bottom: 8px;">ORDER DESCRIPTION</h4>
                <p style="margin: 0; color: #555;">${e.description}</p>
            </div>
        `:""}
        
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
            <h4 style="color: #0066cc; margin-bottom: 8px;">TERMS & CONDITIONS</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li>All prices are inclusive of applicable taxes unless otherwise specified</li>
                <li>Payment to be made as per agreed terms</li>
                <li>Goods to be inspected upon delivery</li>
                <li>Subject to local jurisdiction only</li>
            </ul>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Vendor Signature</strong>
                </div>
            </div>
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Authorized Signature</strong>
                </div>
            </div>
        </div>
        
        <div class="generated-info">
            <p>This is a computer generated document | Generated on: ${new Date().toLocaleString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
        </div>
    </div>
</body>
</html>`},Xe=e=>{const t=We(e),r=new Blob([t],{type:"text/html"}),n=URL.createObjectURL(r),s=document.createElement("a");s.href=n,s.download=`Purchase_Order_${e.id}.html`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)},E=Ue(),Y=e=>S.find(t=>t.id===e.vendorId),Ze=e=>e?.vendorCode||e?.vendor_code||"",le=()=>{L(!1),H()},ce=()=>{G(!1),z(null)},et=e=>t=>Q({target:{name:e,value:t}}),tt=[{key:"order_number",header:"Order number",sortable:!0,accessor:e=>e.order_number,render:e=>a.jsx("span",{className:"font-medium text-ink",children:e})},{key:"orderDate",header:"Date",sortable:!0,accessor:e=>e.orderDate,render:e=>we(e)},{key:"vendor",header:"Vendor",sortable:!0,accessor:e=>Y(e)?.name||"—",render:(e,t)=>a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"block",children:e}),a.jsx("span",{className:"block text-caption text-ink-subtle",children:Ze(Y(t))})]})},{key:"totalAmount",header:"Total amount",sortable:!0,align:"right",accessor:e=>l(e.totalAmount),render:e=>a.jsx("span",{className:"font-medium tabular-nums",children:m(e)})},{key:"paymentMethod",header:"Payment",accessor:e=>e.paymentMethod||"Cash",render:e=>a.jsx(ht,{tone:"neutral",icon:mt,children:e})},{key:"status",header:"Status",sortable:!0,accessor:e=>$(e),render:e=>a.jsx(ye,{status:e,domain:"purchaseOrder"})}],at=e=>{const t=_e===e.id,r=[{key:"view",label:"View details",icon:it,onClick:()=>Ge(e)}];return de(e)&&r.push({key:"edit",label:"Edit",icon:St,disabled:t,onClick:()=>ze(e.id)}),Ke(e)&&r.push({key:"confirm",label:"Confirm order",icon:dt,disabled:t,onClick:()=>Qe(e.id)}),Je(e)&&r.push({key:"cancel",label:"Cancel order",icon:lt,disabled:t,onClick:()=>Ye(e.id)}),de(e)&&r.push({key:"sep",divider:!0},{key:"delete",label:"Delete",icon:Ce,danger:!0,disabled:t,onClick:()=>He(e.id)}),r},_=i?Y(i):null,pe=(i?.lines||[]).map((e,t)=>{const r=D.find(o=>o.id===e.productId),n=M.find(o=>o.id===e.batchId),s=l(e.lineNetValue),c=r?s*l(r.cgst)/100:0,b=r?s*l(r.sgst)/100:0,y=r?s*l(r.igst)/100:0;return{id:e.id??t,product:r?.name||e.product?.name||"N/A",description:r?.description,batch:n?.batch_no||n?.batch_number||e.batch?.batch_no||"N/A",material:e.material_code||e.material||"N/A",quantity:l(e.quantity),received:e.receivedQuantity??0,remaining:e.remainingQuantity??e.quantity,price:e.pricePerUnit,netValue:s,cgst:c,sgst:b,igst:y,total:s+c+b+y}}),rt=[{key:"product",header:"Product",render:e=>a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"block font-medium",children:e.product}),e.description?a.jsx("span",{className:"block text-caption text-ink-subtle",children:e.description}):null]})},{key:"batch",header:"Batch"},{key:"material",header:"Material"},{key:"quantity",header:"Qty",align:"right",render:e=>ee(e.quantity)},{key:"received",header:"Received",align:"right",render:e=>a.jsx("span",{className:"text-success-700",children:ee(e.received)})},{key:"remaining",header:"Remaining",align:"right",render:e=>a.jsx("span",{className:"font-medium text-warning-700",children:ee(e.remaining)})},{key:"price",header:"Price/unit",align:"right",render:e=>m(e.price)},{key:"netValue",header:"Net value",align:"right",render:e=>m(e.netValue)},{key:"cgst",header:"CGST",align:"right",render:e=>m(e.cgst)},{key:"sgst",header:"SGST",align:"right",render:e=>m(e.sgst)},{key:"igst",header:"IGST",align:"right",render:e=>m(e.igst)},{key:"total",header:"Total",align:"right",render:e=>a.jsx("span",{className:"font-medium",children:m(e.total)})}];return a.jsxs("div",{children:[a.jsx(gt,{title:"Purchase Orders",description:"Create purchase orders — each one goes to your administrator automatically.",actions:a.jsx(O,{leftIcon:Ae,onClick:()=>{H(),L(!0)},children:"Create new order"})}),ne?a.jsx(fe,{tone:"success",className:"mb-4",onClose:()=>P(""),children:ne}):null,a.jsx(W,{children:a.jsx(yt,{bare:!0,rowKey:"id",caption:"Purchase orders",columns:tt,data:Oe,loading:De,searchable:!0,searchPlaceholder:"Search order number, status",rowActions:at,responsive:"cards",cardTitleKey:"order_number",emptyIcon:ct,emptyTitle:"No purchase orders found",emptyDescription:"Create your first purchase order to see it here."})}),a.jsx(ot,{open:ke,onClose:le,size:"xl",title:A?"Edit purchase order":"Create purchase order",description:"Order details and the items you want to order.",footer:a.jsxs(a.Fragment,{children:[a.jsx(O,{variant:"secondary",onClick:le,children:"Cancel"}),a.jsx(O,{type:"submit",form:"po-form",loading:Ee,children:A?"Update order":"Create order"})]}),children:a.jsxs("form",{id:"po-form",onSubmit:Fe,noValidate:!0,className:"space-y-4",children:[N.submit?a.jsx(fe,{tone:"error",title:"Unable to save the order",children:N.submit}):null,a.jsxs(W,{children:[a.jsx(ve,{title:"Order details"}),a.jsxs(be,{className:"space-y-4",children:[a.jsxs("div",{className:"grid gap-4 md:grid-cols-3",children:[a.jsx(pt,{label:"Order date",required:!0,value:u.orderDate,onChange:et("orderDate"),error:N.orderDate}),a.jsx(Z,{label:"Payment method",name:"paymentMethod",value:u.paymentMethod,onChange:Q,options:[{value:"cash",label:"Cash"},{value:"credit",label:"Credit"},{value:"bank_transfer",label:"Bank transfer"},{value:"cheque",label:"Cheque"}]})]}),a.jsx("div",{className:"rounded-card border border-line bg-surface-muted p-4 text-body text-ink-muted",children:A&&j?a.jsxs(a.Fragment,{children:["Older order for vendor ",a.jsx("span",{className:"font-medium text-ink",children:j.name}),". New orders don’t need a vendor."]}):"No vendor is needed. When you create this order it goes to your administrator automatically."}),a.jsx(ut,{label:"Description",name:"description",value:u.description,onChange:Q,rows:2,placeholder:"Additional notes or instructions…"})]})]}),a.jsxs(W,{children:[a.jsx(ve,{title:"Order items",subtitle:"Pick a product and batch; GST is worked out from the product's tax rates.",actions:a.jsx(O,{size:"sm",variant:"secondary",leftIcon:Ae,onClick:Me,children:"Add item"})}),a.jsx(be,{className:"space-y-4",children:u.lines.map((e,t)=>{const r=ie(e),n=Le(e.productId);return a.jsxs("fieldset",{className:"rounded-card border border-line p-4",children:[a.jsxs("legend",{className:"px-1 text-caption font-medium text-ink-subtle",children:["Item ",t+1]}),a.jsxs("div",{className:"grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1.5fr_1.5fr_7rem_8rem_auto]",children:[a.jsx(Z,{label:"Product",required:!0,value:e.productId,onChange:s=>F(t,"productId",s.target.value),placeholder:"Select product",options:D.map(s=>({value:s.id,label:s.name})),error:N[`lines.${t}.productId`]}),a.jsx(Z,{label:"Batch",value:e.batchId,onChange:s=>F(t,"batchId",s.target.value),placeholder:"Select batch",disabled:!e.productId,options:n.map(s=>({value:s.id,label:s.batch_no||s.batch_number||String(s.id)}))}),a.jsx(J,{label:"Material",value:e.material,readOnly:!0,placeholder:"Auto-filled"}),a.jsx(J,{label:"Quantity",required:!0,type:"number",min:"1",value:e.quantity,onChange:s=>F(t,"quantity",s.target.value),error:N[`lines.${t}.quantity`]}),a.jsx(J,{label:"Price / unit",type:"number",step:"0.01",min:"0",value:e.pricePerUnit,onChange:s=>F(t,"pricePerUnit",s.target.value)}),a.jsx("div",{className:"flex items-end",children:a.jsx(nt,{icon:Ce,label:`Remove item ${t+1}`,variant:"danger",onClick:()=>qe(t),disabled:u.lines.length===1})})]}),a.jsx(wt,{items:[["Net",m(r.netValue)],["CGST",m(r.cgst)],["SGST",m(r.sgst)],["IGST",m(r.igst)],["Total",m(r.total),!0]]})]},t)})})]}),a.jsx("div",{className:"flex justify-end",children:a.jsx(Ie,{className:"w-full sm:max-w-sm",rows:[["Net value",E.netValue],["CGST",E.cgst],["SGST",E.sgst],["IGST",E.igst]],grand:["Grand total",E.total]})})]})}),a.jsx(ft,{open:$e&&!!i,onClose:ce,size:"lg",title:i?`Purchase order ${i.order_number||`#${i.id}`}`:"Purchase order",description:_?.name||void 0,footer:i?a.jsxs(a.Fragment,{children:[a.jsx(O,{variant:"secondary",leftIcon:It,onClick:()=>Xe(i),children:"Download HTML"}),a.jsx(O,{variant:"ghost",onClick:ce,children:"Close"})]}):void 0,children:i?a.jsxs("div",{className:"space-y-6",children:[i.vendorId?a.jsxs("section",{"aria-labelledby":"po-vendor",children:[a.jsx(X,{as:"h3",title:a.jsx("span",{id:"po-vendor",children:"Vendor information"})}),a.jsx(xe,{items:[{label:"Vendor name",value:_?.name},{label:"Vendor code",value:_?.vendor_code},{label:"Email",value:_?.email},{label:"Phone",value:_?.phone}]}),i.vendorAddresses&&i.vendorAddresses.length>0?a.jsxs("div",{className:"mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2",children:[a.jsx(Se,{title:"Bill to address",address:i.vendorAddresses.find(e=>e.type==="bill_to_party"||e.type==="sold_to_party")}),a.jsx(Se,{title:"Ship to address",address:i.vendorAddresses.find(e=>e.type==="ship_to_party"),fallback:"Same as billing address"})]}):null]}):a.jsx("p",{className:"rounded-card border border-line bg-surface-muted p-4 text-body text-ink-muted",children:"This order was sent to your administrator. It has no vendor."}),a.jsxs("section",{"aria-labelledby":"po-details",children:[a.jsx(X,{as:"h3",title:a.jsx("span",{id:"po-details",children:"Order details"})}),a.jsx(xe,{items:[{label:"Order date",value:we(i.orderDate)},{label:"Payment method",value:i.paymentMethod||"Cash"},{label:"Status",value:a.jsx(ye,{status:$(i),domain:"purchaseOrder"})},{label:"Description",value:i.description}]})]}),a.jsxs("section",{"aria-labelledby":"po-items",children:[a.jsx(X,{as:"h3",title:a.jsx("span",{id:"po-items",children:"Order items"})}),pe.length>0?a.jsx(xt,{caption:"Purchase order items",columns:rt,rows:pe}):a.jsx("p",{className:"rounded-card border border-line px-4 py-6 text-center text-body text-ink-muted",children:"No items found"}),a.jsx("div",{className:"mt-4 flex justify-end",children:a.jsx(Ie,{className:"w-full sm:max-w-sm",rows:[["Net value",l(i.netValue)],["CGST",l(i.cgstAmount)],["SGST",l(i.sgstAmount)],["IGST",l(i.igstAmount)]],grand:["Grand total",l(i.totalAmount)]})})]})]}):null})]})}export{Jt as default};
