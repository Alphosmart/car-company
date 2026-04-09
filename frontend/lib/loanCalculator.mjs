export function calculateMonthlyPayment(principal, annualRate, months) {
  if (months <= 0) return 0;
  if (annualRate <= 0) return principal / months;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}
