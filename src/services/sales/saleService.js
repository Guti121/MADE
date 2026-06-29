import { FormulaModel } from "../../models/formula/formulaModel.js";
import { LogicBussinesSale } from "./logicBussinesSale.js";
import { SaleTransactionService } from "./saleTransactionService.js";

export class SaleService {
  static async createSale({ userId, data, brandId }) {
    for (const item of data.sales_items) {
      const formula = await FormulaModel.retrieveModel({
        id: item.formula_id,
        brandId,
      });

      if (!formula) {
        throw new Error(`Formula ${item.formula_id} not found`);
      }
    }
    await LogicBussinesSale.validateStock({
      data,
    });

    const calculatedSale = await LogicBussinesSale.pricesComponents({
      data,
    });

    // 4. Create transaction
    const result = await SaleTransactionService.createSale({
      userId,
      data: calculatedSale,
    });
    console.log(calculatedSale);

    return calculatedSale;
  }
}
