interface ReceiptItem {
  productName: string
  quantity: number
  price: number
  total: number
}

interface ReturnItem {
  productId: number
  productName: string
  quantity: number
  amount: number
  originalPrice: number
}

interface Receipt {
  id: string
  customerName: string
  customerPhone: string
  amount: number
  receivedAmount?: number
  changeAmount?: number
  items: ReceiptItem[]
  returnItems?: ReturnItem[]
  subtotal: number
  discount: number
  returnTotal?: number
  tax: number
  total: number
  paymentMethod: string
  date: string
  status: string
  notes: string
}

export class ReceiptImageGenerator {
  static async generateReceiptImage(receipt: Receipt): Promise<void> {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Unable to get canvas context')
      }

      // Set canvas dimensions
      canvas.width = 800
      canvas.height = 1100 // Start with a reasonable height, will adjust if needed

      // Set background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set text properties
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'left'
      
      let y = 50 // Starting Y position
      const leftMargin = 50
      const rightMargin = canvas.width - 50
      const lineHeight = 25

      // Helper function to draw centered text
      const drawCenteredText = (text: string, yPos: number, fontSize: number = 16, fontWeight: string = 'normal') => {
        ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(text, canvas.width / 2, yPos)
        ctx.textAlign = 'left'
      }

      // Helper function to draw right-aligned text
      const drawRightText = (text: string, yPos: number, fontSize: number = 16) => {
        ctx.font = `${fontSize}px Arial, sans-serif`
        ctx.textAlign = 'right'
        ctx.fillText(text, rightMargin, yPos)
        ctx.textAlign = 'left'
      }

      // Header
      ctx.fillStyle = '#0066cc'
      drawCenteredText('HZ Shop', y, 32, 'bold')
      y += 35
      
      ctx.fillStyle = '#6b7280'
      drawCenteredText('Professional Retail Management', y, 14)
      y += 30

      // Draw separator line
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(rightMargin, y)
      ctx.stroke()
      y += 30

      // Receipt Title
      ctx.fillStyle = '#000000'
      drawCenteredText('SALES RECEIPT', y, 18, 'bold')
      y += 40

      // Customer Information Section
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.fillText('Customer Information', leftMargin, y)
      y += 25

      ctx.font = '14px Arial, sans-serif'
      ctx.fillText(`Name: ${receipt.customerName}`, leftMargin, y)
      y += lineHeight
      ctx.fillText(`Phone: ${receipt.customerPhone}`, leftMargin, y)
      y += lineHeight
      ctx.fillText(`Date: ${new Date(receipt.date).toLocaleString()}`, leftMargin, y)
      y += lineHeight
      ctx.fillText(`Receipt #: ${receipt.id}`, leftMargin, y)
      y += lineHeight
      ctx.fillText(`Status: ${receipt.status}`, leftMargin, y)
      y += 35

      // Items Section
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.fillText('Items', leftMargin, y)
      y += 25

      // Items table header
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(rightMargin, y)
      ctx.stroke()
      y += 15

      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.fillText('Product', leftMargin, y)
      ctx.textAlign = 'center'
      ctx.fillText('Qty', leftMargin + 300, y)
      ctx.textAlign = 'right'
      ctx.fillText('Price', leftMargin + 450, y)
      ctx.fillText('Total', rightMargin, y)
      ctx.textAlign = 'left'
      y += 10

      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(rightMargin, y)
      ctx.stroke()
      y += 20

      // Items
      ctx.font = '14px Arial, sans-serif'
      receipt.items.forEach((item) => {
        // Product name (truncate if too long)
        const productName = item.productName.length > 35 ? 
          item.productName.substring(0, 35) + '...' : item.productName
        ctx.fillText(productName, leftMargin, y)
        
        // Quantity
        ctx.textAlign = 'center'
        ctx.fillText(item.quantity.toString(), leftMargin + 300, y)
        
        // Price
        ctx.textAlign = 'right'
        ctx.fillText(`PKR ${item.price.toLocaleString()}`, leftMargin + 450, y)
        
        // Total
        ctx.fillText(`PKR ${item.total.toLocaleString()}`, rightMargin, y)
        ctx.textAlign = 'left'
        
        y += lineHeight
      })

      // Return Items (if any)
      if (receipt.returnItems && receipt.returnItems.length > 0) {
        y += 20
        ctx.fillStyle = '#ea580c'
        ctx.font = 'bold 16px Arial, sans-serif'
        ctx.fillText('Return Items', leftMargin, y)
        y += 25

        ctx.strokeStyle = '#fed7aa'
        ctx.beginPath()
        ctx.moveTo(leftMargin, y)
        ctx.lineTo(rightMargin, y)
        ctx.stroke()
        y += 15

        ctx.font = 'bold 14px Arial, sans-serif'
        ctx.fillText('Product', leftMargin, y)
        ctx.textAlign = 'center'
        ctx.fillText('Qty', leftMargin + 300, y)
        ctx.textAlign = 'right'
        ctx.fillText('Price', leftMargin + 450, y)
        ctx.fillText('Total', rightMargin, y)
        ctx.textAlign = 'left'
        y += 10

        ctx.strokeStyle = '#fed7aa'
        ctx.beginPath()
        ctx.moveTo(leftMargin, y)
        ctx.lineTo(rightMargin, y)
        ctx.stroke()
        y += 20

        ctx.font = '14px Arial, sans-serif'
        receipt.returnItems.forEach((item) => {
          const productName = item.productName.length > 35 ? 
            item.productName.substring(0, 35) + '...' : item.productName
          ctx.fillText(productName, leftMargin, y)
          
          ctx.textAlign = 'center'
          ctx.fillText(item.quantity.toString(), leftMargin + 300, y)
          
          ctx.textAlign = 'right'
          ctx.fillText(`PKR ${(item.amount / item.quantity).toLocaleString()}`, leftMargin + 450, y)
          ctx.fillText(`-PKR ${item.amount.toLocaleString()}`, rightMargin, y)
          ctx.textAlign = 'left'
          
          y += lineHeight
        })
      }

