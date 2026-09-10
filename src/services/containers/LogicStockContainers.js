import { BrandModel } from '../../models/brandModel.js'
import { AppError } from '../../helpers/AppError.js'

export class BussinesLogicStockContainer {
  // Convert measures to G or ml
  static async convertValueUnits ({
    quantity_base, // coerce
    unit, // coerce
    value, // coerce
    wholesale_price,
    consumer_price
  }) {
    let purchaseUnitPrice
    let quantityInBase
    let wholesaleUnitPrice
    let consumerUnitPrice

    // LIQUID SYSTEM
    if (unit === 'total') {
      quantityInBase = quantity_base
      purchaseUnitPrice = Number(value) / Number(quantity_base)
      wholesaleUnitPrice = Number(wholesale_price) / Number(quantity_base)
      consumerUnitPrice = Number(consumer_price) / Number(quantity_base)
      return {
        purchaseUnitPrice,
        quantityInBase,
        wholesaleUnitPrice,
        consumerUnitPrice
      }
    }

    // WEIGHT SYSTEM
    else {
      if (unit === 'unit') {
        {
          return {
            purchaseUnitPrice: value,
            quantityInBase: quantity_base,
            wholesaleUnitPrice: wholesale_price,
            consumerUnitPrice: consumer_price
          }
        }
      } else {
        throw new AppError('Error with unit')
      }
    }

    // Prevent division by zero
    if (quantityInBase <= 0 || value <= 0 || !unit) {
      throw new AppError('Quantity must be greater than 0')
    }
  }

  static async calculeteAVGPrice ({ stock, data }) {
    const currentQuantity = Number(stock.quantity_base)

    const currentAvgPrice = Number(stock.avg_price)

    const incomingQuantity = Number(data.quantityInBase)
    const incomingAvgPrice = Number(data.purchaseUnitPrice)

    const currentTotalValue = currentQuantity * currentAvgPrice

    const incomingTotalValue = incomingQuantity * incomingAvgPrice

    const newQuantity = currentQuantity + incomingQuantity

    const newTotalValue = currentTotalValue + incomingTotalValue

    const newAvgPrice = newTotalValue / newQuantity

    return { newAvgPrice, newQuantity, newTotalValue }
  }

  static async registerLoss ({ stock, unitsPrice }) {
    const currentStock = Number(stock.quantity_base)

    const lostUnitsStock = Number(unitsPrice.quantityInBase)

    if (currentStock < lostUnitsStock) {
      throw new AppError('Stock is lower than loss units')
    }

    return currentStock - lostUnitsStock
  }

  static async registerAdjustment ({ stock, unitsPrice }) {
    const currentStock = Number(stock.quantity_base)

    const adjustUnitsStock = Number(unitsPrice.quantityInBase)

    if (currentStock <= 0) {
      throw new AppError('Stock is too low')
    }

    return currentStock + adjustUnitsStock
  }
}
