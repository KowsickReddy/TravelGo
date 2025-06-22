import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatIndianCurrency } from "@/utils/currency";
import { Smartphone, CreditCard, Building, Wallet, Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  amount: number;
  onSuccess: () => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  bookingId, 
  amount, 
  onSuccess 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Payment creation failed");
      return response.json();
    },
  });

  const processUPIMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/payment/upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("UPI payment failed");
      return response.json();
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Create payment session
      const session = await createPaymentMutation.mutateAsync({
        bookingId,
        paymentMethod,
        amount,
      });

      if (paymentMethod === "upi") {
        const upiPayment = await processUPIMutation.mutateAsync({
          sessionId: session.sessionId,
          upiId,
        });

        // Open UPI app or show QR code
        if (upiPayment.paymentUrl) {
          window.open(upiPayment.paymentUrl, '_blank');
        }

        toast({
          title: "UPI Payment Initiated",
          description: "Complete the payment in your UPI app",
        });

        // Simulate payment completion for demo
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again with a different payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'upi', name: 'UPI (Unified Payments Interface)', icon: '📱', description: 'Pay using Google Pay, PhonePe, Paytm, etc.' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay cards accepted' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major Indian banks supported' },
    { id: 'wallet', name: 'Digital Wallet', icon: '👛', description: 'Paytm, Amazon Pay, etc.' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatIndianCurrency(amount)}
                </div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="text-sm font-medium">Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <method.icon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="font-medium cursor-pointer">
                      {method.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {paymentMethod === "upi" && (
            <div>
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatIndianCurrency(amount)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}