"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Printer, Plus, Trash2, Settings, FileSpreadsheet, RotateCcw } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import JsBarcode from "jsbarcode"

// Individual Barcode Sticker Component
function BarcodeSticker({ name, barcode, price, height, showPrice, showName }: { 
  name: string, 
  barcode: string, 
  price: number, 
  height: number,
  showPrice: boolean,
  showName: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && barcode) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: "CODE128",
          width: 1.1,
          height: height - 12, // Leave space for text
          fontSize: 7,
          margin: 0,
          displayValue: true
        })
      } catch (err) {
        console.error(err)
      }
    }
  }, [barcode, height])

  return (
    <div className="barcode-sticker-card" style={{
      border: '1px dashed #cbd5e1',
      padding: '1px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      backgroundColor: 'white',
      color: 'black',
      height: `${height}mm`,
      overflow: 'hidden',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      margin: '0 auto',
      width: '100%'
    }}>
      {showName && (
        <div style={{ 
          fontSize: '7px', 
          fontWeight: 'bold', 
          width: '100%', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          lineHeight: '1',
          marginBottom: '1px'
        }}>
          {name}
        </div>
      )}
      <svg ref={svgRef} style={{ maxWidth: '100%', display: 'block' }}></svg>
      {showPrice && (
        <div style={{ 
          fontSize: '7px', 
          fontWeight: 'bold', 
          marginTop: '1px',
          lineHeight: '1'
        }}>
          Price: ৳{Number(price || 0).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default function BarcodePage() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Selection States
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState(1)
  
  // Queue State
  const [printQueue, setPrintQueue] = useState<any[]>([])

  // Layout Configurations
  const [columns, setColumns] = useState(3)
  const [labelHeight, setLabelHeight] = useState(25) // in mm
  const [showPrice, setShowPrice] = useState(true)
  const [showName, setShowName] = useState(true)
  const [topMargin, setTopMargin] = useState(10) // A4 top margin in mm
  const [sideMargin, setSideMargin] = useState(10) // A4 side margin in mm

  async function fetchItems() {
    try {
      const res = await fetch("/api/items?type=product")
      const data = await res.json()
      if (Array.isArray(data)) {
        setItems(data)
      } else {
        setItems([])
      }
    } catch {
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleAddToQueue = () => {
    if (!selectedItemId) {
      toast.error("Please select a product")
      return
    }

    const item = items.find(i => i.id === parseInt(selectedItemId))
    if (!item) return

    if (!item.barcode) {
      toast.error("Selected product does not have a barcode number")
      return
    }

    // Check if already in queue
    const existingIndex = printQueue.findIndex(q => q.id === item.id)
    if (existingIndex > -1) {
      const updated = [...printQueue]
      updated[existingIndex].quantity += quantity
      setPrintQueue(updated)
    } else {
      setPrintQueue([...printQueue, { ...item, quantity }])
    }

    toast.success(`${quantity} label(s) added to print queue`)
    setQuantity(1)
  }

  const handleRemoveFromQueue = (id: number) => {
    setPrintQueue(printQueue.filter(q => q.id !== id))
  }

  const handleClearQueue = () => {
    setPrintQueue([])
  }

  const handlePrint = () => {
    if (printQueue.length === 0) {
      toast.error("Your print queue is empty")
      return
    }
    window.print()
  }

  // Generate flattened array of stickers based on quantity
  const flattenedStickers = printQueue.flatMap(item => 
    Array.from({ length: item.quantity }, () => ({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      price: item.price
    }))
  )

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Styles for print output */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body {
            height: auto !important;
            min-height: unset !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-a4-sheet {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: unset !important;
            margin: 0 !important;
            padding: ${topMargin}mm ${sideMargin}mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          .barcode-sticker-card {
            border: 1px solid #000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .barcode-grid {
            display: grid !important;
            grid-template-columns: repeat(${columns}, 1fr) !important;
            gap: 1mm !important;
            width: 100% !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)', contentVisibility: 'auto' }}>
        
        {/* Top Control Panel */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          
          {/* Add to Queue Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', color: 'var(--primary)' }}>
              <Plus size={20} />
              <h4 style={{ margin: 0 }}>{language === 'bn' ? "প্রিন্ট তালিকায় পণ্য যোগ" : "Add Labels to Print"}</h4>
            </div>

            {loading ? (
              <p className="text-muted">{language === 'bn' ? "পণ্য লোড হচ্ছে..." : "Loading products..."}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className="form-label">{language === 'bn' ? "পণ্য নির্বাচন করুন" : "Select Product"}</label>
                  <select 
                    className="input-field"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                  >
                    <option value="">{language === 'bn' ? "একটি পণ্য নির্বাচন করুন..." : "Select a product..."}</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.barcode ? `(${item.barcode})` : language === 'bn' ? "(বারকোড নেই)" : "(No Barcode)"} - ৳{Number(item.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">{language === 'bn' ? "কপির সংখ্যা" : "Quantity / Copies"}</label>
                    <input 
                      type="number" 
                      className="input-field"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddToQueue}
                    style={{ height: '42px', padding: '0 1.5rem' }}
                  >
                    {language === 'bn' ? "তালিকায় যোগ করুন" : "Add to List"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Layout Settings Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', color: 'var(--secondary)' }}>
              <Settings size={20} />
              <h4 style={{ margin: 0 }}>{language === 'bn' ? "এ৪ পৃষ্ঠা লেআউট সেটিংস" : "A4 Page Settings"}</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label className="form-label">{language === 'bn' ? "কলাম সংখ্যা" : "Columns"}</label>
                <select 
                  className="input-field"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value))}
                >
                  <option value={2}>{language === 'bn' ? "২ কলাম (৫ মিমি গ্যাপ)" : "2 Columns (5mm Gap)"}</option>
                  <option value={3}>{language === 'bn' ? "৩ কলাম (স্ট্যান্ডার্ড)" : "3 Columns (Standard)"}</option>
                  <option value={4}>{language === 'bn' ? "৪ কলাম (ছোট)" : "4 Columns (Small)"}</option>
                </select>
              </div>

              <div>
                <label className="form-label">{language === 'bn' ? "লেবেলের উচ্চতা (মিমি)" : "Label Height (mm)"}</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={labelHeight}
                  onChange={(e) => setLabelHeight(Math.max(10, parseInt(e.target.value) || 25))}
                />
              </div>

              <div>
                <label className="form-label">{language === 'bn' ? "উপরের মার্জিন (মিমি)" : "Top Margin (mm)"}</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={topMargin}
                  onChange={(e) => setTopMargin(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="form-label">{language === 'bn' ? "পার্শ্ব মার্জিন (মিমি)" : "Side Margin (mm)"}</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={sideMargin}
                  onChange={(e) => setSideMargin(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                  <span>{language === 'bn' ? "নাম দেখান" : "Show Name"}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
                  <span>{language === 'bn' ? "দাম দেখান" : "Show Price"}</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Print Queue / Selection List */}
        {printQueue.length > 0 && (
          <div className="card no-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-main)' }}>
                <FileSpreadsheet size={20} />
                <h4 style={{ margin: 0 }}>{language === 'bn' ? "প্রিন্ট তালিকায় থাকা পণ্যসমূহ" : "Queued Products"}</h4>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button 
                  onClick={handleClearQueue} 
                  className="btn" 
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                >
                  <RotateCcw size={16} /> {language === 'bn' ? "তালিকা খালি করুন" : "Clear List"}
                </button>
                <button 
                  onClick={handlePrint} 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Printer size={16} /> {language === 'bn' ? "সব প্রিন্ট করুন (এ৪ পেজ)" : "Print All (A4 Page)"}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'bn' ? "পণ্যের নাম" : "Product Name"}</th>
                    <th>{language === 'bn' ? "বারকোড" : "Barcode"}</th>
                    <th>{language === 'bn' ? "বিক্রয় মূল্য" : "Price"}</th>
                    <th style={{ width: '150px' }}>{language === 'bn' ? "স্টিকার সংখ্যা" : "Labels to Print"}</th>
                    <th style={{ width: '60px', textAlign: 'right' }}>{language === 'bn' ? "অ্যাকশন" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {printQueue.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{item.barcode}</td>
                      <td>৳ {Number(item.price).toLocaleString()}</td>
                      <td>
                        <input 
                          type="number"
                          className="input-field"
                          style={{ padding: '4px 8px', height: '32px' }}
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1)
                            const updated = [...printQueue]
                            const idx = updated.findIndex(q => q.id === item.id)
                            if (idx > -1) {
                              updated[idx].quantity = val
                              setPrintQueue(updated)
                            }
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleRemoveFromQueue(item.id)}
                          style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none' }}
                          title="Remove from print list"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Real-time A4 Preview Card */}
        {printQueue.length > 0 && (
          <div>
            <h4 className="no-print" style={{ marginBottom: 'var(--space-3)' }}>{language === 'bn' ? "এ৪ পৃষ্ঠা প্রিভিউ (প্রিন্ট করার পূর্বে দেখে নিন)" : "A4 Page Preview"}</h4>
            
            {/* Printable A4 Container — auto height, multi-page safe */}
            <div className="printable-a4-sheet" style={{
              width: '210mm',
              minHeight: '297mm',
              height: 'auto',
              margin: '0 auto',
              backgroundColor: 'white',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              padding: `${topMargin}mm ${sideMargin}mm`,
              boxSizing: 'border-box',
              overflow: 'visible'
            }}>
              
              {/* Grid Wrapper */}
              <div className="barcode-grid" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '1mm',
                width: '100%'
              }}>
                {flattenedStickers.map((sticker, idx) => (
                  <BarcodeSticker 
                    key={`${sticker.id}-${idx}`}
                    name={sticker.name}
                    barcode={sticker.barcode}
                    price={sticker.price}
                    height={labelHeight}
                    showPrice={showPrice}
                    showName={showName}
                  />
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
