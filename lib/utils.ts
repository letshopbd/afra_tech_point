export function formatCurrency(amount: number | string, symbol = '৳'): string {
  return `${symbol}${Number(amount).toLocaleString('en-BD')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: '2-digit',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-BD', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateInvoiceNumber(saleId: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(saleId).padStart(6, '0')}`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
