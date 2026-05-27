import { validateComponentAccess } from "../../middleware/accessMiddleware.js";
import { AccessService } from "../AccessService.js";
import { BussinesLogicStock } from "../stock/bussinesLogicStock.js";

export class BussinesLogicFormula {
  static async convertUnitComponents({ data, userId }) {
    const listComponents = [];
    let sumTotalUnits = 0;

    const { components } = data;

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

      sumTotalUnits += Number(units.quantityInBase);
      listComponents.push({
        ...component,
        quantityInBase: units.quantityInBase,
        unit: units.units,
      });
      console.log(listComponents);
    }

    return { listComponents, sumTotalUnits };
  }
}
