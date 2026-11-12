import{r as d,j as s,B as $,S as nt,M as dt,i as ve,E as ct,J as pt,K as ut}from"./index-BEKakvfd.js";import{b as B,I as x,i as mt,w as Se}from"./PrivateApp-rsFxxz4c.js";import{P as ht,C as F,a as J,b as W}from"./PageHeader-Bpw5Oh7n.js";import{D as gt}from"./Drawer-8UV1F69b.js";import{S as X}from"./SectionHeader-g8Qaa3fR.js";import{S as V}from"./Select-DI9NtdOy.js";import{S as Ce}from"./StatusBadge-DvLiKZAN.js";import{u as bt}from"./useConfirm-C2UgUOaG.js";import{D as yt}from"./DataTable-mvSMOaX2.js";import{D as ft}from"./DetailTable-DdjQm1zG.js";import{I as z}from"./InfoGrid-Ct6B9IBu.js";import{c as m,f as Z,b as ee}from"./format-W420N1b6.js";import{L as xt,T as Ie}from"./DocParts-DG8Mp2-Y.js";import{a as h}from"./authFetch-q5443eLA.js";import{P as we}from"./plus-BVzZAQRI.js";import{T as Ne}from"./trash-2-BagYVL_q.js";import{D as je}from"./download-e1ZrxGP9.js";import{P as vt}from"./pencil-DdUvcDq4.js";import"./Skeleton-Cx1cDV2l.js";import"./arrow-down-gq7z1Ca8.js";function Gt(){const te=bt(),[se,Te]=d.useState([]),[N,Ae]=d.useState([]),[O,De]=d.useState([]),[j,Pe]=d.useState({}),[$e,Oe]=d.useState([]),[ke,M]=d.useState(!1),[Ee,ae]=d.useState(!1),[i,Re]=d.useState(null),[T,re]=d.useState(null),[qe,oe]=d.useState(!1),[Ue,A]=d.useState(null),[le,v]=d.useState(""),[L,Q]=d.useState(""),[D,k]=d.useState(null),[b,E]=d.useState([]),[Me,ie]=d.useState(!1),[c,S]=d.useState({orderDate:"",customerId:"",customerCode:"",paymentMethod:"",description:"",soldToPartyId:"",shipToPartyId:"",expectedDeliveryDate:"",billingAddress:"",shippingAddress:"",lines:[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),[y,f]=d.useState({}),[Le,ne]=d.useState(!1),[_,P]=d.useState(""),n=e=>{const t=parseFloat(e);return isNaN(t)?0:t},g=e=>n(e).toFixed(2),Y=()=>{S({orderDate:"",customerId:"",customerCode:"",paymentMethod:"",description:"",soldToPartyId:"",shipToPartyId:"",expectedDeliveryDate:"",billingAddress:"",shippingAddress:"",lines:[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),f({}),P(""),re(null),Q(""),k(null),E([])};d.useEffect(()=>{_e()},[]);const _e=async()=>{try{const[e,t,a,l]=await Promise.all([h("/customer"),h("/product"),h("/stock"),h("/stockLedger/batch").catch(()=>[])]);Te(e),Ae(t),De(a);const o={};(Array.isArray(l)?l:[]).forEach(r=>{o[r.batchId]=r}),Pe(o),R()}catch(e){console.error("Error fetching initial data",e)}},H=async e=>{if(!e.trim()){k(null),E([]);return}ie(!0);try{const t=e.trim().toLowerCase();let a=se.find(o=>(o.customer_code||o.customerCode||o.code||"").toString().toLowerCase()===t);if(!a)try{a=await h(`/customer/by-code/${encodeURIComponent(e.trim())}`)}catch(o){if(o.status!==404)throw o;a=null}if(!a){k(null),E([]),f(o=>({...o,customerCode:"Customer not found"}));return}k(a),S(o=>({...o,customerId:a.id}));const l=await h(`/customer/${a.id}/addresses?type=all`);E(l.addresses||[])}catch(t){console.error("Error fetching customer",t),k(null),E([]),f(a=>({...a,customerCode:"Error fetching customer details"}))}finally{ie(!1)}},Ge=e=>{const t=e.target.value;Q(t),f(a=>({...a,customerCode:""}))},Be=e=>{e.key==="Enter"&&(e.preventDefault(),H(L))},R=async()=>{oe(!0);try{const e=await h("/salesorder");Oe(e)}catch(e){console.error(e)}finally{oe(!1)}},Fe=()=>{S(e=>({...e,lines:[...e.lines,{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}))},Ve=e=>{c.lines.length>1&&S(t=>({...t,lines:t.lines.filter((a,l)=>l!==e)}))},G=(e,t,a)=>{const l=[...c.lines];if(t==="productId"){const o=N.find(r=>r.id===parseInt(a));l[e]={...l[e],[t]:a,pricePerUnit:o?o.price:"",batchId:"",material:""}}else if(t==="batchId"){const o=O.find(p=>p.id===parseInt(a)),r=N.find(p=>p.id===parseInt(l[e].productId));l[e]={...l[e],[t]:a,material:o?r?.material_code||o.material_code||o.material||"N/A":"",pricePerUnit:o?r?.price??l[e].pricePerUnit??"":""}}else t==="quantity"?l[e][t]=parseInt(a)||1:t==="pricePerUnit"?l[e][t]=parseFloat(a)||"":l[e][t]=a;S(o=>({...o,lines:l})),y[`lines.${e}.${t}`]&&f(o=>({...o,[`lines.${e}.${t}`]:""}))},ze=e=>e?O.filter(t=>{if(t.productId!==parseInt(e))return!1;const a=j[t.id];return a&&!a.isExpired&&!a.isOutOfStock&&a.quantity>0}):[],de=e=>{const t=N.find(w=>w.id===parseInt(e.productId)),a=n(e.pricePerUnit)||(t?n(t.price):0),l=n(e.quantity),o=a*l;if(!t)return{netValue:0,cgst:0,sgst:0,igst:0,total:0};const r=o*n(t.cgst)/100,p=o*n(t.sgst)/100,u=o*n(t.igst)/100,I=o+r+p+u;return{netValue:o,cgst:r,sgst:p,igst:u,total:I}},Qe=()=>c.lines.reduce((e,t)=>{const a=de(t);return{netValue:e.netValue+a.netValue,cgst:e.cgst+a.cgst,sgst:e.sgst+a.sgst,igst:e.igst+a.igst,total:e.total+a.total}},{netValue:0,cgst:0,sgst:0,igst:0,total:0}),Ye=e=>{Re(e),ae(!0)},He=()=>{let e={};return c.orderDate||(e.orderDate="Order date is required"),c.customerId||(e.customerId="Customer is required"),c.lines.forEach((t,a)=>{if(t.productId||(e[`lines.${a}.productId`]="Product is required"),t.batchId||(e[`lines.${a}.batchId`]="Batch is required"),(!t.quantity||t.quantity<=0)&&(e[`lines.${a}.quantity`]="Quantity must be greater than 0"),t.batchId){const l=j[parseInt(t.batchId)];l&&l.quantity<t.quantity&&(e[`lines.${a}.quantity`]=`Only ${l.quantity} units available in selected batch`)}}),f(e),Object.keys(e).length===0},C=e=>{const{name:t,value:a}=e.target;S(l=>({...l,[t]:a})),f(l=>({...l,[t]:""})),P("")},Ke=async e=>{if(e.preventDefault(),!!He()){ne(!0);try{const t={...c,lines:c.lines.map(a=>({...a,productId:Number(a.productId),batchId:a.batchId?Number(a.batchId):null,quantity:Number(a.quantity),pricePerUnit:a.pricePerUnit?Number(a.pricePerUnit):null}))};await h(T?`/salesorder/${T.id}`:"/salesorder",{method:T?"PUT":"POST",body:JSON.stringify(t)}),P(T?"Sales order updated successfully!":"Sales order created successfully!"),Y(),M(!1),R()}catch(t){console.error(t),f({submit:t.message||"Failed to save order"})}finally{ne(!1)}}},Je=async e=>{try{const t=await h(`/salesorder/${e}`);S({orderDate:t.orderDate?t.orderDate.split("T")[0]:"",customerId:t.customerId||"",customerCode:t.customerCode||"",paymentMethod:t.paymentMethod||"",description:t.description||"",soldToPartyId:t.soldToPartyId||"",shipToPartyId:t.shipToPartyId||"",expectedDeliveryDate:t.expectedDeliveryDate?t.expectedDeliveryDate.split("T")[0]:"",billingAddress:t.billingAddress||"",shippingAddress:t.shippingAddress||"",lines:t.lines?.length>0?t.lines.map(a=>({productId:a.productId?.toString()||"",batchId:a.batchId?.toString()||"",quantity:a.quantity||1,pricePerUnit:a.pricePerUnit||"",material:a.material||""})):[{productId:"",batchId:"",quantity:1,pricePerUnit:"",material:""}]}),t.customerCode&&(Q(t.customerCode),await H(t.customerCode)),re(t),M(!0)}catch(t){console.error("Error fetching order details",t)}},We=async e=>{if(await te({title:"Delete sales order?",message:"Are you sure you want to delete this order?",tone:"danger",confirmLabel:"Delete"})){A(e),v("");try{await h(`/salesorder/${e}`,{method:"DELETE"}),R()}catch(t){console.error("Error deleting order",t),v(t.message||"Failed to delete order")}finally{A(null)}}},Xe=async e=>{A(e),v("");try{await h(`/salesorder/${e}/confirm`,{method:"POST"}),P("Order confirmed successfully!"),R()}catch(t){console.error("Error confirming order",t),v(t.message||"Failed to confirm order")}finally{A(null)}},Ze=async e=>{if(await te({title:"Cancel sales order?",message:"Cancel this sales order? This cannot be undone.",tone:"danger",confirmLabel:"Cancel order",cancelLabel:"Keep order"})){A(e),v("");try{await h(`/salesorder/${e}/cancel`,{method:"POST"}),P("Order cancelled."),R()}catch(t){console.error("Error cancelling order",t),v(t.message||"Failed to cancel order")}finally{A(null)}}},q=e=>e.status||"DRAFT",ce=e=>q(e)==="DRAFT",et=e=>q(e)==="DRAFT",tt=e=>["DRAFT","CONFIRMED"].includes(q(e)),st=e=>{const t=se.find(r=>r.id===e.customerId);console.log(t);const a=t?.addresses?.find(r=>r.type==="sold_to_party"),l=t?.addresses?.find(r=>r.type==="ship_to_party"),o=r=>{if(!r)return"Not specified";const p=[r.street1,r.street2,r.street3,r.street4,r.city,r.region,r.pincode||r.postalCode,r.country].filter(Boolean);return p.length>0?p.join(", "):"Address details not available"};return console.log("Customer Addresses:",b),console.log("Sold To Address:",b.find(r=>r.type==="sold_to_party")),console.log("Ship To Address:",b.find(r=>r.type==="ship_to_party")),`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sales Order - ${e.id}</title>
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
        
        /* Customer and Address Section */
        .customer-section {
            margin-bottom: 25px;
            border: 2px solid #0066cc;
            border-radius: 8px;
            overflow: hidden;
        }
        .customer-header {
            background-color: #0066cc;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }
        .customer-content {
            display: flex;
            flex-wrap: wrap;
        }
        .customer-info-box {
            flex: 1;
            min-width: 300px;
            padding: 15px;
            border-right: 1px solid #ddd;
        }
        .customer-info-box:last-child {
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
        .customer-detail {
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
            font-weight: 600;    /* Semi-bold */
            font-weight: 700;  
        }
        
        /* Order Info Section */
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
        
        /* Items Table */
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
        
        /* Total Section */
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
        
        /* Footer */
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
        <div style="font-size: 14px; color: #666; margin: 5px 0;">Professional Sales Order Document</div>
        <div class="document-title">SALES ORDER</div>
        <div class="order-number">Order No: ${e.id}</div>
    </div>

    <!-- Enhanced Customer Information Section -->
    <div class="customer-section">
        <div class="customer-header">CUSTOMER INFORMATION & ADDRESSES</div>
        <div class="customer-content">
            <!-- Primary Customer Information -->
            <div class="customer-info-box">
                <div class="info-box-title">PRIMARY CUSTOMER DETAILS</div>
                <div class="customer-detail">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${e.customerName||t?.name||"N/A"}</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">PinCode:</span>
                    <span class="detail-value">${e.customerCode||t?.pincode||t?.pincode||"N/A"}</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">Region:</span>
                    <span class="detail-value">${e.customerCode||t?.region||t?.region||"N/A"}</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${t?.phone||t?.alternatePhone||"N/A"}</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">PostalCode:</span>
                    <span class="detail-value">${t?.postalCode||"N/A"}</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">GST No:</span>
                    <span class="detail-value">${t?.taxNumber||t?.gstNumber||"N/A"}</span>
                </div>
            </div>

            <!-- Sold To Party Address -->
            <div class="customer-info-box">
                <div class="info-box-title">SOLD TO PARTY</div>
                ${a?`
                    <div class="customer-detail">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${o(a)}</span>
                    </div>
                    <div class="customer-detail">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${a.type?.replace("_"," ")?.toUpperCase()||"BILLING"}</span>
                    </div>
                `:`
                    <div class="customer-detail">
                        <span class="detail-value" style="color: #666; font-style: italic;">
                            ${e.address||"Default billing address not specified"}
                        </span>
                    </div>
                `}
            </div>

            <!-- Ship To Party Address -->
            <div class="customer-info-box">
                <div class="info-box-title">SHIP TO PARTY</div>
                ${l?`
                    <div class="customer-detail">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${o(l)}</span>
                    </div>
                    <div class="customer-detail">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${l.type?.replace("_"," ")?.toUpperCase()||"SHIPPING"}</span>
                    </div>
                `:`
                    <div class="customer-detail">
                        <span class="detail-value" style="color: #666; font-style: italic;">
                            Same as Sold To Party address
                        </span>
                    </div>
                `}
            </div>
        </div>
    </div>

    <!-- Order Information Section -->
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

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 20%;">Product Name</th>
                <th style="width: 10%;">Batch No.</th>
                
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
            ${e.lines?.map((r,p)=>{const u=N.find(K=>K.id===r.productId),I=O.find(K=>K.id===r.batchId),w=n(r.lineNetValue),ye=u?w*n(u.cgst)/100:0,fe=u?w*n(u.sgst)/100:0,xe=u?w*n(u.igst)/100:0,it=w+ye+fe+xe;return`
                <tr>
                    <td style="text-align: center;">${p+1}</td>
                    <td>
                        <strong>${u?.name||"N/A"}</strong>
                        ${u?.description?`<br><small style="color: #666;">${u.description}</small>`:""}
                    </td>
                    <td style="text-align: center;">${I?.batch_no||"N/A"}</td>
                    
                    <td style="text-align: center;">${n(r.quantity)}</td>
                    <td class="currency">₹ ${g(r.pricePerUnit)}</td>
                    <td class="currency">₹ ${g(w)}</td>
                    <td class="currency">₹ ${g(ye)}</td>
                    <td class="currency">₹ ${g(fe)}</td>
                    <td class="currency">₹ ${g(xe)}</td>
                    <td class="currency"><strong>₹ ${g(it)}</strong></td>
                </tr>
              `}).join("")||'<tr><td colspan="11" style="text-align: center; color: #666; font-style: italic;">No line items found</td></tr>'}
        </tbody>
    </table>

    <!-- Enhanced Totals Section -->
    <div class="total-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <!-- Order Summary -->
            <div style="flex: 1; margin-right: 30px;">
                <h4 style="color: #0066cc; margin-bottom: 10px; font-size: 14px;">ORDER SUMMARY</h4>
                <div style="font-size: 11px; color: #666;">
                    <div style="margin-bottom: 5px;">Total Items: ${e.lines?.length||0}</div>
                    <div style="margin-bottom: 5px;">Total Quantity: ${e.lines?.reduce((r,p)=>r+n(p.quantity),0)||0}</div>
                    <div>Payment Terms: ${e.paymentMethod||"Cash"}</div>
                </div>
            </div>
            
            <!-- Financial Totals -->
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

    <!-- Footer Section -->
    <div class="footer">
        ${e.description?`
            <div class="description-section">
                <h4 style="color: #0066cc; margin-bottom: 8px;">ORDER DESCRIPTION</h4>
                <p style="margin: 0; color: #555;">${e.description}</p>
            </div>
        `:""}
        
        <!-- Terms and Conditions -->
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
            <h4 style="color: #0066cc; margin-bottom: 8px;">TERMS & CONDITIONS</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li>All prices are inclusive of applicable taxes unless otherwise specified</li>
                <li>Payment to be made as per agreed terms</li>
                <li>Goods once sold will not be taken back unless defective</li>
                <li>Subject to local jurisdiction only</li>
            </ul>
        </div>
        
        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Customer Signature</strong>
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
</html>`},pe=e=>{const t=st(e),a=new Blob([t],{type:"text/html"}),l=URL.createObjectURL(a),o=document.createElement("a");o.href=l,o.download=`Sales-Order-${e.id}.html`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(l)},at=()=>{Y(),M(!0)},U=Qe(),ue=()=>{M(!1),Y()},me=()=>{ae(!1)},he=e=>t=>C({target:{name:e,value:t}}),ge=e=>`${e.street}, ${e.city} - ${e.pincode}`,rt=[{key:"order_number",header:"Order number",sortable:!0,render:e=>s.jsx("span",{className:"font-medium text-ink",children:e})},{key:"orderDate",header:"Date",sortable:!0,render:e=>e?Z(e):"N/A"},{key:"customerName",header:"Customer",sortable:!0,accessor:e=>e.customerName||"N/A"},{key:"totalAmount",header:"Total amount",sortable:!0,align:"right",accessor:e=>n(e.totalAmount),render:e=>s.jsx("span",{className:"font-medium tabular-nums",children:m(e)})},{key:"paymentMethod",header:"Payment",accessor:e=>e.paymentMethod||"N/A"},{key:"status",header:"Status",sortable:!0,accessor:e=>q(e),render:e=>s.jsx(Ce,{status:e,domain:"salesOrder"})}],ot=e=>{const t=Ue===e.id,a=[{key:"view",label:"View details",icon:ct,onClick:()=>Ye(e)}];return ce(e)&&a.push({key:"edit",label:"Edit",icon:vt,disabled:t,onClick:()=>Je(e.id)}),et(e)&&a.push({key:"confirm",label:"Confirm order",icon:pt,disabled:t,onClick:()=>Xe(e.id)}),a.push({key:"download",label:"Download",icon:je,onClick:()=>pe(e)}),tt(e)&&a.push({key:"cancel",label:"Cancel order",icon:ut,disabled:t,onClick:()=>Ze(e.id)}),ce(e)&&a.push({key:"sep",divider:!0},{key:"delete",label:"Delete",icon:Ne,danger:!0,disabled:t,onClick:()=>We(e.id)}),a},be=(i?.lines||[]).map((e,t)=>{const a=N.find(I=>I.id===e.productId),l=O.find(I=>I.id===e.batchId),o=n(e.lineNetValue),r=a?o*n(a.cgst)/100:0,p=a?o*n(a.sgst)/100:0,u=a?o*n(a.igst)/100:0;return{id:e.id??t,sno:t+1,product:a?.name||"N/A",batch:l?.batch_no||l?.batch_number||"N/A",quantity:n(e.quantity),delivered:e.deliveredQuantity??0,remaining:e.remainingQuantity??e.quantity,price:e.pricePerUnit,netValue:o,cgst:r,sgst:p,igst:u,total:o+r+p+u}}),lt=[{key:"sno",header:"#",render:e=>e.sno},{key:"product",header:"Product",render:e=>s.jsx("span",{className:"font-medium",children:e.product})},{key:"batch",header:"Batch"},{key:"quantity",header:"Qty",align:"right",render:e=>ee(e.quantity)},{key:"delivered",header:"Delivered",align:"right",render:e=>s.jsx("span",{className:"text-success-700",children:ee(e.delivered)})},{key:"remaining",header:"Remaining",align:"right",render:e=>s.jsx("span",{className:"font-medium text-warning-700",children:ee(e.remaining)})},{key:"price",header:"Unit price",align:"right",render:e=>m(e.price)},{key:"netValue",header:"Net value",align:"right",render:e=>m(e.netValue)},{key:"cgst",header:"CGST",align:"right",render:e=>m(e.cgst)},{key:"sgst",header:"SGST",align:"right",render:e=>m(e.sgst)},{key:"igst",header:"IGST",align:"right",render:e=>m(e.igst)},{key:"total",header:"Total",align:"right",render:e=>s.jsx("span",{className:"font-medium",children:m(e.total)})}];return s.jsxs("div",{children:[s.jsx(ht,{title:"Sales Orders",description:"Create, confirm and track customer sales orders.",actions:s.jsx($,{leftIcon:we,onClick:at,children:"Create sales order"})}),_?s.jsx(B,{tone:"success",className:"mb-4",onClose:()=>P(""),children:_}):null,le?s.jsx(B,{tone:"error",className:"mb-4",onClose:()=>v(""),children:le}):null,s.jsx(F,{children:s.jsx(yt,{bare:!0,rowKey:"id",caption:"Sales orders",columns:rt,data:$e,loading:qe,searchable:!0,searchPlaceholder:"Search order number, customer, status",rowActions:ot,responsive:"cards",cardTitleKey:"order_number",emptyIcon:nt,emptyTitle:"No sales orders found",emptyDescription:"Create your first sales order to see it here."})}),s.jsx(dt,{open:ke,onClose:ue,size:"xl",title:T?"Edit sales order":"Create sales order",description:"Customer, addresses and the items (with batches) you want to sell.",footer:s.jsxs(s.Fragment,{children:[s.jsx($,{variant:"secondary",onClick:ue,children:"Cancel"}),s.jsx($,{type:"submit",form:"so-form",loading:Le,disabled:!D,children:T?"Update order":"Create order"})]}),children:s.jsxs("form",{id:"so-form",onSubmit:Ke,noValidate:!0,className:"space-y-4",children:[_?s.jsx(B,{tone:"success",children:_}):null,y.submit?s.jsx(B,{tone:"error",title:"Unable to save the order",children:y.submit}):null,s.jsxs(F,{children:[s.jsx(J,{title:"Customer"}),s.jsxs(W,{className:"space-y-4",children:[s.jsx(x,{label:"Customer code",required:!0,value:L,onChange:Ge,onKeyPress:Be,placeholder:"Enter customer code and press Enter",error:y.customerCode,wrapperClassName:"max-w-xl",rightSlot:s.jsx(ve,{icon:mt,label:"Search customer",size:"sm",onClick:()=>H(L),disabled:Me||!L.trim()})}),D?s.jsxs("div",{className:"rounded-card border border-line bg-surface-muted p-4",children:[s.jsx("p",{className:"mb-3 text-body font-semibold text-ink",children:"Customer information"}),s.jsx(z,{columns:"sm:grid-cols-2 lg:grid-cols-4",items:[{label:"Name",value:D.name},{label:"Code",value:D.customer_code},{label:"Phone",value:D.alternatePhone},{label:"GST",value:D.taxNumber}]}),b.length>0?s.jsxs("div",{className:"mt-4 border-t border-line pt-4",children:[s.jsx("p",{className:"mb-2 text-caption font-medium text-ink-subtle",children:"Addresses"}),s.jsx("div",{className:"grid gap-3 md:grid-cols-2",children:b.map((e,t)=>s.jsxs("div",{className:"rounded-control border border-line bg-surface p-3 text-body",children:[s.jsx("p",{className:"text-caption font-semibold text-ink-subtle",children:e.type?.replace("_"," ")?.toUpperCase()||"Address"}),e.street?s.jsx("p",{children:e.street}):null,s.jsx("p",{children:[e.city,e.state,e.pincode].filter(Boolean).join(", ")}),e.country?s.jsx("p",{children:e.country}):null]},t))})]}):null]}):null]})]}),s.jsxs(F,{children:[s.jsx(J,{title:"Order details"}),s.jsxs(W,{className:"space-y-4",children:[s.jsxs("div",{className:"grid gap-4 md:grid-cols-2 xl:grid-cols-3",children:[s.jsx(Se,{label:"Order date",required:!0,value:c.orderDate,onChange:he("orderDate"),error:y.orderDate}),s.jsx(x,{label:"Payment method",name:"paymentMethod",value:c.paymentMethod,onChange:C,placeholder:"e.g. Cash, Credit, UPI"}),s.jsx(Se,{label:"Expected delivery date",value:c.expectedDeliveryDate,onChange:he("expectedDeliveryDate")}),s.jsx(x,{label:"Description",name:"description",value:c.description,onChange:C,placeholder:"Order description"}),s.jsx(x,{label:"Billing address",name:"billingAddress",value:c.billingAddress,onChange:C,placeholder:"Override billing address (optional)"}),s.jsx(x,{label:"Shipping address",name:"shippingAddress",value:c.shippingAddress,onChange:C,placeholder:"Override shipping address (optional)"})]}),b.length>0?s.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[s.jsx(V,{label:"Sold-to party",name:"soldToPartyId",value:c.soldToPartyId,onChange:C,placeholder:"Select sold-to address",options:b.filter(e=>e.type==="sold_to_party"||e.type==="billing").map(e=>({value:e.id,label:ge(e)}))}),s.jsx(V,{label:"Ship-to party",name:"shipToPartyId",value:c.shipToPartyId,onChange:C,placeholder:"Select ship-to address",options:b.filter(e=>e.type==="ship_to_party"||e.type==="shipping").map(e=>({value:e.id,label:ge(e)}))})]}):null]})]}),s.jsxs(F,{children:[s.jsx(J,{title:"Line items",subtitle:"Pick a product and a batch; price and material fill in from the batch.",actions:s.jsx($,{size:"sm",variant:"secondary",leftIcon:we,onClick:Fe,children:"Add item"})}),s.jsx(W,{className:"space-y-4",children:c.lines.map((e,t)=>{const a=de(e),l=ze(e.productId),o=O.find(r=>r.id===parseInt(e.batchId));return s.jsxs("fieldset",{className:"rounded-card border border-line p-4",children:[s.jsxs("legend",{className:"px-1 text-caption font-medium text-ink-subtle",children:["Item ",t+1]}),s.jsxs("div",{className:"grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1.5fr_1.5fr_7rem_8rem_auto]",children:[s.jsx(V,{label:"Product",required:!0,value:e.productId,onChange:r=>G(t,"productId",r.target.value),placeholder:"Select product",options:N.map(r=>({value:r.id,label:`${r.name} (${m(r.price)})`})),error:y[`lines.${t}.productId`]}),s.jsx(V,{label:"Batch",required:!0,value:e.batchId,onChange:r=>G(t,"batchId",r.target.value),placeholder:"Select batch",disabled:!e.productId,options:l.map(r=>({value:r.id,label:`${r.batch_no||r.batchNumber||r.batch_number} (Qty: ${j[r.id]?.quantity??0})`})),error:y[`lines.${t}.batchId`]}),s.jsx(x,{label:"Material",value:e.material,readOnly:!0,disabled:!0,placeholder:"Auto-filled from batch"}),s.jsx(x,{label:"Quantity",required:!0,type:"number",min:"1",max:o?j[o.id]?.quantity:void 0,value:e.quantity,onChange:r=>G(t,"quantity",r.target.value),disabled:!e.batchId,error:y[`lines.${t}.quantity`],hint:o?`Available: ${j[o.id]?.quantity??0}`:void 0}),s.jsx(x,{label:"Unit price",type:"number",step:"0.01",value:e.pricePerUnit,onChange:r=>G(t,"pricePerUnit",r.target.value),disabled:!e.batchId,placeholder:"Auto-filled"}),s.jsx("div",{className:"flex items-end",children:c.lines.length>1?s.jsx(ve,{icon:Ne,label:`Remove item ${t+1}`,variant:"danger",onClick:()=>Ve(t)}):null})]}),o?s.jsx(z,{className:"mt-3",columns:"sm:grid-cols-2 lg:grid-cols-4",items:[{label:"Batch no.",value:o.batch_no||o.batchNumber||o.batch_number},{label:"Material",value:e.material||"N/A"},{label:"Available qty",value:j[o.id]?.quantity??0},{label:"Unit price",value:m(e.pricePerUnit||0)}]}):null,e.productId&&e.batchId?s.jsx(xt,{items:[["Net",m(a.netValue)],["CGST",m(a.cgst)],["SGST",m(a.sgst)],["IGST",m(a.igst)],["Total",m(a.total),!0]]}):null]},t)})})]}),s.jsx("div",{className:"flex justify-end",children:s.jsx(Ie,{className:"w-full sm:max-w-sm",rows:[["Net value",U.netValue],["CGST",U.cgst],["SGST",U.sgst],["IGST",U.igst]],grand:["Grand total",U.total]})})]})}),s.jsx(gt,{open:Ee&&!!i,onClose:me,size:"lg",title:i?`Sales order ${i.order_number||`#${i.id}`}`:"Sales order",description:i?.customerName||void 0,footer:i?s.jsxs(s.Fragment,{children:[s.jsx($,{variant:"secondary",leftIcon:je,onClick:()=>pe(i),children:"Download"}),s.jsx($,{variant:"ghost",onClick:me,children:"Close"})]}):void 0,children:i?s.jsxs("div",{className:"space-y-6",children:[s.jsxs("section",{"aria-labelledby":"so-info",children:[s.jsx(X,{as:"h3",title:s.jsx("span",{id:"so-info",children:"Order information"})}),s.jsx(z,{items:[{label:"Order ID",value:i.id},{label:"Order date",value:i.orderDate?Z(i.orderDate):"N/A"},{label:"Payment method",value:i.paymentMethod||"N/A"},{label:"Status",value:s.jsx(Ce,{status:q(i),domain:"salesOrder"})},{label:"Expected delivery",value:i.expectedDeliveryDate?Z(i.expectedDeliveryDate):"N/A"},{label:"Description",value:i.description||"N/A"}]})]}),s.jsxs("section",{"aria-labelledby":"so-customer",children:[s.jsx(X,{as:"h3",title:s.jsx("span",{id:"so-customer",children:"Customer information"})}),s.jsx(z,{columns:"sm:grid-cols-2",items:[{label:"Customer",value:i.customerName||"N/A"},{label:"Address",value:i.address||"N/A"},{label:"Billing address",value:i.billingAddress||"Same as address"},{label:"Shipping address",value:i.shippingAddress||"Same as address"}]})]}),s.jsxs("section",{"aria-labelledby":"so-items",children:[s.jsx(X,{as:"h3",title:s.jsx("span",{id:"so-items",children:"Line items"})}),be.length>0?s.jsx(ft,{caption:"Sales order line items",columns:lt,rows:be}):s.jsx("p",{className:"rounded-card border border-line px-4 py-6 text-center text-body text-ink-muted",children:"No line items"}),s.jsx("div",{className:"mt-4 flex justify-end",children:s.jsx(Ie,{className:"w-full sm:max-w-sm",rows:[["Net value",n(i.netValue)],["CGST",n(i.cgstAmount)],["SGST",n(i.sgstAmount)],["IGST",n(i.igstAmount)]],grand:["Grand total",n(i.totalAmount)]})})]})]}):null})]})}export{Gt as default};
