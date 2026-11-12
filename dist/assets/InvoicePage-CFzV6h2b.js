import{r as m,j as t,B as b,J as Y,E as he,K as ye}from"./index-BEKakvfd.js";import{F as W,P as fe,w as xe,b as X}from"./PrivateApp-rsFxxz4c.js";import{B as k}from"./Badge-BPorQ-ic.js";import{P,C as h,a as D,b as I}from"./PageHeader-Bpw5Oh7n.js";import{F as be,S as De}from"./filters-DD4T2Y6R.js";import{K as $}from"./KpiCard-ZabUFi3g.js";import{S as Z}from"./Select-DI9NtdOy.js";import{S as ee}from"./StatusBadge-DvLiKZAN.js";import{u as Ie}from"./useConfirm-C2UgUOaG.js";import{u as je}from"./useToast-NpA0h-Gf.js";import{D as Te}from"./DataTable-mvSMOaX2.js";import{D as te}from"./DetailTable-DdjQm1zG.js";import{I as F}from"./InfoGrid-Ct6B9IBu.js";import{b as R,c as v,f as j}from"./format-W420N1b6.js";import{T as ae}from"./DocParts-DG8Mp2-Y.js";import{a as g}from"./authFetch-q5443eLA.js";import{P as Ae}from"./plus-BVzZAQRI.js";import{I as Ne}from"./indian-rupee-D1brtAu9.js";import{D as se}from"./download-e1ZrxGP9.js";import{A as we}from"./arrow-left-DUb2qfaS.js";import"./Skeleton-Cx1cDV2l.js";import"./arrow-down-gq7z1Ca8.js";const u={invoice:{getAll(){return g("/sales-invoice")},getById(i){return g(`/sales-invoice/${i}`)},create(i){return g("/sales-invoice",{method:"POST",body:JSON.stringify(i)})},post(i){return g(`/sales-invoice/${i}/post`,{method:"POST"})},cancel(i){return g(`/sales-invoice/${i}/cancel`,{method:"POST"})}},delivery:{getAll(){return g("/sales-delivery")}},salesOrder:{getById(i){return g(`/salesorder/${i}`)}}},Ye=()=>{const i=je(),O=Ie(),[y,T]=m.useState("list"),[p,re]=m.useState([]),[f,ne]=m.useState([]),[l,L]=m.useState(null),[o,B]=m.useState(null),[x,d]=m.useState(!1),[A,E]=m.useState(""),[c,N]=m.useState({invoiceDate:new Date().toISOString().split("T")[0],deliveryId:"",paymentTerms:"Net 30"}),U=e=>({netValue:Number(e?.netValue||0),cgstAmount:Number(e?.cgstAmount||0),sgstAmount:Number(e?.sgstAmount||0),igstAmount:Number(e?.igstAmount||0),totalAmount:Number(e?.totalAmount||0)}),oe=e=>{if(!e||!e.lines)return{netValue:0,cgstAmount:0,sgstAmount:0,igstAmount:0,totalAmount:0};const r=e.lines.reduce((ge,J)=>ge+(J.quantityDelivered||0)*(J.pricePerUnit||0),0),a=e.orderDetails||e.order||{},s=parseFloat(a.cgst||0),n=parseFloat(a.sgst||0),S=parseFloat(a.igst||0),H=r*s/100,Q=r*n/100,z=r*S/100,ve=r+H+Q+z;return{netValue:r,cgstAmount:H,sgstAmount:Q,igstAmount:z,totalAmount:ve,cgstRate:s,sgstRate:n,igstRate:S}},w=async()=>{d(!0);try{const e=await u.invoice.getAll();re(Array.isArray(e)?e:[])}catch(e){console.error("Error fetching invoices:",e)}d(!1)},ie=async()=>{try{const e=await u.delivery.getAll(),r=new Set(p.map(s=>s.deliveryId)),a=await Promise.all(e.filter(s=>s.status==="Delivered"&&!r.has(s.id)).map(async s=>{if(s.orderId){const n=await u.salesOrder.getById(s.orderId);return{...s,orderDetails:n}}return s}));ne(a)}catch(e){console.error("Error fetching deliveries:",e)}};m.useEffect(()=>{w()},[]),m.useEffect(()=>{y==="create"&&ie()},[y]);const le=e=>{const r=f.find(a=>a.id===parseInt(e));r&&(L(r),N({invoiceDate:c.invoiceDate,deliveryId:e,paymentTerms:c.paymentTerms}))},ce=async e=>{if(e.preventDefault(),!c.deliveryId){i.error("Please select a delivery",{title:"Invoice not created"});return}d(!0);const r={deliveryId:parseInt(c.deliveryId),paymentTerms:c.paymentTerms};try{await u.invoice.create(r),i.success("Invoice created as a DRAFT. Post it from the invoice list to finalise accounting."),T("list"),w(),q()}catch(a){i.error(a.message,{title:"Unable to create the invoice"}),console.error("Request error:",a)}finally{d(!1)}},G=async e=>{if(await O({title:"Post invoice?",message:"This creates the accounting entries and makes the financial fields immutable.",confirmLabel:"Post invoice"})){d(!0);try{await u.invoice.post(e),i.success("Invoice posted successfully."),w(),o?.id===e&&C(e)}catch(r){i.error(r.message,{title:"Unable to post the invoice"}),console.error("Post invoice error:",r)}finally{d(!1)}}},de=async e=>{if(await O({title:"Cancel draft invoice?",message:"Cancel this DRAFT invoice?",tone:"danger",confirmLabel:"Cancel invoice",cancelLabel:"Keep invoice"})){d(!0);try{await u.invoice.cancel(e),i.success("Invoice cancelled."),w()}catch(r){i.error(r.message,{title:"Unable to cancel the invoice"}),console.error("Cancel invoice error:",r)}finally{d(!1)}}},C=async e=>{d(!0);try{const r=await u.invoice.getById(e);if(r.delivery?.orderId&&!r.delivery.orderDetails){const a=await u.salesOrder.getById(r.delivery.orderId);r.delivery.orderDetails=a}B(r),T("detail")}catch(r){console.error("Error fetching invoice:",r),i.error(r.message,{title:"Unable to load the invoice"})}finally{d(!1)}},V=e=>{const r=me(e),a=new Blob([r],{type:"text/html"}),s=URL.createObjectURL(a),n=document.createElement("a");n.href=s,n.download=`Invoice_${e.id}_${new Date().getTime()}.html`,n.click(),URL.revokeObjectURL(s)},me=e=>{const r=e.lines?.length?e.lines:e.delivery?.lines||[],a=U(e),s=r.map(n=>{const S=n.lineTotal!=null?Number(n.lineTotal):(n.quantityDelivered||n.quantity||0)*(n.pricePerUnit||0);return`
      <tr>
        <td>${n.product?.material_code||n.material_code||"N/A"}</td>
        <td>${n.product?.name||"N/A"}</td>
        <td style="text-align: right;">${n.quantity||n.quantityDelivered||0}</td>
        <td style="text-align: right;">₹${Number(n.pricePerUnit||0).toFixed(2)}</td>
        <td style="text-align: right;">₹${S.toFixed(2)}</td>
      </tr>
    `}).join("");return`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${e.invoice_number||e.id}</title>
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
          <h1>SALES INVOICE</h1>
          <p><strong>Invoice #:</strong> ${e.invoice_number||e.id}</p>
          <p><strong>Status:</strong> ${e.status||"DRAFT"}</p>
          <p><strong>Date:</strong> ${new Date(e.invoiceDate).toLocaleDateString("en-GB")}</p>
        </div>
        
        <div class="info-grid">
          <div>
            <h3>Billing Information</h3>
            <p><strong>Customer:</strong> ${e.customer?.name||e.delivery?.order?.customer?.name||"N/A"}</p>
            <p><strong>Delivery ID:</strong> DEL-${e.deliveryId}</p>
            <p><strong>Order ID:</strong> ORD-${e.delivery?.orderId||"N/A"}</p>
          </div>
          <div>
            <h3>Payment Information</h3>
            <p><strong>Payment Terms:</strong> ${e.paymentTerms}</p>
            <p><strong>Due Date:</strong> ${e.dueDate?new Date(e.dueDate).toLocaleDateString("en-GB"):"N/A"}</p>
            <p><strong>Outstanding:</strong> ₹${Number(e.outstandingAmount||0).toFixed(2)}</p>
          </div>
        </div>
        
        <div class="section-title">Invoice Line Items</div>
        <table>
          <thead>
            <tr>
              <th>Material Code</th>
              <th>Product</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Price per Unit</th>
              <th style="text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${s||'<tr><td colspan="5" style="text-align: center;">No line items available</td></tr>'}
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
    `},q=()=>{N({invoiceDate:new Date().toISOString().split("T")[0],deliveryId:"",paymentTerms:"Net 30"}),L(null)},ue=p.filter(e=>e.id?.toString().includes(A)||e.delivery?.order?.customer?.name?.toLowerCase().includes(A.toLowerCase())),pe=()=>{T("list"),B(null),q()},_=t.jsx(b,{variant:"secondary",leftIcon:we,onClick:pe,children:"Back to invoices"}),K=e=>e.invoice_number||`INV-${e.id}`,M=e=>e.customer?.name||e.delivery?.order?.customer?.name||"N/A";if(y==="list"){const e=p.reduce((s,n)=>s+parseFloat(n.totalAmount||0),0),r=[{key:"invoice",header:"Invoice ID",sortable:!0,accessor:s=>K(s),render:(s,n)=>t.jsx("button",{type:"button",onClick:()=>C(n.id),className:"font-medium text-brand-700 underline-offset-2 hover:underline",children:s})},{key:"invoiceDate",header:"Date",sortable:!0,accessor:s=>s.invoiceDate,render:s=>j(s)},{key:"customer",header:"Customer",sortable:!0,accessor:s=>M(s)},{key:"deliveryId",header:"Delivery ID",accessor:s=>`DEL-${s.deliveryId}`},{key:"paymentTerms",header:"Payment terms",accessor:s=>s.paymentTerms,render:s=>s?t.jsx(k,{tone:"neutral",children:s}):t.jsx("span",{className:"text-ink-subtle",children:"—"})},{key:"status",header:"Status",sortable:!0,accessor:s=>s.status||"DRAFT",render:s=>t.jsx(ee,{status:s,domain:"invoice"})},{key:"totalAmount",header:"Total amount",sortable:!0,align:"right",accessor:s=>parseFloat(s.totalAmount||0),render:s=>t.jsx("span",{className:"font-medium tabular-nums",children:v(s)})}],a=s=>{const n=[{key:"view",label:"View details",icon:he,onClick:()=>C(s.id)},{key:"download",label:"Download",icon:se,onClick:()=>V(s)}];return s.status==="DRAFT"&&n.push({key:"post",label:"Post invoice",icon:Y,disabled:x,hint:"Creates the accounting entries",onClick:()=>G(s.id)},{key:"sep",divider:!0},{key:"cancel",label:"Cancel draft",icon:ye,danger:!0,disabled:x,onClick:()=>de(s.id)}),n};return t.jsxs("div",{children:[t.jsx(P,{title:"Sales Invoices",description:"Manage and create invoices from delivered orders.",actions:t.jsx(b,{leftIcon:Ae,onClick:()=>T("create"),children:"Create invoice"})}),t.jsxs("div",{className:"mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3",children:[t.jsx($,{title:"Total invoices",icon:W,status:"brand",value:R(p.length),comparison:"all sales invoices"}),t.jsx($,{title:"Total revenue",icon:Ne,status:"success",value:v(e),comparison:"across all invoices"}),t.jsx($,{title:"Average invoice value",icon:fe,status:"info",value:v(p.length>0?e/p.length:0),comparison:"per invoice"})]}),t.jsx(be,{className:"mb-4",activeCount:A?1:0,onReset:()=>E(""),children:t.jsx(De,{label:"Search",value:A,onChange:E,placeholder:"Invoice ID or customer name"})}),t.jsx(h,{children:t.jsx(Te,{bare:!0,rowKey:"id",caption:"Sales invoices",columns:r,data:ue,loading:x&&p.length===0,rowActions:a,responsive:"cards",cardTitleKey:"invoice",emptyIcon:W,emptyTitle:"No invoices found",emptyDescription:"Create your first invoice from a delivered order."})})]})}if(y==="create"){const e=l?oe(l):null,r=[{key:"product",header:"Product",render:a=>t.jsx("span",{className:"font-medium",children:a.product?.name||"N/A"})},{key:"material",header:"Material code",render:a=>a.material_code||"N/A"},{key:"qty",header:"Qty",align:"right",render:a=>R(a.quantityDelivered||0)},{key:"price",header:"Price",align:"right",render:a=>v(a.pricePerUnit)},{key:"total",header:"Total",align:"right",render:a=>t.jsx("span",{className:"font-medium",children:v((a.quantityDelivered||0)*(a.pricePerUnit||0))})}];return t.jsxs("div",{children:[t.jsx(P,{title:"Create sales invoice",description:"Select a delivered order to generate its invoice.",actions:t.jsxs(t.Fragment,{children:[_,t.jsx(b,{type:"submit",form:"si-form",loading:x,disabled:!c.deliveryId||f.length===0,children:"Create invoice"})]})}),t.jsxs("form",{id:"si-form",onSubmit:ce,className:"space-y-4",children:[t.jsxs(h,{children:[t.jsx(D,{title:"Invoice details"}),t.jsxs(I,{children:[t.jsxs("div",{className:"grid gap-4 md:grid-cols-2 xl:grid-cols-3",children:[t.jsx(xe,{label:"Invoice date",required:!0,value:c.invoiceDate,onChange:a=>N({...c,invoiceDate:a})}),f.length===0?null:t.jsx(Z,{label:"Delivered order",required:!0,value:c.deliveryId,onChange:a=>le(a.target.value),placeholder:"Select delivery",options:f.map(a=>({value:a.id,label:`DEL-${a.id} | ${a.order?.customer?.name||a.orderDetails?.customerName||"N/A"} | ${j(a.deliveryDate)}`}))}),t.jsx(Z,{label:"Payment terms",value:c.paymentTerms,onChange:a=>N({...c,paymentTerms:a.target.value}),options:[{value:"Net 30",label:"Net 30 days"},{value:"Net 15",label:"Net 15 days"},{value:"Net 60",label:"Net 60 days"},{value:"Due on Receipt",label:"Due on receipt"},{value:"Cash on Delivery",label:"Cash on delivery"}]})]}),f.length===0?t.jsx(X,{tone:"warning",title:"No delivered orders available",className:"mt-4",children:"Only orders with a delivered status can be invoiced. Make sure the order has been marked as delivered first."}):null]})]}),l&&e?t.jsxs(h,{children:[t.jsx(D,{title:"Delivery details",subtitle:"Review the delivered items before creating the invoice."}),t.jsxs(I,{className:"space-y-4",children:[t.jsx(F,{columns:"sm:grid-cols-2 lg:grid-cols-4",items:[{label:"Customer",value:l.order?.customer?.name||l.orderDetails?.customerName},{label:"Delivery date",value:j(l.deliveryDate)},{label:"Order ID",value:`ORD-${l.orderId}`},{label:"Status",value:t.jsx(k,{tone:"success",children:l.status})}]}),l.lines&&l.lines.length>0?t.jsx(te,{caption:"Delivery line items",columns:r,rows:l.lines,rowKey:"__none"}):null,t.jsx(X,{tone:"info",children:"Estimated totals — the backend recalculates the authoritative amounts (price, tax) when the invoice is created."}),t.jsx("div",{className:"flex justify-end",children:t.jsx(ae,{className:"w-full sm:max-w-sm",rows:[["Net value",e.netValue],["CGST",e.cgstAmount],[`SGST (${e.sgstRate||0}%)`,e.sgstAmount],[`IGST (${e.igstRate||0}%)`,e.igstAmount]],grand:["Total invoice amount",e.totalAmount]})})]})]}):null]})]})}if(y==="detail"&&o){const e=U(o),r=[{key:"material",header:"Material code",render:a=>a.product?.material_code||"N/A"},{key:"product",header:"Product",render:a=>t.jsx("span",{className:"font-medium",children:a.product?.name||"N/A"})},{key:"quantity",header:"Quantity",align:"right",render:a=>R(a.quantity||0)},{key:"price",header:"Price per unit",align:"right",render:a=>v(a.pricePerUnit)},{key:"lineTotal",header:"Line total",align:"right",render:a=>t.jsx("span",{className:"font-medium",children:v(a.lineTotal)})}];return t.jsxs("div",{children:[t.jsx(P,{title:`Sales invoice ${K(o)}`,description:"Invoice details, line items and totals.",meta:t.jsx(ee,{status:o.status||"DRAFT",domain:"invoice"}),actions:t.jsxs(t.Fragment,{children:[_,t.jsx(b,{variant:"secondary",leftIcon:se,onClick:()=>V(o),children:"Download"}),o.status==="DRAFT"?t.jsx(b,{leftIcon:Y,onClick:()=>G(o.id),loading:x,children:"Post invoice"}):null]})}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"grid gap-4 lg:grid-cols-2",children:[t.jsxs(h,{children:[t.jsx(D,{title:"Invoice information"}),t.jsx(I,{children:t.jsx(F,{columns:"sm:grid-cols-2",items:[{label:"Invoice date",value:j(o.invoiceDate)},{label:"Payment terms",value:o.paymentTerms?t.jsx(k,{tone:"neutral",children:o.paymentTerms}):null},{label:"Delivery ID",value:`DEL-${o.deliveryId}`}]})})]}),t.jsxs(h,{children:[t.jsx(D,{title:"Customer information"}),t.jsx(I,{children:t.jsx(F,{columns:"sm:grid-cols-2",items:[{label:"Customer name",value:M(o)},{label:"Order ID",value:`ORD-${o.delivery?.orderId||"N/A"}`},{label:"Delivery date",value:j(o.delivery?.deliveryDate)}]})})]})]}),t.jsxs(h,{children:[t.jsx(D,{title:"Invoice line items"}),t.jsxs(I,{className:"space-y-4",children:[o.lines&&o.lines.length>0?t.jsx(te,{caption:"Invoice line items",columns:r,rows:o.lines,rowKey:"__none"}):t.jsx("p",{className:"text-body text-ink-muted",children:"No line items available."}),t.jsx("div",{className:"flex justify-end",children:t.jsx(ae,{className:"w-full sm:max-w-sm",rows:[["Taxable value",e.netValue],["CGST",e.cgstAmount],["SGST",e.sgstAmount],["IGST",e.igstAmount],["Outstanding",Number(o.outstandingAmount||0)]],grand:["Total invoice amount",e.totalAmount]})})]})]})]})]})}return null};export{Ye as default};