      // Payment Summary
      y += 30
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.fillText('Payment Summary', leftMargin, y)
      y += 25

      // Draw summary box
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      const summaryStartY = y
      
      ctx.font = '14px Arial, sans-serif'
      
      // Subtotal
      ctx.fillText('Subtotal:', leftMargin + 20, y)
      drawRightText(`PKR ${(receipt.subtotal || 0).toLocaleString()}`, y, 14)
      y += lineHeight

      // Discount
      if ((receipt.discount || 0) > 0) {
        ctx.fillText('Discount:', leftMargin + 20, y)
        drawRightText(`-PKR ${(receipt.discount || 0).toLocaleString()}`, y, 14)
        y += lineHeight
      }

      // Returns
      if (receipt.returnTotal && receipt.returnTotal > 0) {
        ctx.fillStyle = '#ea580c'
        ctx.fillText('Returns:', leftMargin + 20, y)
        drawRightText(`-PKR ${receipt.returnTotal.toLocaleString()}`, y, 14)
        ctx.fillStyle = '#000000'
        y += lineHeight
      }

      // Tax
      if ((receipt.tax || 0) > 0) {
        ctx.fillText('Tax:', leftMargin + 20, y)
        drawRightText(`PKR ${(receipt.tax || 0).toLocaleString()}`, y, 14)
        y += lineHeight
      }

      // Separator line
      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(leftMargin + 20, y + 5)
      ctx.lineTo(rightMargin - 20, y + 5)
      ctx.stroke()
      y += 20

      // Total
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.fillText('Total:', leftMargin + 20, y)
      drawRightText(`PKR ${(receipt.total || 0).toLocaleString()}`, y, 18)
      y += 30

      // Payment details
      if (receipt.receivedAmount) {
        ctx.strokeStyle = '#e5e7eb'
        ctx.beginPath()
        ctx.moveTo(leftMargin + 20, y)
        ctx.lineTo(rightMargin - 20, y)
        ctx.stroke()
        y += 15

        ctx.font = '14px Arial, sans-serif'
        ctx.fillText('Received Amount:', leftMargin + 20, y)
        drawRightText(`PKR ${receipt.receivedAmount.toLocaleString()}`, y, 14)
        y += lineHeight

        if (receipt.changeAmount && receipt.changeAmount > 0) {
          ctx.fillText('Change:', leftMargin + 20, y)
          drawRightText(`PKR ${receipt.changeAmount.toLocaleString()}`, y, 14)
          y += lineHeight
        }
      }

      // Draw the summary box
      ctx.strokeRect(leftMargin, summaryStartY - 10, rightMargin - leftMargin, y - summaryStartY + 10)

      // Notes
      if (receipt.notes) {
        y += 30
        ctx.font = 'bold 16px Arial, sans-serif'
        ctx.fillText('Notes', leftMargin, y)
        y += 25

        ctx.font = '14px Arial, sans-serif'
        ctx.fillStyle = '#6b7280'
        
        // Word wrap for notes
        const words = receipt.notes.split(' ')
        let line = ''
        const maxWidth = rightMargin - leftMargin - 40
        
        words.forEach((word) => {
          const testLine = line + word + ' '
          const testWidth = ctx.measureText(testLine).width
          if (testWidth > maxWidth && line !== '') {
            ctx.fillText(line, leftMargin + 20, y)
            line = word + ' '
            y += lineHeight
          } else {
            line = testLine
          }
        })
        if (line !== '') {
          ctx.fillText(line, leftMargin + 20, y)
          y += lineHeight
        }
      }

      // Footer
      y += 40
      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(rightMargin, y)
      ctx.stroke()
      y += 25

      ctx.fillStyle = '#6b7280'
      drawCenteredText('Thank you for your business!', y, 14)
      y += 20
      drawCenteredText('HZ Shop - Your trusted retail partner', y, 12)

      // Adjust canvas height to fit content
      if (y + 50 > canvas.height) {
        const newCanvas = document.createElement('canvas')
        const newCtx = newCanvas.getContext('2d')
        if (newCtx) {
          newCanvas.width = canvas.width
          newCanvas.height = y + 50
          newCtx.drawImage(canvas, 0, 0)
          canvas.width = newCanvas.width
          canvas.height = newCanvas.height
          const imgData = newCtx.getImageData(0, 0, newCanvas.width, newCanvas.height)
          ctx.putImageData(imgData, 0, 0)
        }
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `HZ-Shop-Receipt-${receipt.id}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')

    } catch (error) {
      console.error('Failed to generate receipt image:', error)
      throw error
    }
  }
}