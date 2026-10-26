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

export function formatMemory(val?: string | null): string {
  if (!val) return ''
  const trimmed = String(val).trim()
  if (!trimmed) return ''
  // Pure digits (e.g. "4", "128", "256")
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed} GB`
  }
  // Digits with units (e.g. "4gb", "128GB", "1tb")
  if (/^\d+\s*(tb|gb|mb)$/i.test(trimmed)) {
    const match = trimmed.match(/^(\d+)\s*(tb|gb|mb)$/i)
    if (match) {
      return `${match[1]} ${match[2].toUpperCase()}`
    }
  }
  return trimmed
}
