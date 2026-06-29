"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Edit2, Trash2, Barcode } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function ItemsPage() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [printingItem, setPrintingItem] = useState<any | null>(null)
  const [printQty, setPrintQty] = useState(1)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  const barcodeBuffer = useRef("")
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function fetchItems() {
    try {
      const res = await fetch("/api/items")
      const data = await res.json()
      setTimeout(() => setItems(data), 0)
    } catch {
      toast.error("Failed to fetch items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Global barcode scanner listener — routes fast keystrokes to barcode field
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === "Enter") {
        const buf = barcodeBuffer.current
        barcodeBuffer.current = ""
        if (buf.length >= 3) {
          e.preventDefault()
          e.stopPropagation()
          const el = document.activeElement as HTMLInputElement | null
          if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, "value"
            )?.set
            nativeSetter?.call(el, "")
            el.dispatchEvent(new Event("input", { bubbles: true }))
          }
          setValue("barcode", buf)
          document.querySelector<HTMLInputElement>('input[name="barcode"]')?.focus()
          document.querySelector<HTMLInputElement>('input[name="barcode"]')?.select()
        }
        return
      }

      if (e.key.length === 1) {
        clearTimeout(scanTimer.current)
        scanTimer.current = setTimeout(() => { barcodeBuffer.current = "" }, 50)
        barcodeBuffer.current += e.key
      }
    }

    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      clearTimeout(scanTimer.current)
    }
  }, [setValue])

  const onSubmit = async (data: any) => {
    try {
      const url = editingId ? `/api/items/${editingId}` : "/api/items"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save item")
      }
      
      toast.success(editingId ? "Item updated!" : "Item added!")
      resetForm()
      fetchItems()
    } catch (error: any) {
      toast.error(error.message || "Error saving item")
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setValue("name", item.name)
    setValue("itemType", item.itemType)
    setValue("cost", item.cost)
    setValue("price", item.price)
    setValue("barcode", item.barcode || "")
    setValue("description", item.description)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      toast.success("Item deleted")
      fetchItems()
    } catch {
      toast.error("Error deleting item")
    }
  }

  const handleGenBarcode = () => {
    // Generate an 8-digit random suffix for in-store barcode (prefix '200')
    const randomSuffix = Math.floor(100000 + Math.random() * 900000)
    setValue("barcode", `200${randomSuffix}`)
    toast.success("Barcode generated! Save the item to apply.")
  }

  const handlePrintBarcode = (item: any, qty: number) => {
    if (!item.barcode) {
      toast.error("This item does not have a barcode")
      return
    }

    const printWindow = window.open("", "_blank", "width=450,height=400")
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print barcode labels.")
      return
    }

    let stickerHTML = ""
    for (let i = 0; i < qty; i++) {
      stickerHTML += `
        <div class="sticker">
          <div class="title">${item.name}</div>
          <svg class="barcode-svg" data-value="${item.barcode}"></svg>
          <div class="price">Price: ৳ ${Number(item.price || 0).toLocaleString()}</div>
        </div>
      `
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${item.name}</title>
          <style>
            @page {
              size: 38mm 25mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 38mm;
              background: white;
            }
            .sticker {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 0;
              padding: 2mm 1mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 25mm;
              width: 38mm;
              overflow: hidden;
              page-break-after: always;
              break-after: page;
            }
            .sticker:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .title {
              font-size: 7px;
              font-weight: bold;
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 36mm;
            }
            .price {
              font-size: 8px;
              font-weight: bold;
              margin: 1px 0 0 0;
            }
            svg {
              max-width: 36mm;
              height: 12mm;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          ${stickerHTML}
          <script>
            window.onload = function() {
              const svgs = document.querySelectorAll(".barcode-svg");
              svgs.forEach(function(svg) {
                const val = svg.getAttribute("data-value");
                JsBarcode(svg, val, {
                  format: "CODE128",
                  width: 1.2,
                  height: 30,
                  fontSize: 8,
                  margin: 0
                });
              });
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const resetForm = () => {
    setEditingId(null)
    reset({ name: "", itemType: "product", cost: "", price: "", barcode: "", description: "" })
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Print Qty Modal */}
      {printingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>{language === 'bn' ? "বারকোড লেবেল প্রিন্ট" : "Print Barcode Labels"}</h3>
            <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              {language === 'bn' ? "পণ্য" : "Product"}: <strong>{printingItem.name}</strong><br/>
              {language === 'bn' ? "বারকোড" : "Barcode"}: <code>{printingItem.barcode}</code>
            </p>
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label className="form-label">{language === 'bn' ? "কপির সংখ্যা (Number of Copies)" : "Number of Copies"}</label>
              <input 
                type="number" 
                className="input-field" 
                min={1} 
                max={100}
                value={printQty} 
                onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                onClick={() => setPrintingItem(null)}
              >
                {language === 'bn' ? "বাতিল" : "Cancel"}
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  handlePrintBarcode(printingItem, printQty)
                  setPrintingItem(null)
                }}
              >
                {language === 'bn' ? "প্রিন্ট করুন" : "Print Labels"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Form */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{editingId ? t('editItem') : t('addNewItem')}</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', alignItems: 'end' }}>
          <div>
            <label className="form-label">{t('itemName')} *</label>
            <input 
              {...register("name", { required: true })} 
              className="input-field" 
              placeholder="e.g. iPhone 15 Pro Max" 
            />
          </div>
          <div>
            <label className="form-label">{language === 'bn' ? "ধরন" : "Type"} *</label>
            <select 
              {...register("itemType", { required: true })} 
              className="input-field"
              defaultValue="product"
            >
              <option value="product">{language === 'bn' ? "পণ্য (Product)" : "Product"}</option>
              <option value="service">{language === 'bn' ? "সেবা (Service)" : "Service"}</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{language === 'bn' ? "বারকোড (ঐচ্ছিক)" : "Barcode (Optional)"}</span>
              <button 
                type="button" 
                onClick={handleGenBarcode}
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}
              >
                Auto-Gen
              </button>
            </label>
            <input 
              {...register("barcode")} 
              className="input-field" 
              placeholder={language === 'bn' ? "স্ক্যান করুন বা খালি রাখুন" : "Scan or leave blank to auto-gen"} 
            />
          </div>
          <div>
            <label className="form-label">{t('purchaseRate')} (৳)</label>
            <input 
              type="number" 
              step="0.01"
              {...register("cost")} 
              className="input-field" 
              placeholder="0.00" 
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div>
            <label className="form-label">{language === 'bn' ? "বিক্রয় মূল্য" : "Sale Price"} (৳)</label>
            <input 
              type="number" 
              step="0.01"
              {...register("price")} 
              className="input-field" 
              placeholder="0.00" 
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">{t('description')} ({t('optional')})</label>
            <textarea 
              {...register("description")} 
              className="input-field" 
              rows={2} 
              placeholder="Additional details..."
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? t('processing') : editingId ? t('updateItem') : t('saveItem')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('itemsList')}</h3>
        
        {loading ? (
          <p className="text-muted">{t('loadingItems')}</p>
        ) : items.length === 0 ? (
          <p className="text-muted">{t('noItemsFound')}</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('itemName')}</th>
                  <th>Type</th>
                  <th>Barcode</th>
                  <th>{t('purchaseRate')}</th>
                  <th>Sale Price</th>
                  <th>{t('balance')}</th>
                  <th>{t('description')}</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const stock = item.stock || 0
                  const isService = item.itemType === 'service'
                  let badgeColor = 'var(--success)'
                  let badgeText = t('inStock')
                  if (stock === 0) {
                    badgeColor = 'var(--error)'
                    badgeText = t('outOfStock')
                  } else if (stock <= 5) {
                    badgeColor = 'var(--warning)'
                    badgeText = t('lowStock')
                  }

                  return (
                    <tr key={item.id}>
                      <td data-label="ID">#{item.id}</td>
                      <td data-label={t('itemName')} style={{ fontWeight: 500 }}>{item.name}</td>
                      <td data-label="Type" style={{ textTransform: 'capitalize' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: '0.75rem', 
                          backgroundColor: isService ? 'rgba(14, 165, 233, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                          color: isService ? 'var(--secondary)' : 'var(--primary)',
                          fontWeight: 600
                        }}>
                          {isService ? 'Service' : 'Product'}
                        </span>
                      </td>
                      <td data-label="Barcode" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.barcode || "-"}</td>
                      <td data-label={t('purchaseRate')}>৳ {Number(item.cost).toLocaleString()}</td>
                      <td data-label="Sale Price">৳ {Number(item.price || 0).toLocaleString()}</td>
                      <td data-label={t('balance')}>
                        {isService ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            padding: '2px 8px', 
                            borderRadius: 'var(--radius-sm)', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            backgroundColor: `${badgeColor}15`, 
                            color: badgeColor,
                            border: `1px solid ${badgeColor}33`
                          }}>
                            {stock} ({badgeText})
                          </span>
                        )}
                      </td>
                      <td data-label={t('description')} className="text-muted">{item.description || "-"}</td>
                      <td className="action-cell">
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          {!isService && item.barcode && (
                            <button 
                              onClick={() => { setPrintingItem(item); setPrintQty(1); }}
                              style={{ padding: 'var(--space-2)', color: 'var(--primary)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                              title="Print Barcode Sticker"
                            >
                              <Barcode size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(item)}
                            style={{ padding: 'var(--space-2)', color: 'var(--secondary)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                            title={t('edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
