export function adminWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function inr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
