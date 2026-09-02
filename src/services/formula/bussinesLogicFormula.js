import { AccessService } from "../AccessService.js";
import { BussinesLogicStock } from "../stock/bussinesLogicStock.js";
import { StockModel } from "../../models/stock/stockModel.js";
import { TypeComponentesModel } from "../../models/components/typeComponentModel.js";

const ESSENCE_CODE = "ESSENCE";

export class BussinesLogicFormula {
  // Builds every line of a formula (the mandatory essence type slot + the
  // selected components), converts quantities to the brand's base unit and
  // computes the estimated build cost from the multi-location average price.
  //
  // Shared by the preview endpoint and by create.
  static async buildFormulaLines({ data, userId }) {
    const { essence, components = [] } = data;

    // --- essence line: a type slot, no concrete component yet ---
    const essenceType = await TypeComponentesModel.findByCode(ESSENCE_CODE);
    if (!essenceType) {
      throw new Error("Essence type is not configured (type_components.code = 'ESSENCE')");
    }

    const essenceUnits = await BussinesLogicStock.convertMeasuresStock({
      userId,
      quantity_base: essence.quantity,
      unit: essence.unit,
    });
    if (!essenceUnits) {
      throw new Error("Error with essence units");
    }

    const essenceLine = {
      type_component_id: essenceType.id,
      type_name: essenceType.name,
      quantityInBase: Number(essenceUnits.quantityInBase),
      unit: essenceUnits.units,
    };

    let sumTotalUnits = Number(essenceUnits.quantityInBase);

    // --- component lines ---
    const componentLines = [];
    const componentesSinPrecio = [];
    let costoTotal = 0;

    for (const component of components) {
      const validate = await AccessService.validateComponentAccess({
        userId,
        componentId: component.component_id,
      });
      if (!validate) {
        throw new Error("Error with Component");
      }

      const units = await BussinesLogicStock.convertMeasuresStock({
        userId,
        quantity_base: component.quantity,
        unit: component.unit,
      });
      if (!units) {
        throw new Error("Error with units");
      }

      const quantityInBase = Number(units.quantityInBase);
      sumTotalUnits += quantityInBase;

      // multi-location simple average of the per-base-unit price
      const price = await StockModel.avgPriceAcrossLocations({
        componentId: component.component_id,
      });

      const rawAvg = price?.avg_cost_per_base;
      const hasPrice = rawAvg !== null && rawAvg !== undefined;
      const avgCostPerBase = hasPrice
        ? Number(Number(rawAvg).toFixed(2))
        : null;
      const lineCost = hasPrice
        ? Math.round(avgCostPerBase * quantityInBase)
        : 0;

      if (hasPrice) {
        costoTotal += lineCost;
      } else {
        componentesSinPrecio.push(component.component_id);
      }

      componentLines.push({
        component_id: component.component_id,
        name: validate.name,
        quantityInBase,
        unit: units.units,
        avg_cost_per_base: avgCostPerBase,
        sedes_con_stock: Number(price?.sedes_con_stock ?? 0),
        line_cost: lineCost,
        has_price: hasPrice,
      });
    }

    return {
      essenceLine,
      componentLines,
      sumTotalUnits,
      costoTotal: Math.round(costoTotal),
      componentesSinPrecio,
    };
  }
}
