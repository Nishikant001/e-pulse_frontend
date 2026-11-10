# e-Pulse — Kaun, Kya, Kab karega (Workflow Guide)

Yeh guide batata hai ki system me **sabse pehle kya hoga**, **kaun sa kaam Super Admin / Admin karega**, **kaun sa Distributor karega**, aur **kiske baad kya** karna hai. Har screen ke upar header me **(i) info icon** hai; us par hover (mobile par tap) karoge to us page ka kaam likha dikhega.

---

## 1. Teen log, teen portal

| Kaun | Kahan login karta hai | Kya dekhta hai |
|---|---|---|
| **Super Admin** | `/admin/login` (role = `SUPER_ADMIN`) | Admin portal ke saare screens **+ "Super Admin" page** (`/admin/super-admin`): kitne admins hain, har admin ne kitne distributors banaye, active / inactive / pending count |
| **Admin** (head office) | `/admin/login` (role = `ADMIN`, ya ERP roles) | Saare distributors ka cross-distributor view, masters, distributor management, sales/inventory/accounts dekhna, claims, schemes, ERP |
| **Distributor** | `/login` | Sirf apna data: purchase, stock, sales, returns, accounts, retailers, claims |

Admin aur Distributor ke login alag hain. Distributor ke login se Admin portal kabhi nahi khulta.

---

## 2. Setup order (pehli baar, ek hi baar)

| # | Step | Kaun karega | Kahan | Note |
|---|---|---|---|---|
| 0 | Database migrations chalana (`npx sequelize-cli db:migrate`) | Developer / DevOps | Server | Naya migration `…-super-admin-phase25` distributors me `created_by_admin_id` jodta hai |
| 1 | **Super Admin account banana** | Developer | Server script | `ADMIN_NAME=… ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_ROLE=SUPER_ADMIN node scripts/create-admin.js` (password min 12 characters). Pehle se bane admin ka role badalna ho: `ADMIN_EMAIL=… ADMIN_ROLE=SUPER_ADMIN node scripts/set-admin-role.js` |
| 2 | Baaki Admin accounts banana | Developer (script) | Server | Abhi admin banane ka screen nahi hai; same script `ADMIN_ROLE=ADMIN` ke saath |
| 3 | **Distributor create karna** | Admin | Admin → Distributor Management → Distributor List → **Add** | Status shuru me **Pending** hota hai. System khud code deta hai (DTC001…) |
| 4 | **Distributor ko Activate karna** | Admin | Distributor List → row menu → **Activate** (ya detail page par button) | Sirf **Active** distributor login kar sakta hai aur order bana sakta hai |
| 5 | **Distributor ka login set hona** | Distributor | `/forgot-password` → email dalo → OTP aayega → naya password set → `/login` | Admin-created distributor ka password khali hota hai, isliye pehle "Forgot password" se set karna padta hai (SMTP configured hona chahiye). Agar distributor ne khud `/signup` kiya hai to yeh step nahi chahiye |
| 6 | **Product Master me product add karna** | Admin (distributor ke liye) **ya** Distributor (apne liye) | Admin → Masters → Product Master → Add (distributor chuno) / Distributor → Masters → Product Master | Product hamesha **ek distributor ka** hota hai. Admin banata hai to "kis distributor ke liye" chunna padta hai |
| 7 | Tax (HSN/GST) master | Admin ya Distributor | Admin → Masters → Tax Master / Distributor → Tax Master (HSN) | Product me HSN/GST rate chahiye invoice ke liye |
| 8 | Item / Customer / Vendor groups | Distributor | Masters → Groups | Optional, filtering aur pricing ke liye |
| 9 | **Pricing Master** (rate) | Admin ya Distributor | Admin → Masters → Pricing Master / Distributor → Pricing Master | Product × customer-group ka rate. Order isi se rate uthata hai |
| 10 | Scheme Master (discount / free goods) | **Sirf Admin** | Admin → Masters → Scheme Master | Active scheme order par automatically lagti hai |
| 11 | Vendor aur Customer/Retailer add karna | Distributor (Admin retailers dekh/edit bhi kar sakta hai) | Masters → Vendor Master, Customer Master / Retailer Management | Purchase ke liye vendor, sale ke liye customer chahiye |

> Seedha rule: **Distributor → Active → Login → Product → Tax → Price → Vendor/Customer** — iske baad hi roz ka kaam shuru hota hai.

---

## 3. Roz ka kaam (Distributor)

