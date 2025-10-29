export interface ParsedDeal {
  code: string | null;
  discount: string | null;
  summary: string;
  endDate: Date | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  hasCode: boolean;
}

export function parseDeal(dealData: any): ParsedDeal {
  const summary = dealData.summary || '';
  
  // Extract coupon code
  const codeMatch = summary.match(/code[:\s]+([A-Z0-9]{4,20})/i) ||
                    summary.match(/\b([A-Z0-9]{6,15})\b/); // Generic alphanumeric codes
  const code = codeMatch ? codeMatch[1] : null;
  
  // Extract discount percentage or amount
  const discountMatch = summary.match(/(\d+)%\s*off/i) ||
                       summary.match(/save\s+\$?(\d+)/i) ||
                       summary.match(/(\d+)%\s*discount/i);
  const discount = discountMatch ? `${discountMatch[1]}% off` : null;
  
  // Extract end date
  let endDate: Date | null = null;
  const dateMatch = summary.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
  if (dateMatch && dateMatch.length > 0) {
    // Take the last date mentioned (usually expiry)
    const lastDate = dateMatch[dateMatch.length - 1];
    const [month, day, year] = lastDate.split('/').map(Number);
    endDate = new Date(year, month - 1, day);
  }
  
  // Calculate days remaining
  let daysRemaining: number | null = null;
  let isExpiringSoon = false;
  if (endDate && endDate > new Date()) {
    const diffTime = endDate.getTime() - new Date().getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpiringSoon = daysRemaining <= 7;
  }
  
  // Create clean summary (first sentence or up to 60 chars)
  const cleanSummary = summary
    .split('.')[0]
    .substring(0, 60)
    .trim() + (summary.length > 60 ? '...' : '');
  
  return {
    code,
    discount,
    summary: cleanSummary,
    endDate,
    daysRemaining,
    isExpiringSoon,
    hasCode: !!code
  };
}
