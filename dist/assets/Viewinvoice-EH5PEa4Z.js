import{r as l,A as N,j as t,E as ie,B as g,M as ae}from"./index-BEKakvfd.js";import{e as s}from"./escapeHtml-DqpNAFMJ.js";import{P as U,C as M}from"./PageHeader-Bpw5Oh7n.js";import{E as se,F as K,I as k,w as oe,T as S}from"./PrivateApp-rsFxxz4c.js";import{D as le}from"./Drawer-8UV1F69b.js";import{F as ne,S as re}from"./filters-DD4T2Y6R.js";import{K as de}from"./KpiCard-ZabUFi3g.js";import{S as p}from"./SectionHeader-g8Qaa3fR.js";import{u as ce}from"./useConfirm-C2UgUOaG.js";import{u as me}from"./useToast-NpA0h-Gf.js";import{D as ue}from"./DataTable-mvSMOaX2.js";import{D as pe}from"./DetailTable-DdjQm1zG.js";import{I as f}from"./InfoGrid-Ct6B9IBu.js";import{b as _,c as x}from"./format-W420N1b6.js";import{D as q}from"./download-e1ZrxGP9.js";import{P as ve}from"./pencil-DdUvcDq4.js";import{T as he}from"./trash-2-BagYVL_q.js";import"./Select-DI9NtdOy.js";import"./Skeleton-Cx1cDV2l.js";import"./arrow-down-gq7z1Ca8.js";const ze=()=>{const v=me(),H=ce(),[h,y]=l.useState([]),[C,I]=l.useState(!0),[T,$]=l.useState(null),[u,P]=l.useState(""),[D,A]=l.useState(null),[G,E]=l.useState(!1),[Q,b]=l.useState(!1),[n,F]=l.useState({}),[j]=l.useState(()=>localStorage.getItem("token"));l.useEffect(()=>{B()},[]);const B=async()=>{try{I(!0);const e=await fetch(`${N}/invoice`,{headers:{Authorization:`Bearer ${j}`,"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch invoices");const a=await e.json();y(a),$(null)}catch(e){$(e.message)}finally{I(!1)}},J=async e=>{if(await H({title:"Delete invoice?",message:"Are you sure you want to delete this invoice?",tone:"danger",confirmLabel:"Delete"}))try{if(!(await fetch(`${N}/invoice/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${j}`}})).ok)throw new Error("Failed to delete invoice");y(h.filter(d=>d.id!==e)),v.success("Invoice deleted successfully")}catch(a){v.error(a.message,{title:"Unable to delete the invoice"})}},W=e=>{A(e),F({paymentAmount:e.paymentAmount||"",restPaymentDueDate:e.restPaymentDueDate||"",placeOfSupply:e.placeOfSupply||"",vehicleNumber:e.vehicleNumber||"",receiverDetails:e.receiverDetails||"",consigneeBilledTo:e.consigneeBilledTo||"",consigneeShippedTo:e.consigneeShippedTo||""}),b(!0)},Y=async e=>{e.preventDefault();try{const a=await fetch(`${N}/invoice/${D.id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${j}`},body:JSON.stringify(n)});if(!a.ok)throw new Error("Failed to update invoice");const d=await a.json();y(h.map(c=>c.id===D.id?d.invoice:c)),b(!1),v.success("Invoice updated successfully")}catch(a){v.error(a.message,{title:"Unable to update the invoice"})}},z=e=>{A(e),E(!0)},L=e=>{const a=window.open("","_blank"),d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${s(e.invoiceNumber)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .header h1 { color: #2563eb; font-size: 32px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { flex: 1; }
          .info-block h3 { color: #2563eb; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
          .info-block p { margin: 5px 0; font-size: 13px; line-height: 1.6; }
          .section { margin-bottom: 25px; }
          .section-title { background: #f1f5f9; padding: 10px 15px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #2563eb; }
          .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .detail-item { padding: 10px; border-left: 3px solid #e2e8f0; }
          .detail-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .detail-value { font-size: 14px; font-weight: 600; color: #1e293b; }
          .amount { color: #16a34a; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .total-row { background: #f8fafc; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
          .print-btn { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; margin: 20px auto; display: block; font-size: 14px; }
          .print-btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
        
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice Number: ${s(e.invoiceNumber||"N/A")}</p>
        </div>

        <div class="invoice-info">
          <div class="info-block">
            <h3>Distributor Details</h3>
            <p><strong>${s(e.distributor?.name||"N/A")}</strong></p>
            <p>${s(e.distributor?.email||"")}</p>
            <p>${s(e.distributor?.phone||"")}</p>
          </div>
          <div class="info-block">
            <h3>Customer Details</h3>
            <p><strong>${s(e.customer?.name||"N/A")}</strong></p>
            <p>${s(e.customer?.email||"")}</p>
            <p>${s(e.customer?.phone||"")}</p>
          </div>
          <div class="info-block">
            <h3>Invoice Date</h3>
            <p><strong>${m(e.invoiceDate)}</strong></p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Total Amount</div>
              <div class="detail-value amount">${o(e.total)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Amount</div>
              <div class="detail-value">${o(e.paymentAmount)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Remaining Amount</div>
              <div class="detail-value">${o(e.restAmount)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Due Date</div>
              <div class="detail-value">${m(e.restPaymentDueDate)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Shipping & Supply Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Place of Supply</div>
              <div class="detail-value">${s(e.placeOfSupply||"N/A")}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Vehicle Number</div>
              <div class="detail-value">${s(e.vehicleNumber||"N/A")}</div>
            </div>
          </div>
        </div>

        ${e.consigneeBilledTo?`
        <div class="section">
          <div class="section-title">Consignee (Billed To)</div>
          <div class="detail-item">
            <div class="detail-value">${s(e.consigneeBilledTo)}</div>
          </div>
        </div>
        `:""}

        ${e.consigneeShippedTo?`
        <div class="section">
          <div class="section-title">Consignee (Shipped To)</div>
          <div class="detail-item">
            <div class="detail-value">${s(e.consigneeShippedTo)}</div>
          </div>
        </div>
        `:""}

        ${e.receiverDetails?`
        <div class="section">
          <div class="section-title">Receiver Details</div>
          <div class="detail-item">
            <div class="detail-value">${s(e.receiverDetails)}</div>
          </div>
        </div>
        `:""}

        ${e.salesOrder?.lines&&e.salesOrder.lines.length>0?`
        <div class="section">
          <div class="section-title">Order Line Items</div>
          <table>
            <thead>
              <tr>
                <th>Item/Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Net Value</th>
              </tr>
            </thead>
            <tbody>
              ${e.salesOrder.lines.map(c=>`
                <tr>
                  <td>${s(c.productId||"N/A")}</td>
                  <td style="text-align: center;">${c.quantity||0}</td>
                  <td style="text-align: right;">${o(c.unitPrice||0)}</td>
                  <td style="text-align: right;">${o(c.lineNetValue)}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total:</td>
                <td style="text-align: right;">${o(e.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `:""}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;a.document.write(d),a.document.close()},X=h.filter(e=>e.invoiceNumber?.toLowerCase().includes(u.toLowerCase())||e.customer?.name?.toLowerCase().includes(u.toLowerCase())||e.distributor?.name?.toLowerCase().includes(u.toLowerCase())),m=e=>e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"N/A",o=e=>e?`₹${parseFloat(e).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"₹0.00";if(T)return t.jsxs("div",{children:[t.jsx(U,{title:"Invoice Management",description:"View and manage all your invoices."}),t.jsx(M,{children:t.jsx(se,{title:"Error loading invoices",message:T,onRetry:B,retryLabel:"Try again"})})]});const Z=[{key:"invoiceNumber",header:"Invoice #",sortable:!0,accessor:e=>e.invoiceNumber||"N/A",render:(e,a)=>t.jsx("button",{type:"button",onClick:()=>z(a),className:"font-medium text-brand-700 underline-offset-2 hover:underline",children:e})},{key:"customer",header:"Customer",sortable:!0,accessor:e=>e.customer?.name||"N/A",render:(e,a)=>t.jsxs(t.Fragment,{children:[t.jsx("span",{className:"block",children:e}),a.customer?.email?t.jsx("span",{className:"block text-caption text-ink-subtle",children:a.customer.email}):null]})},{key:"distributor",header:"Distributor",sortable:!0,accessor:e=>e.distributor?.name||"N/A"},{key:"invoiceDate",header:"Date",sortable:!0,accessor:e=>e.invoiceDate,render:e=>m(e)},{key:"total",header:"Total",sortable:!0,align:"right",accessor:e=>Number(e.total||0),render:e=>t.jsx("span",{className:"font-medium tabular-nums",children:x(e)})},{key:"restAmount",header:"Remaining",sortable:!0,align:"right",accessor:e=>Number(e.restAmount||0),render:e=>t.jsx("span",{className:"tabular-nums text-warning-700",children:x(e)})}],ee=e=>[{key:"view",label:"View details",icon:ie,onClick:()=>z(e)},{key:"download",label:"Download PDF",icon:q,onClick:()=>L(e)},{key:"edit",label:"Edit",icon:ve,onClick:()=>W(e)},{key:"sep",divider:!0},{key:"delete",label:"Delete",icon:he,danger:!0,onClick:()=>J(e.id)}],r=e=>a=>F(d=>({...d,[e]:a})),O=()=>E(!1),i=D,R=i?.salesOrder?.lines||[],te=[{key:"product",header:"Item / product",render:e=>e.productId||"N/A"},{key:"quantity",header:"Quantity",align:"right",render:e=>_(e.quantity||0)},{key:"unitPrice",header:"Unit price",align:"right",render:e=>x(e.unitPrice||0)},{key:"net",header:"Net value",align:"right",render:e=>t.jsx("span",{className:"font-medium",children:x(e.lineNetValue)})}],V=e=>e?.name?t.jsxs(t.Fragment,{children:[e.name,e.email?t.jsx("span",{className:"block text-caption text-ink-subtle",children:e.email}):null]}):null,w=e=>e?t.jsx("span",{className:"whitespace-pre-line",children:e}):null;return t.jsxs("div",{children:[t.jsx(U,{title:"Invoice Management",description:"View and manage all your invoices."}),t.jsx("div",{className:"mb-4 max-w-xs",children:t.jsx(de,{title:"Total invoices",icon:K,status:"brand",loading:C,value:_(h.length),comparison:"all invoices"})}),t.jsx(ne,{className:"mb-4",activeCount:u?1:0,onReset:()=>P(""),children:t.jsx(re,{label:"Search",value:u,onChange:P,placeholder:"Invoice number, customer or distributor",className:"w-full sm:w-96"})}),t.jsx(M,{children:t.jsx(ue,{bare:!0,rowKey:"id",caption:"Invoices",columns:Z,data:X,loading:C,rowActions:ee,responsive:"cards",cardTitleKey:"invoiceNumber",emptyIcon:K,emptyTitle:"No invoices found",emptyDescription:"Try adjusting your search criteria."})}),t.jsx(le,{open:G&&!!i,onClose:O,size:"lg",title:i?`Invoice ${i.invoiceNumber||""}`:"Invoice",description:i?.customer?.name||void 0,footer:i?t.jsxs(t.Fragment,{children:[t.jsx(g,{variant:"secondary",leftIcon:q,onClick:()=>L(i),children:"Download PDF"}),t.jsx(g,{variant:"ghost",onClick:O,children:"Close"})]}):void 0,children:i?t.jsxs("div",{className:"space-y-6",children:[t.jsxs("section",{children:[t.jsx(p,{as:"h3",title:"Invoice information"}),t.jsx(f,{items:[{label:"Invoice number",value:i.invoiceNumber},{label:"Invoice date",value:m(i.invoiceDate)},{label:"Created at",value:m(i.createdAt)}]})]}),t.jsxs("section",{children:[t.jsx(p,{as:"h3",title:"Payment information"}),t.jsx(f,{columns:"sm:grid-cols-2",items:[{label:"Total amount",value:t.jsx("span",{className:"text-card-title font-semibold",children:o(i.total)})},{label:"Payment amount",value:o(i.paymentAmount)},{label:"Remaining amount",value:t.jsx("span",{className:"font-medium text-warning-700",children:o(i.restAmount)})},{label:"Payment due date",value:m(i.restPaymentDueDate)}]})]}),t.jsxs("section",{children:[t.jsx(p,{as:"h3",title:"Party information"}),t.jsx(f,{columns:"sm:grid-cols-2",items:[{label:"Customer",value:V(i.customer)},{label:"Distributor",value:V(i.distributor)}]})]}),t.jsxs("section",{children:[t.jsx(p,{as:"h3",title:"Shipping & supply details"}),t.jsx(f,{columns:"sm:grid-cols-2",items:[{label:"Place of supply",value:i.placeOfSupply},{label:"Vehicle number",value:i.vehicleNumber},{label:"Billed to",value:w(i.consigneeBilledTo)},{label:"Shipped to",value:w(i.consigneeShippedTo)},{label:"Receiver",value:w(i.receiverDetails)}]})]}),R.length>0?t.jsxs("section",{children:[t.jsx(p,{as:"h3",title:"Order line items"}),t.jsx(pe,{caption:"Order line items",columns:te,rows:R,rowKey:"__none"}),t.jsxs("p",{className:"mt-3 text-right text-body font-semibold text-ink",children:["Total: ",o(i.total)]})]}):null]}):null}),t.jsx(ae,{open:Q&&!!i,onClose:()=>b(!1),size:"lg",title:"Edit invoice",description:i?.invoiceNumber||void 0,footer:t.jsxs(t.Fragment,{children:[t.jsx(g,{variant:"secondary",onClick:()=>b(!1),children:"Cancel"}),t.jsx(g,{type:"submit",form:"invoice-edit-form",children:"Update invoice"})]}),children:t.jsxs("form",{id:"invoice-edit-form",onSubmit:Y,className:"space-y-4",children:[t.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[t.jsx(k,{label:"Payment amount",type:"number",step:"0.01",value:n.paymentAmount??"",onChange:e=>r("paymentAmount")(e.target.value)}),t.jsx(oe,{label:"Payment due date",value:n.restPaymentDueDate??"",onChange:r("restPaymentDueDate")}),t.jsx(k,{label:"Place of supply",value:n.placeOfSupply??"",onChange:e=>r("placeOfSupply")(e.target.value)}),t.jsx(k,{label:"Vehicle number",value:n.vehicleNumber??"",onChange:e=>r("vehicleNumber")(e.target.value)})]}),t.jsx(S,{label:"Receiver details",rows:3,value:n.receiverDetails??"",onChange:e=>r("receiverDetails")(e.target.value)}),t.jsx(S,{label:"Consignee (billed to)",rows:3,value:n.consigneeBilledTo??"",onChange:e=>r("consigneeBilledTo")(e.target.value)}),t.jsx(S,{label:"Consignee (shipped to)",rows:3,value:n.consigneeShippedTo??"",onChange:e=>r("consigneeShippedTo")(e.target.value)})]})})]})};export{ze as default};
