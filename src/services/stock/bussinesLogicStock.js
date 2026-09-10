import { BrandModel } from '../../models/brandModel.js'
import { AppError } from '../../helpers/AppError.js'

export class BussinesLogicStock {
  // Convert measures to G or ml
  static async convertMeasuresStock ({
    purchase_price,
    quantity_base, // coerce
    unit, // coerce
    userId, // coerce
    wholesale_price,
    consumer_price
  }) {
    const { weight } = await BrandModel.viewBrand({ userId })
    let quantityInBase
    let units

    // LIQUID SYSTEM
    if (!weight) {
      if (unit === 'L') {
        quantityInBase = quantity_base * 1000
        units = 'ml'
      } else if (unit === 'ml') {
        quantityInBase = quantity_base
        units = 'ml'
      } else {
        throw new AppError('Invalid liquid unit')
      }
    }

    // WEIGHT SYSTEM
    else {
      if (unit === 'kg') {
        quantityInBase = quantity_base * 1000
        units = 'g'
      } else if (unit === 'g') {
        quantityInBase = quantity_base
        units = 'g'
      } else {
        throw new AppError('Invalid weight unit')
      }
    }

    // Prevent division by zero
    if (quantityInBase <= 0) {
      throw new AppError('Quantity must be greater than 0')
    }

    // PRICE PER BASE UNIT
    const purchaseUnitPrice = Number(purchase_price) / Number(quantityInBase)

    const wholesaleUnitPrice = Number(wholesale_price) / Number(quantityInBase)

    const consumerUnitPrice = Number(consumer_price) / Number(quantityInBase)
    return {
      quantityInBase,

      purchaseUnitPrice,

      wholesaleUnitPrice,

      consumerUnitPrice,

      units
    }
  }

  static async calculeteAVGPrice ({ stock, data }) {
    const currentQuantity = Number(stock.quantity_base || stock.quantity)

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

    if (currentStock < 0) {
      throw new AppError('Stock is too low')
    }

    return currentStock + adjustUnitsStock
  }
}
