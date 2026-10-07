type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayCheckoutPayload = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export async function openRazorpayCheckout(
  payload: RazorpayCheckoutPayload,
  onSuccess: () => void,
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Could not load Razorpay Checkout');
  }
  const instance = new window.Razorpay({
    key: payload.keyId,
    amount: payload.amount,
    currency: payload.currency,
    order_id: payload.orderId,
    name: 'QuickReview',
    description: 'Location subscription',
    handler: () => onSuccess(),
  });
  instance.open();
}
