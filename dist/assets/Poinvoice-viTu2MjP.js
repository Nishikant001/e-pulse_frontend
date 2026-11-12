import{r as c,j as e,B as A,E as ne}from"./index-BEKakvfd.js";import{F as G,P as ie,w as oe,b as K}from"./PrivateApp-rsFxxz4c.js";import{B as w}from"./Badge-BPorQ-ic.js";import{P as S,C as v,a as x,b as f}from"./PageHeader-Bpw5Oh7n.js";import{F as le,S as de}from"./filters-DD4T2Y6R.js";import{K as P}from"./KpiCard-ZabUFi3g.js";import{S as M}from"./Select-DI9NtdOy.js";import{S as H}from"./StatusBadge-DvLiKZAN.js";import{u as ce}from"./useConfirm-C2UgUOaG.js";import{u as me}from"./useToast-NpA0h-Gf.js";import{D as ue}from"./DataTable-mvSMOaX2.js";import{D as Q}from"./DetailTable-DdjQm1zG.js";import{I as k}from"./InfoGrid-Ct6B9IBu.js";import{b as $,c as m,f as b}from"./format-W420N1b6.js";import{T as z}from"./DocParts-DG8Mp2-Y.js";import{a as h}from"./authFetch-q5443eLA.js";import{I as pe}from"./indian-rupee-D1brtAu9.js";import{D as J}from"./download-e1ZrxGP9.js";import{A as ve}from"./arrow-left-DUb2qfaS.js";import"./Skeleton-Cx1cDV2l.js";import"./arrow-down-gq7z1Ca8.js";const D={invoice:{getAll(){return h("/po-invoice")},getById(o){return h(`/po-invoice/${o}`)},create(o){return h("/po-invoice",{method:"POST",body:JSON.stringify(o)})},post(o){return h(`/po-invoice/${o}/post`,{method:"POST"})},cancel(o){return h(`/po-invoice/${o}/cancel`,{method:"POST"})}},delivery:{getAll(){return h("/po-delivery")}}},Ve=()=>{const o=me();ce();const[g,N]=c.useState("list"),[u,Y]=c.useState([]),[y,W]=c.useState([]),[d,C]=c.useState(null),[i,F]=c.useState(null),[R,p]=c.useState(!1),[j,O]=c.useState(""),[l,I]=c.useState({invoiceDate:new Date().toISOString().split("T")[0],deliveryId:"",paymentTerms:"Net 30"}),V=t=>({netValue:Number(t?.netValue||0),cgstAmount:Number(t?.cgstAmount||0),sgstAmount:Number(t?.sgstAmount||0),igstAmount:Number(t?.igstAmount||0),totalAmount:Number(t?.totalAmount||0)}),X=t=>!t||!t.lines?{totalAmount:0}:{totalAmount:t.lines.reduce((a,r)=>{const s=Number(r.pricePerUnit)||0,T=r.quantityReceived||0;return a+s*T},0)},L=async()=>{p(!0);try{const t=await D.invoice.getAll();Y(Array.isArray(t)?t:[])}catch(t){console.error("Error fetching invoices:",t)}p(!1)},Z=async()=>{try{const[t,n]=await Promise.all([D.delivery.getAll(),D.invoice.getAll()]),a=new Set(n.map(s=>s.deliveryId)),r=t.filter(s=>s.status==="Received"&&!a.has(s.id));W(r)}catch(t){console.error("Error fetching deliveries:",t)}};c.useEffect(()=>{L()},[]),c.useEffect(()=>{g==="create"&&Z()},[g]);const ee=t=>{const n=y.find(a=>a.id===parseInt(t));n&&(C(n),I({invoiceDate:l.invoiceDate,deliveryId:t,paymentTerms:l.paymentTerms}))},te=async t=>{if(t.preventDefault(),!l.deliveryId){o.error("Please select a delivery",{title:"Invoice not created"});return}p(!0);const n={deliveryId:parseInt(l.deliveryId),paymentTerms:l.paymentTerms};try{await D.invoice.create(n),o.success("Invoice created as a DRAFT. Post it from the invoice list to finalise accounting."),N("list"),L(),U()}catch(a){o.error(a.message,{title:"Unable to create the invoice"})}p(!1)},B=async t=>{p(!0);try{const n=await D.invoice.getById(t);F(n),N("detail")}catch(n){console.error("Error fetching invoice:",n)}finally{p(!1)}},E=t=>{const n=ae(t),a=new Blob([n],{type:"text/html"}),r=URL.createObjectURL(a),s=document.createElement("a");s.href=r,s.download=`Purchase_Invoice_${t.id}_${new Date().getTime()}.html`,s.click(),URL.revokeObjectURL(r)},ae=t=>{const n=t.lines?.length?t.lines:t.delivery?.lines||[],a=V(t),r=n.map(s=>{const T=s.lineTotal!=null?Number(s.lineTotal):(s.quantityReceived||s.quantity||0)*(s.pricePerUnit||0);return`
      <tr>
        <td>${s.product?.material_code||s.material_code||"N/A"}</td>
        <td>${s.product?.name||"N/A"}</td>
        <td style="text-align: right;">${s.quantity||s.quantityReceived||0}</td>
        <td style="text-align: right;">₹${Number(s.pricePerUnit||0).toFixed(2)}</td>
        <td style="text-align: right;">₹${T.toFixed(2)}</td>
      </tr>
    `}).join("");return`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice ${t.invoice_number||t.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .totals-section { margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row.final { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
          .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PURCHASE INVOICE</h1>
          <p><strong>Invoice #:</strong> ${t.invoice_number||t.id}</p>
          <p><strong>Status:</strong> ${t.status||"DRAFT"}</p>
          <p><strong>Date:</strong> ${new Date(t.invoiceDate).toLocaleDateString("en-GB")}</p>
        </div>
        
        <div class="info-grid">
          <div>
            <h3>Vendor Information</h3>
            <p><strong>Vendor:</strong> ${t.vendor?.name||"N/A"}</p>
            <p><strong>Delivery ID:</strong> PD-${t.deliveryId}</p>
            <p><strong>Order ID:</strong> PO-${t.delivery?.orderId||"N/A"}</p>
          </div>
          <div>
            <h3>Payment Information</h3>
            <p><strong>Payment Terms:</strong> ${t.paymentTerms}</p>
            <p><strong>Due Date:</strong> ${t.dueDate?new Date(t.dueDate).toLocaleDateString("en-GB"):"N/A"}</p>
            <p><strong>Outstanding:</strong> ₹${Number(t.outstandingAmount||0).toFixed(2)}</p>
          </div>
        </div>
        
        <div class="section-title">Invoice Line Items</div>
        <table>
          <thead>
            <tr>
              <th>Material Code</th>
              <th>Product</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${r||'<tr><td colspan="5" style="text-align: center;">No line items available</td></tr>'}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-row">
            <span>Taxable Value:</span>
            <span><strong>₹${a.netValue.toFixed(2)}</strong></span>
          </div>
          <div class="total-row">
            <span>CGST:</span>
            <span>₹${a.cgstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST:</span>
            <span>₹${a.sgstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>IGST:</span>
            <span>₹${a.igstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${a.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
          <p>Generated on ${new Date().toLocaleString("en-GB")}</p>
        </div>
      </body>
      </html>
    `},U=()=>{I({invoiceDate:new Date().toISOString().split("T")[0],deliveryId:"",paymentTerms:"Net 30"}),C(null)},re=u.filter(t=>t.id?.toString().includes(j)||t.vendor?.name?.toLowerCase().includes(j.toLowerCase())),se=()=>{N("list"),F(null),U()},_=e.jsx(A,{variant:"secondary",leftIcon:ve,onClick:se,children:"Back to invoices"}),q=t=>t.invoice_number||`PI-${t.id}`;if(g==="list"){const t=u.reduce((r,s)=>r+parseFloat(s.totalAmount||0),0),n=[{key:"invoice",header:"Invoice ID",sortable:!0,accessor:r=>q(r),render:(r,s)=>e.jsx("button",{type:"button",onClick:()=>B(s.id),className:"font-medium text-brand-700 underline-offset-2 hover:underline",children:r})},{key:"invoiceDate",header:"Date",sortable:!0,accessor:r=>r.invoiceDate,render:r=>b(r)},{key:"vendor",header:"Vendor",sortable:!0,accessor:r=>r.vendor?.name||"N/A"},{key:"deliveryId",header:"Delivery ID",accessor:r=>`PD-${r.deliveryId}`},{key:"paymentTerms",header:"Payment terms",accessor:r=>r.paymentTerms,render:r=>r?e.jsx(w,{tone:"neutral",children:r}):e.jsx("span",{className:"text-ink-subtle",children:"—"})},{key:"status",header:"Status",sortable:!0,accessor:r=>r.status||"DRAFT",render:r=>e.jsx(H,{status:r,domain:"invoice"})},{key:"totalAmount",header:"Total amount",sortable:!0,align:"right",accessor:r=>parseFloat(r.totalAmount||0),render:r=>e.jsx("span",{className:"font-medium tabular-nums",children:m(r)})}],a=r=>[{key:"view",label:"View details",icon:ne,onClick:()=>B(r.id)},{key:"download",label:"Download",icon:J,onClick:()=>E(r)}];return e.jsxs("div",{children:[e.jsx(S,{title:"Purchase Invoices",description:"Invoices issued by your administrator for goods delivered against your purchase orders. View only."}),e.jsxs("div",{className:"mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3",children:[e.jsx(P,{title:"Total invoices",icon:G,status:"brand",value:$(u.length),comparison:"all purchase invoices"}),e.jsx(P,{title:"Total purchase value",icon:pe,status:"info",value:m(t),comparison:"across all invoices"}),e.jsx(P,{title:"Average invoice value",icon:ie,status:"success",value:m(u.length>0?t/u.length:0),comparison:"per invoice"})]}),e.jsx(le,{className:"mb-4",activeCount:j?1:0,onReset:()=>O(""),children:e.jsx(de,{label:"Search",value:j,onChange:O,placeholder:"Invoice ID or vendor name"})}),e.jsx(v,{children:e.jsx(ue,{bare:!0,rowKey:"id",caption:"Purchase invoices",columns:n,data:re,loading:R&&u.length===0,rowActions:a,responsive:"cards",cardTitleKey:"invoice",emptyIcon:G,emptyTitle:"No invoices found",emptyDescription:"Create your first invoice from a delivered purchase order."})})]})}if(g==="create"){const t=d?X(d):null,n=[{key:"product",header:"Product",render:a=>e.jsx("span",{className:"font-medium",children:a.product?.name||"N/A"})},{key:"material",header:"Material code",render:a=>a.material_code||"N/A"},{key:"qty",header:"Qty",align:"right",render:a=>$(a.quantityReceived||0)},{key:"cost",header:"Cost",align:"right",render:a=>m(a.pricePerUnit)},{key:"total",header:"Total",align:"right",render:a=>e.jsx("span",{className:"font-medium",children:m((a.quantityReceived||0)*(Number(a.pricePerUnit)||0))})}];return e.jsxs("div",{children:[e.jsx(S,{title:"Create purchase invoice",description:"Select a received purchase delivery to generate its invoice.",actions:e.jsxs(e.Fragment,{children:[_,e.jsx(A,{type:"submit",form:"pi-form",loading:R,disabled:!l.deliveryId||y.length===0,children:"Create invoice"})]})}),e.jsxs("form",{id:"pi-form",onSubmit:te,className:"space-y-4",children:[e.jsxs(v,{children:[e.jsx(x,{title:"Invoice details"}),e.jsxs(f,{children:[e.jsxs("div",{className:"grid gap-4 md:grid-cols-2 xl:grid-cols-3",children:[e.jsx(oe,{label:"Invoice date",required:!0,value:l.invoiceDate,onChange:a=>I({...l,invoiceDate:a})}),y.length===0?null:e.jsx(M,{label:"Received purchase delivery",required:!0,value:l.deliveryId,onChange:a=>ee(a.target.value),placeholder:"Select delivery",options:y.map(a=>({value:a.id,label:`PD-${a.id} | ${a.vendor?.name||"N/A"} | ${b(a.deliveryDate)}`}))}),e.jsx(M,{label:"Payment terms",value:l.paymentTerms,onChange:a=>I({...l,paymentTerms:a.target.value}),options:[{value:"Net 30",label:"Net 30 days"},{value:"Net 15",label:"Net 15 days"},{value:"Net 60",label:"Net 60 days"},{value:"Due on Receipt",label:"Due on receipt"},{value:"Cash on Delivery",label:"Cash on delivery"}]})]}),y.length===0?e.jsx(K,{tone:"warning",title:"No received deliveries available",className:"mt-4",children:"Only purchase deliveries marked as received (and not yet invoiced) can be invoiced. Make sure the delivery has been received first."}):null]})]}),d&&t?e.jsxs(v,{children:[e.jsx(x,{title:"Delivery details",subtitle:"Review the received items before creating the invoice."}),e.jsxs(f,{className:"space-y-4",children:[e.jsx(k,{columns:"sm:grid-cols-2 lg:grid-cols-4",items:[{label:"Vendor",value:d.vendor?.name},{label:"Delivery date",value:b(d.deliveryDate)},{label:"Order ID",value:`PO-${d.orderId}`},{label:"Status",value:e.jsx(w,{tone:"success",children:d.status})}]}),d.lines&&d.lines.length>0?e.jsx(Q,{caption:"Delivery line items",columns:n,rows:d.lines,rowKey:"__none"}):null,e.jsx(K,{tone:"info",children:"Estimated total — the backend recalculates the authoritative amount (including tax) when the invoice is created."}),e.jsx("div",{className:"flex justify-end",children:e.jsx(z,{className:"w-full sm:max-w-sm",rows:[],grand:["Total invoice amount",t.totalAmount]})})]})]}):null]})]})}if(g==="detail"&&i){const t=V(i),n=[{key:"material",header:"Material code",render:a=>a.product?.material_code||"N/A"},{key:"product",header:"Product",render:a=>e.jsx("span",{className:"font-medium",children:a.product?.name||"N/A"})},{key:"quantity",header:"Quantity",align:"right",render:a=>$(a.quantity||0)},{key:"price",header:"Unit price",align:"right",render:a=>m(a.pricePerUnit)},{key:"lineTotal",header:"Line total",align:"right",render:a=>e.jsx("span",{className:"font-medium",children:m(a.lineTotal)})}];return e.jsxs("div",{children:[e.jsx(S,{title:`Purchase invoice ${q(i)}`,description:"Invoice details, line items and totals.",meta:e.jsx(H,{status:i.status||"DRAFT",domain:"invoice"}),actions:e.jsxs(e.Fragment,{children:[_,e.jsx(A,{variant:"secondary",leftIcon:J,onClick:()=>E(i),children:"Download"})]})}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"grid gap-4 lg:grid-cols-2",children:[e.jsxs(v,{children:[e.jsx(x,{title:"Vendor information"}),e.jsx(f,{children:e.jsx(k,{columns:"sm:grid-cols-2",items:[{label:"Vendor name",value:i.vendor?.name},{label:"Delivery ID",value:`PD-${i.deliveryId}`},{label:"Purchase order ID",value:`PO-${i.delivery?.orderId||"N/A"}`}]})})]}),e.jsxs(v,{children:[e.jsx(x,{title:"Invoice information"}),e.jsx(f,{children:e.jsx(k,{columns:"sm:grid-cols-2",items:[{label:"Invoice date",value:b(i.invoiceDate)},{label:"Delivery date",value:b(i.delivery?.deliveryDate)},{label:"Payment terms",value:i.paymentTerms?e.jsx(w,{tone:"neutral",children:i.paymentTerms}):null}]})})]})]}),e.jsxs(v,{children:[e.jsx(x,{title:"Invoice line items"}),e.jsxs(f,{className:"space-y-4",children:[i.lines&&i.lines.length>0?e.jsx(Q,{caption:"Invoice line items",columns:n,rows:i.lines,rowKey:"__none"}):e.jsx("p",{className:"text-body text-ink-muted",children:"No line items available."}),e.jsx("div",{className:"flex justify-end",children:e.jsx(z,{className:"w-full sm:max-w-sm",rows:[["Taxable value",t.netValue],["CGST",t.cgstAmount],["SGST",t.sgstAmount],["IGST",t.igstAmount],["Outstanding",Number(i.outstandingAmount||0)]],grand:["Total invoice amount",t.totalAmount]})})]})]})]})]})}return null};export{Ve as default};
