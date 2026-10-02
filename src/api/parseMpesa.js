/**
 * Parses common M-PESA SMS formats into a transaction object.
 * Returns null if the message is not recognised.
 */
export function parseMpesa(sms) {
  const s = sms.trim();

  // ── Helpers ──────────────────────────────────────────────────────────────
  const amount = str => parseFloat(str.replace(/,/g, ""));

  // Parse "1/10/26 at 7:06 PM"  or  "1/10/2026"  or  "October 1, 2026"
  const parseDate = str => {
    if (!str) return today();
    // d/m/yy or d/m/yyyy
    const dmy = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmy) {
      let [, d, m, y] = dmy;
      if (y.length === 2) y = "20" + y;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    // Month d, yyyy
    const mdy = str.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (mdy) {
      const months = { january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",july:"07",august:"08",september:"09",october:"10",november:"11",december:"12" };
      const mo = months[mdy[1].toLowerCase()];
      if (mo) return `${mdy[3]}-${mo}-${mdy[2].padStart(2, "0")}`;
    }
    return today();
  };

  const today = () => new Date().toISOString().slice(0, 10);

  // ── Pattern 1: Send money / Pay bill / Buy goods (EXPENSE) ───────────────
  // "UJ1FA8S0H0 Confirmed. Ksh20.00 sent to lucy kioi on 1/10/26 at 7:06 PM..."
  let m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+sent to\s+(.+?)\s+on\s+([\d\/]+)/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: `Sent to ${titleCase(m[3])}`, transaction_date: parseDate(m[4]),
    payment_method: "mpesa",
  };

  // "Confirmed. Ksh500.00 paid to JAVA HOUSE..."
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+paid to\s+(.+?)\s+on\s+([\d\/]+)/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: `Paid to ${titleCase(m[3])}`, transaction_date: parseDate(m[4]),
    payment_method: "mpesa",
  };

  // Buy goods: "Ksh200.00 paid to 123456 SUPERMARKET"
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+paid to\s+\d+\s+(.+?)\s+on\s+([\d\/]+)/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: `Paid to ${titleCase(m[3])}`, transaction_date: parseDate(m[4]),
    payment_method: "mpesa",
  };

  // Paybill: "...for account 12345..."
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+sent to\s+(.+?)\s+for account\s+(\S+)\s+on\s+([\d\/]+)/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: `Paybill ${titleCase(m[3])} acc ${m[4]}`, transaction_date: parseDate(m[5]),
    payment_method: "mpesa",
  };

  // ── Pattern 2: Received money (INCOME) ───────────────────────────────────
  // "You have received Ksh500.00 from JOHN DOE 0712345678 on 1/10/26..."
  m = s.match(/You have received\s+Ksh([\d,]+\.?\d*)\s+from\s+(.+?)\s+on\s+([\d\/]+)/i);
  if (m) return {
    amount: amount(m[1]), transaction_type: "income",
    description: `Received from ${titleCase(m[2])}`, transaction_date: parseDate(m[3]),
    payment_method: "mpesa",
  };

  // ── Pattern 3: Withdraw from agent (EXPENSE) ─────────────────────────────
  // "Confirmed. Ksh1,000.00 withdrawn from 123456 - AGENT NAME on 1/10/26..."
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+withdrawn from\s+(.+?)\s+on\s+([\d\/]+)/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: `Withdrawal from ${titleCase(m[3])}`, transaction_date: parseDate(m[4]),
    payment_method: "mpesa",
  };

  // ── Pattern 4: Airtime purchase (EXPENSE) ────────────────────────────────
  // "Confirmed. Ksh50.00 airtime purchased..."
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+airtime/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "expense",
    description: "Airtime purchase", transaction_date: today(),
    payment_method: "mpesa",
  };

  // ── Pattern 5: M-PESA deposit / top-up (INCOME) ──────────────────────────
  // "Confirmed. Ksh500.00 deposited to your M-PESA account..."
  m = s.match(/([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+deposited/i);
  if (m) return {
    ref: m[1], amount: amount(m[2]), transaction_type: "income",
    description: "M-PESA deposit", transaction_date: today(),
    payment_method: "mpesa",
  };

  return null;
}

function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}