### Purchase (maal andar aana)
1. **Purchase Order** banao (Purchase → Purchase Orders).
2. **Purchase Delivery** = maal receive karna. Yahan **batch number + manufacturing/expiry date** likhte ho; isi se **batch ban-te hain aur stock badhta hai**.
3. **Purchase Invoice** = vendor ka bill (vendor ko kitna dena hai).
4. Kharab/expired maal wapas: **Purchase Return** aur **Purchase Debit Note**.

### Sales (maal bahar jaana)
1. **Sales Order** banao (customer + product). Stock FEFO se (jis batch ki expiry pehle, wo pehle) allocate hota hai.
2. **Delivery** = dispatch; yahan stock actual me ghatta hai.
3. **Sales Invoice** = GST invoice; customer ka outstanding banta hai.
4. Return aaye to **Sales Return** → **Credit Note**. Extra charge ho to **Debit Note**.

### Inventory dekhna
Current Stock, Batch Stock, Stock Ledger (har movement), **Near Expiry**, **Expired Stock**, **FEFO Monitor**.

### Accounts
Payments (customer se paisa aaya / vendor ko diya), Customer/Vendor Ledger, Trial Balance, Balance Sheet, GL Master, aur read-only **Financial View** (Outstanding, Ageing, Credit limit).

### Retailers & Claims
Retailers ki list, aur scheme/expiry claims banana (Claims).

---

## 4. Admin / Super Admin ka kaam (head office)

| Kaam | Kaun | Kahan |
|---|---|---|
| Distributor banana, edit karna | Admin | Distributor Management |
| Distributor **Active / Deactivate** karna (reason ke saath) | Admin | Distributor List ya Detail page. Inactive distributor login/order nahi kar sakta; purana data (orders, invoices, payments) safe rehta hai. Wapas Activate bhi ho sakta hai |
| Product / Batch / Pricing / Tax masters | Admin | Masters |
| **Scheme** banana, activate/deactivate | Admin | Masters → Scheme Master |
| Sales orders / invoices dekhna, zarurat par distributor ke liye order banana | Admin | Sales |
| **Secondary Sales** (distributor ne retailers ko kitna becha) | Admin | Sales → Secondary Sales |
| Stock / expiry risk poore network ka | Admin | Inventory |
| Claims approve / reject | Admin | Claims |
| Outstanding, ageing, credit limits | Admin | Accounts |
| ERP/SAP connection, sync, errors, audit | Admin (ERP permission ke hisaab se) | ERP Integration |
| **Saare admins aur unke distributors ka count** | **Sirf Super Admin** | Super Admin page |

---

## 5. Distributor ke status ka asar

| Status | Login | Naya sales order | Purana data |
|---|---|---|---|
| **Pending** (admin ne abhi banaya) | Nahi | Nahi | — |
| **Active** | Haan | Haan | Dikhta hai |
| **Inactive** | Nahi ("account not active") | Nahi | Safe, delete nahi hota |

---

## 6. Is release me kya naya hai
- Distributor portal ke **saare purane pages** ab Admin dashboard jaise look/alignment me (ek common "skin": `src/styles/legacy-skin.css`). Kisi page ka logic nahi badla.
- Header (navbar) ka alignment theek: title ab truncate nahi hota, breadcrumb ek line me, extra chips choti screen par hide.
- Har page par **(i) info icon** (text: `src/config/pageInfo.js`).
- **Super Admin dashboard** (`/admin/super-admin`) + backend `GET /api/admin/superadmin/overview` aur `GET /api/admin/superadmin/admins/:id/distributors` (403 agar role SUPER_ADMIN nahi).
- Distributor ka sidebar saaf: Admin-only items (Distributor Management, SAP) hata diye; "planned" items by default chhupe (sidebar ke neeche toggle se dikh sakte hain).
- Public website (Home aur baaki pages) naye animated design me.
- Distributor **Active/Inactive management Admin me pehle se tha** — dobara nahi banaya.

## 7. Dhyan dene wali baatein (honest notes)
1. **Purane distributors** (jo admin ne nahi banaye, ya signup se aaye) Super Admin page par **"Unassigned"** me ginte hain, kyunki unka creator record nahi tha. Ab se Admin jo distributor banayega, uska creator save hoga.
2. Admin-created distributor ko login dene ka koi "set password" button nahi hai; **Forgot Password (OTP email)** hi raasta hai. Iske liye server par SMTP (`EMAIL_USER`, `EMAIL_PASS`) set hona chahiye.
3. Admin accounts banane/role badalne ka UI nahi hai (script se hota hai).
4. Credit limit abhi sirf information hai, order par enforce nahi hota.
