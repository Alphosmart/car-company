import test from "node:test";
import assert from "node:assert/strict";

import { calculateMonthlyPayment } from "../lib/loanCalculator.mjs";

test("calculateMonthlyPayment handles standard amortization", () => {
  const payment = calculateMonthlyPayment(36000000, 22, 36);

  assert.equal(Math.round(payment), 1374856);
});

test("calculateMonthlyPayment falls back to straight-line payment when interest is zero", () => {
  const payment = calculateMonthlyPayment(12000000, 0, 12);

  assert.equal(payment, 1000000);
});
