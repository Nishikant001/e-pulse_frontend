import React, { useState, useEffect } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Factory, Store } from "lucide-react";
import Alert from "../../../ui/Alert";
import Button from "../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import DatePicker from "../../../ui/DatePicker";
import Input, { Textarea } from "../../../ui/Input";
import PageHeader from "../../../ui/PageHeader";
import Select from "../../../ui/Select";
import { useToast } from "../../../feedback";
import InfoGrid from "../../../../features/adminSales/components/InfoGrid";
import { formatINR } from "../../../../utils/format";
import { cn } from "../../../../utils/cn";
import { API_BASE_URL } from "../../../../config/api";

export default function CreateInvoice() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Get token from state (replace with your auth system)
  // IMPORTANT: Using in-memory token instead of localStorage for demo
      const token = localStorage.getItem("token");

  // Form data
  const [formData, setFormData] = useState({
    partyType: "",
    noteType: "",
    salesOrderHeader_id: "",
    paymentAmount: 0,
    restPaymentDueDate: "",
    placeOfSupply: "",
    vehicleNumber: "",
    receiverDetails: "",
    consigneeBilledTo: "",
    consigneeShippedTo: "",
    reason: "",
    total: ""
  });

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/salesorder`, {
         headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setSalesOrders(data || []);
    } catch (err) {
      console.error("Error fetching sales orders:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartyTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, partyType: type, noteType: "" }));
    setStep(2);
  };

  const handleNoteTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, noteType: type }));
    setStep(3);
  };

  const handleSalesOrderSelect = async (e) => {
    const orderId = e.target.value;
    
    if (!orderId) {
      setSelectedSalesOrder(null);
      setFormData(prev => ({ 
        ...prev, 
        salesOrderHeader_id: "",
        consigneeShippedTo: "",
        receiverDetails: "",
        consigneeBilledTo: "",
        placeOfSupply: ""
      }));
      return;
    }

    try {
      // Fetch detailed sales order data
      const res = await fetch(`${API_BASE_URL}/salesorder/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const orderDetails = await res.json();
      console.log('order',orderDetails)
      
      setSelectedSalesOrder(orderDetails);
      
      // Auto-fill form fields from sales order details
      setFormData(prev => ({ 
        ...prev, 
        salesOrderHeader_id: orderId,
        consigneeShippedTo: orderDetails.customer?.ship_to_party || "",
        receiverDetails: orderDetails.customer?.name || "",
        consigneeBilledTo: orderDetails.customer?.bill_to_party || "",
        placeOfSupply: orderDetails.customer?.region || ""
      }));
    } catch (err) {
      console.error("Error fetching sales order details:", err);
      // Fallback to basic data if detailed fetch fails
      const order = salesOrders.find(so => so.id === parseInt(orderId));
      setSelectedSalesOrder(order);
      setFormData(prev => ({ 
        ...prev, 
        salesOrderHeader_id: orderId
      }));
    }
  };

  const getInvoiceType = () => {
    return `${formData.partyType}_${formData.noteType}`;
  };

  const getEffectDescription = () => {
    const type = getInvoiceType();
    const effects = {
      retailer_credit: {
        gst: "GST will be reduced",
        amount: "Customer pays less",
        color: "text-success-700",
        icon: "↓"
      },
      retailer_debit: {
        gst: "GST will be added",
        amount: "Customer pays more",
        color: "text-error-700",
        icon: "↑"
      },
      vendor_credit: {
        gst: "GST will be reduced",
        amount: "You pay less to vendor",
        color: "text-success-700",
        icon: "↓"
      },
      vendor_debit: {
        gst: "GST will be added",
        amount: "You pay more to vendor",
        color: "text-error-700",
        icon: "↑"
      }
    };
    return effects[type] || {};
  };

  const calculateAdjustedTotal = () => {
    if (!selectedSalesOrder) return 0;
    
    const lineItems = selectedSalesOrder.lines || [];
    const calculatedTotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.netPricePerQuantity,
      0
    );
    
    const baseTotal = selectedSalesOrder.totalAmount || calculatedTotal;
    
    // Return base total without modifications
    return baseTotal;
  };

  const calculateOverrideTotal = () => {
    const adjustedTotal = calculateAdjustedTotal();
    const paymentAmount = parseFloat(formData.paymentAmount) || 0;
    return adjustedTotal - paymentAmount;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const invoiceData = {
        ...formData,
        invoiceType: getInvoiceType(),
        paymentAmount: parseFloat(formData.paymentAmount) || 0,
        total: calculateOverrideTotal()
      };

      const res = await fetch(`${API_BASE_URL}/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Invoice created successfully. Invoice ID: ${data.invoice.id}`);
        
        // Reset form
        setFormData({
          partyType: "",
          noteType: "",
          salesOrderHeader_id: "",
          paymentAmount: 0,
          restPaymentDueDate: "",
          placeOfSupply: "",
          vehicleNumber: "",
          receiverDetails: "",
          consigneeBilledTo: "",
          consigneeShippedTo: "",
          reason: "",
          total: ""
        });
        setStep(1);
        setSelectedSalesOrder(null);
      } else {
        toast.error(data.message || "Error creating invoice", { title: "Invoice not created" });
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      toast.error("Error creating invoice", { title: "Invoice not created" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      partyType: "",
      noteType: "",
      salesOrderHeader_id: "",
      paymentAmount: 0,
      restPaymentDueDate: "",
      placeOfSupply: "",
      vehicleNumber: "",
      receiverDetails: "",
      consigneeBilledTo: "",
      consigneeShippedTo: "",
      reason: "",
      total: ""
    });
    setStep(1);
    setSelectedSalesOrder(null);
  };

  const effect = getEffectDescription();

  const STEPS = ["Party", "Type", "Details", "Review"];
  const partyLabel = formData.partyType === "vendor" ? "Vendor / supplier" : "Retailer / customer";
  const tile = "group flex w-full flex-col items-center rounded-card border border-line bg-surface p-6 text-center transition-shadow duration-200 hover:border-brand-300 hover:shadow-hover";
  const set = (name) => (value) => handleInputChange({ target: { name, value } });

  return (
    <div>
      <PageHeader title="Create Invoice" description="Follow the steps to create a credit or debit note." />

      <Card className="mb-4">
        <CardBody>
          <ol className="flex items-center" aria-label="Progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <li key={label} className={cn("flex items-center", n < STEPS.length && "flex-1")} aria-current={active ? "step" : undefined}>
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn("flex size-9 items-center justify-center rounded-full text-body font-semibold", step >= n ? "bg-brand-600 text-white" : "bg-neutral-100 text-ink-subtle")}>
                      {done ? <Check className="size-4" aria-hidden="true" /> : n}
                    </span>
                    <span className={cn("text-caption", active ? "font-medium text-ink" : "text-ink-subtle")}>{label}</span>
                  </div>
                  {n < STEPS.length ? <span className={cn("mx-3 mb-5 h-0.5 flex-1 rounded", step > n ? "bg-brand-600" : "bg-neutral-200")} aria-hidden="true" /> : null}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader title="For whom is this invoice?" subtitle="Choose the party the note is raised for." />
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => handlePartyTypeSelect("retailer")} className={tile}>
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Store className="size-6" aria-hidden="true" /></span>
                <span className="mt-3 text-card-title font-semibold text-ink">Retailer / customer</span>
                <span className="mt-1 text-body text-ink-muted">Create an invoice for your customer or retailer</span>
              </button>
              <button type="button" onClick={() => handlePartyTypeSelect("vendor")} className={tile}>
                <span className="flex size-12 items-center justify-center rounded-full bg-success-50 text-success-700"><Factory className="size-6" aria-hidden="true" /></span>
                <span className="mt-3 text-card-title font-semibold text-ink">Vendor / supplier</span>
                <span className="mt-1 text-body text-ink-muted">Create an invoice for your vendor or supplier</span>
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader title="What type of note do you want to create?" subtitle={`Selected: ${partyLabel}`} actions={<Button size="sm" variant="secondary" leftIcon={ArrowLeft} onClick={() => setStep(1)}>Back</Button>} />
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => handleNoteTypeSelect("credit")} className={tile}>
                <span className="flex size-12 items-center justify-center rounded-full bg-success-50 text-success-700"><ArrowDown className="size-6" aria-hidden="true" /></span>
                <span className="mt-3 text-card-title font-semibold text-ink">Credit note</span>
                <span className="mt-1 text-body text-ink-muted">Reduce the amount payable</span>
                <span className="mt-3 w-full rounded-control bg-surface-muted p-3 text-left text-caption text-ink-muted">
                  <span className="font-semibold text-ink">When to use</span>
                  <span className="mt-1 block">Goods returned · Discount given · Price correction (lower)</span>
                </span>
              </button>
              <button type="button" onClick={() => handleNoteTypeSelect("debit")} className={tile}>
                <span className="flex size-12 items-center justify-center rounded-full bg-error-50 text-error-700"><ArrowUp className="size-6" aria-hidden="true" /></span>
                <span className="mt-3 text-card-title font-semibold text-ink">Debit note</span>
                <span className="mt-1 text-body text-ink-muted">Increase the amount payable</span>
                <span className="mt-3 w-full rounded-control bg-surface-muted p-3 text-left text-caption text-ink-muted">
                  <span className="font-semibold text-ink">When to use</span>
                  <span className="mt-1 block">Additional charges · Price correction (higher) · Penalty or fees</span>
                </span>
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader
            title="Invoice details"
            subtitle={`${partyLabel} · ${formData.noteType} note`}
            actions={<Button size="sm" variant="secondary" leftIcon={ArrowLeft} onClick={() => setStep(2)}>Back</Button>}
          />
          <CardBody className="space-y-4">
            <Select
              label="Sales order"
              required
              name="salesOrderHeader_id"
              value={formData.salesOrderHeader_id}
              onChange={handleSalesOrderSelect}
              placeholder="Select sales order"
              wrapperClassName="max-w-xl"
              options={salesOrders.map((so) => ({ value: so.id, label: `Order #${so.id} - ${so.customer?.name || "N/A"} - ${formatINR(so.totalAmount || 0)}` }))}
            />

            {selectedSalesOrder ? (
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="mb-3 text-body font-semibold text-ink">Selected order</p>
                <InfoGrid
                  columns="sm:grid-cols-2 lg:grid-cols-3"
                  items={[
                    { label: "Customer", value: selectedSalesOrder.customer?.name },
                    { label: "Order total", value: formatINR(selectedSalesOrder.totalAmount || 0) },
                    { label: "Adjusted total", value: <span className={cn("text-card-title font-semibold", effect.color)}>{formatINR(calculateAdjustedTotal())}</span> },
                  ]}
                />
              </div>
            ) : null}

            <Textarea label={`Reason for ${formData.noteType} note`} required name="reason" value={formData.reason} onChange={handleInputChange} rows={3} placeholder="Explain the reason for this note…" />

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Payment amount (₹)" type="number" name="paymentAmount" value={formData.paymentAmount} onChange={handleInputChange} step="0.01" min="0" />
              <DatePicker label="Payment due date" value={formData.restPaymentDueDate} onChange={set("restPaymentDueDate")} />
              <Input label="Place of supply" name="placeOfSupply" value={formData.placeOfSupply} onChange={handleInputChange} placeholder="e.g. Maharashtra" />
              <Input label="Vehicle number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="e.g. MH-01-AB-1234" />
              <Input label="Receiver details" name="receiverDetails" value={formData.receiverDetails} onChange={handleInputChange} placeholder="Name of receiver" />
              <Input label="Consignee billed to" name="consigneeBilledTo" value={formData.consigneeBilledTo} onChange={handleInputChange} placeholder="Billing address" />
              <Input label="Consignee shipped to" name="consigneeShippedTo" value={formData.consigneeShippedTo} onChange={handleInputChange} placeholder="Shipping address" />
              <Input label="Override total (₹)" name="total" value={calculateOverrideTotal().toFixed(2)} readOnly hint="Adjusted total − payment amount" />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button rightIcon={ArrowRight} onClick={() => setStep(4)} disabled={!formData.salesOrderHeader_id || !formData.reason}>
                Review invoice
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader title="Review invoice" subtitle="Check the details before creating the invoice." />
          <CardBody className="space-y-4">
            <Alert tone="info" title={`${partyLabel} · ${formData.noteType} note`}>
              {effect.gst} · {effect.amount}
            </Alert>
            <InfoGrid
              items={[
                { label: "Sales order", value: `#${formData.salesOrderHeader_id}` },
                { label: "Payment amount", value: formatINR(parseFloat(formData.paymentAmount || 0)) },
                { label: "Rest amount", value: formatINR(calculateOverrideTotal()) },
                { label: "Place of supply", value: formData.placeOfSupply },
                { label: "Vehicle number", value: formData.vehicleNumber },
                { label: "Receiver", value: formData.receiverDetails },
              ]}
            />
            <Alert tone="warning" title="Reason">
              {formData.reason}
            </Alert>
            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" leftIcon={ArrowLeft} onClick={() => setStep(3)} disabled={loading}>Edit details</Button>
              <Button leftIcon={Check} onClick={handleSubmit} loading={loading}>Create invoice</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
