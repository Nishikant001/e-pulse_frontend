import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import Alert from "../../../ui/Alert";
import Button from "../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import Input from "../../../ui/Input";
import PageHeader from "../../../ui/PageHeader";
import Select from "../../../ui/Select";
import { authFetch } from "../../../../utils/authFetch";

// Phase 2: the "Pay Vendor" tab (and its vendor list / POST /payment/vendor call) was removed from the Distributor portal UI.
// Customer receipts are unchanged. The backend endpoint is untouched.
const UnifiedPaymentManagement = () => {
  /* ---------------- CUSTOMER ---------------- */
  const [customers, setCustomers] = useState([]);
  const [customerFormData, setCustomerFormData] = useState({
    customer_id: "",
    amount: "",
    reference_no: "",
    mode: "Cash",
  });
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");

  /* ---------------- FETCH LISTS ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authFetch("/customer");
        if (!cancelled) setCustomers(data || []);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- SUBMIT CUSTOMER PAYMENT ---------------- */
  const handleCustomerSubmit = async () => {
    setCustomerLoading(true);
    setCustomerMessage("");

    try {
      await authFetch("/payment/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerFormData),
      });

      setCustomerMessage("✓ Payment received successfully!");
      setCustomerFormData({
        customer_id: "",
        amount: "",
        reference_no: "",
        mode: "Cash",
      });
    } catch (err) {
      setCustomerMessage("✗ " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  /* ---------------- CHANGE HANDLERS ---------------- */
  const handleCustomerChange = (e) => {
    setCustomerFormData({
      ...customerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const failed = customerMessage.startsWith("✗");
  return (
    <div>
      <PageHeader title="Payment Management" description="Accounts receivable — record a payment received from a customer." />

      <Card className="max-w-2xl">
        <CardHeader icon={HandCoins} title="Receive from Customer" subtitle="Receipts are posted against the customer's ledger." />
        <CardBody className="space-y-4">
          <Select
            label="Customer"
            required
            name="customer_id"
            value={customerFormData.customer_id}
            onChange={handleCustomerChange}
            placeholder="Select Customer"
            options={customers.map((c) => ({ value: c.id, label: `${c.customer_code} - ${c.name}` }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Amount" required type="number" name="amount" value={customerFormData.amount} onChange={handleCustomerChange} placeholder="0.00" />
            <Select
              label="Payment mode"
              name="mode"
              value={customerFormData.mode}
              onChange={handleCustomerChange}
              options={["Cash", "Bank Transfer", "UPI", "Cheque", "Card"].map((m) => ({ value: m, label: m }))}
            />
          </div>
          <Input label="Reference no." name="reference_no" value={customerFormData.reference_no} onChange={handleCustomerChange} placeholder="Cheque / transaction reference" />

          {customerMessage ? <Alert tone={failed ? "error" : "success"}>{customerMessage.replace(/^[✓✗]\s*/, "")}</Alert> : null}

          <div className="flex justify-end">
            <Button onClick={handleCustomerSubmit} loading={customerLoading} disabled={!customerFormData.customer_id || !customerFormData.amount}>
              Receive Payment
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default UnifiedPaymentManagement;
