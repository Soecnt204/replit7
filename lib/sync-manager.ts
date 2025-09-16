import { createClient } from "@/lib/supabase/client"
import { offlineStorage } from "./offline-storage"

class SyncManager {
  private supabase = createClient()
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : false
  private syncInProgress = false

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        this.syncToServer()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
      })
    }
  }

  async syncToServer(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true
    console.log("[v0] Starting sync to server...")

    try {
      const syncQueue = await offlineStorage.getSyncQueue()

      for (const item of syncQueue) {
        await this.processSyncItem(item)
        await offlineStorage.markSynced(item.id)
      }

      console.log("[v0] Sync completed successfully")
    } catch (error) {
      console.error("[v0] Sync failed:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    const { storeName, operation, data } = item

    try {
      switch (operation) {
        case "upsert":
          await this.supabase.from(storeName).upsert(data)
          break
        case "delete":
          // For products, use soft delete (set is_active = false)
          if (storeName === "products") {
            await this.supabase.from(storeName).update({ is_active: false }).eq("id", data.id)
          } else {
            // For other tables, use hard delete
            await this.supabase.from(storeName).delete().eq("id", data.id)
          }
          break
      }
    } catch (error) {
      console.error(`[v0] Failed to sync ${operation} for ${storeName}:`, error)
      throw error
    }
  }

  async syncFromServer(): Promise<void> {
    if (!this.isOnline) return

    console.log("[v0] Syncing from server...")

    const tables = [
      "categories",
      "products",
      "shopkeepers",
      "receipts",
      "receipt_items",
      "returns",
      "return_items",
      "settings",
      "payment_history",
      "stock_movements",
    ]

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase.from(table).select("*")

        if (error) throw error

        if (data) {
          for (const item of data) {
            await offlineStorage.save(table, item)
          }
        }
      } catch (error) {
        console.error(`[v0] Failed to sync ${table} from server:`, error)
      }
    }

    console.log("[v0] Initial sync from server completed")
  }

  // CRUD operations that work offline-first
  async saveProduct(product: any): Promise<void> {
    if (!product.id) {
      product.id = crypto.randomUUID()
    }
    await offlineStorage.save("products", product)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async saveCategory(category: any): Promise<void> {
    if (!category.id) {
      category.id = crypto.randomUUID()
    }
    await offlineStorage.save("categories", category)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async saveShopkeeper(shopkeeper: any): Promise<void> {
    if (!shopkeeper.id) {
      shopkeeper.id = crypto.randomUUID()
    }
    await offlineStorage.save("shopkeepers", shopkeeper)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async saveReceipt(receipt: any): Promise<void> {
    if (!receipt.id) {
      receipt.id = crypto.randomUUID()
    }
    if (!receipt.receipt_number) {
      const receipts = await this.getReceipts()
      const maxNumber = receipts.reduce((max, r) => {
        const num = Number.parseInt(r.receipt_number?.replace("RCP", "") || "0")
        return Math.max(max, num)
      }, 0)
      receipt.receipt_number = `RCP${String(maxNumber + 1).padStart(3, "0")}`
    }
    await offlineStorage.save("receipts", receipt)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async saveReturn(returnItem: any): Promise<void> {
    if (!returnItem.id) {
      returnItem.id = crypto.randomUUID()
    }
    if (!returnItem.return_number) {
      const returns = await this.getReturns()
      const maxNumber = returns.reduce((max, r) => {
        const num = Number.parseInt(r.return_number?.replace("RET", "") || "0")
        return Math.max(max, num)
      }, 0)
      returnItem.return_number = `RET${String(maxNumber + 1).padStart(3, "0")}`
    }
    await offlineStorage.save("returns", returnItem)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async savePaymentHistory(paymentHistory: any): Promise<void> {
    if (!paymentHistory.id) {
      paymentHistory.id = crypto.randomUUID()
    }
    await offlineStorage.save("payment_history", paymentHistory)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async saveReceiptItem(receiptItem: any): Promise<void> {
    if (!receiptItem.id) {
      receiptItem.id = crypto.randomUUID()
    }
    await offlineStorage.save("receipt_items", receiptItem)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    await offlineStorage.delete("products", productId)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await offlineStorage.delete("categories", categoryId)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async deleteShopkeeper(shopkeeperId: string): Promise<void> {
    await offlineStorage.delete("shopkeepers", shopkeeperId)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async deleteReceipt(receiptId: string): Promise<void> {
    await offlineStorage.delete("receipts", receiptId)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  async deleteReturn(returnId: string): Promise<void> {
    await offlineStorage.delete("returns", returnId)
    if (this.isOnline) {
      await this.syncToServer()
    }
  }

  // Get operations (offline-first)
  async getProducts(): Promise<any[]> {
    return await offlineStorage.getAll("products")
  }

  async getCategories(): Promise<any[]> {
    return await offlineStorage.getAll("categories")
  }

  async getShopkeepers(): Promise<any[]> {
    return await offlineStorage.getAll("shopkeepers")
  }

  async getReceipts(): Promise<any[]> {
    const receipts = await offlineStorage.getAll("receipts")
    const shopkeepers = await this.getShopkeepers()
    const receiptItems = await offlineStorage.getAll("receipt_items")
    
    // Transform receipts to match UI expectations and include customer details
    return receipts.map((receipt: any) => {
      const shopkeeper = shopkeepers.find((s: any) => s.id === receipt.shopkeeper_id)
      const items = receiptItems.filter((item: any) => item.receipt_id === receipt.id).map((item: any) => ({
        productName: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total_price
      }))
      
      // Properly compute pending amount and balance (don't double-subtract returns!)
      const finalTotal = receipt.final_total || 0
      const amountReceived = receipt.amount_received || 0
      const returnTotal = receipt.return_total || 0
      const computedPendingAmount = Math.max(finalTotal - amountReceived, 0) // Don't subtract returnTotal again!
      
      return {
        ...receipt,
        // Map database fields to UI fields
        total: finalTotal,
        receivedAmount: amountReceived,
        changeAmount: Math.max(0, amountReceived - finalTotal),
        // Properly compute pending amount (key fix - no double subtraction!)
        pendingAmount: computedPendingAmount,
        balance: computedPendingAmount, // Alias for UI components that use 'balance'
        // Add missing UI aliases
        receiptNumber: receipt.receipt_number, // Critical for UI compatibility
        // Add customer details from shopkeeper
        customerName: shopkeeper?.name || 'Unknown Customer',
        customerPhone: shopkeeper?.contact || '',
        // Add receipt items with proper field mapping including productId
        items: items.length > 0 ? receiptItems.filter((item: any) => item.receipt_id === receipt.id).map((item: any) => ({
          productId: item.product_id, // Critical for return functionality
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_price
        })) : [],
        returnItems: [], // TODO: Add return items if needed
        // Keep original database fields for compatibility
        final_total: finalTotal,
        amount_received: amountReceived,
        pending_amount: computedPendingAmount, // Use computed value, not database value
        shopkeeper_id: receipt.shopkeeper_id,
        // Additional fields for UI
        subtotal: receipt.subtotal || 0,
        discount: 0, // TODO: Add discount field to database if needed
        returnTotal: returnTotal,
        tax: 0,
        paymentMethod: 'cash', // Default payment method
        date: receipt.created_at,
        status: computedPendingAmount > 0 ? 'partial' : 'paid', // Use computed pending amount for status
        notes: ''
      }
    })
  }

  async getReturns(): Promise<any[]> {
    return await offlineStorage.getAll("returns")
  }

  async createOrUpdateShopkeeper(shopkeeperData: {
    name: string
    phone: string
    receiptNumber: string
    receiptDate: string
    totalAmount: number
    amountReceived: number
    pendingAmount: number
  }): Promise<string> {
    try {
      const existingShopkeepers = await this.getShopkeepers()
      const existingShopkeeper = existingShopkeepers.find(
        (s) => s.name === shopkeeperData.name && s.contact === shopkeeperData.phone,
      )

      let shopkeeperId: string

      if (existingShopkeeper) {
        // Update existing shopkeeper's balance and total purchases
        const updatedShopkeeper = {
          ...existingShopkeeper,
          current_balance: (existingShopkeeper.current_balance || 0) + shopkeeperData.pendingAmount,
          total_purchases: (existingShopkeeper.total_purchases || 0) + shopkeeperData.totalAmount,
          updated_at: new Date().toISOString(),
        }
        await this.saveShopkeeper(updatedShopkeeper)
        shopkeeperId = existingShopkeeper.id
      } else {
        // Create new shopkeeper with initial payment data
        const newShopkeeper = {
          id: crypto.randomUUID(),
          name: shopkeeperData.name,
          contact: shopkeeperData.phone,
          address: "",
          credit_limit: 0,
          current_balance: shopkeeperData.pendingAmount,
          total_purchases: shopkeeperData.totalAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await this.saveShopkeeper(newShopkeeper)
        shopkeeperId = newShopkeeper.id
      }


      console.log(`[v0] Successfully updated shopkeeper ${shopkeeperData.name} with payment tracking:`)
      console.log(`[v0] - Total purchases: ${shopkeeperData.totalAmount}`)
      console.log(`[v0] - Amount received: ${shopkeeperData.amountReceived}`)
      console.log(`[v0] - Pending amount: ${shopkeeperData.pendingAmount}`)

      return shopkeeperId
    } catch (error) {
      console.error("[v0] Failed to create/update shopkeeper:", error)
      throw error
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline
  }

  async manualSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline")
    }
    await this.syncToServer()
    await this.syncFromServer()
  }
}

export const syncManager = new SyncManager()
