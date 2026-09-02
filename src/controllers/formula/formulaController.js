import { validateSchema } from "../../helpers/validateSchema.js";
import { FormulaModel } from "../../models/formula/formulaModel.js";
import { BussinesLogicFormula } from "../../services/formula/bussinesLogicFormula.js";
import { FormulaService } from "../../services/formula/formulaService.js";
import {
  createFormulaSchema,
  deleteFormulaSchema,
  ListFormulaSchema,
  ListFormulaSchemalocation,
  previewFormulaSchema,
} from "../../shemas/formula/formulaSchemas.js";

export class formulaController {
  // Estimated build cost from the multi-location average component price.
  // Shown to the user while building a formula so they can set its prices.
  static async previewFormula(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(previewFormulaSchema, req.body);

      if (error) {
        return res.status(400).json({ error });
      }

      const lines = await BussinesLogicFormula.buildFormulaLines({
        data,
        userId,
      });

      return res.status(200).json({
        message: "FORMULA PREVIEW",
        result: {
          essence: {
            type: lines.essenceLine.type_name,
            quantityInBase: lines.essenceLine.quantityInBase,
            unit: lines.essenceLine.unit,
            cost: null,
            note: "Sin coste por ahora; se define al facturar la esencia concreta",
          },
          components: lines.componentLines.map((c) => ({
            component_id: c.component_id,
            name: c.name,
            quantityInBase: c.quantityInBase,
            unit: c.unit,
            avg_cost_per_base: c.avg_cost_per_base,
            sedes_con_stock: c.sedes_con_stock,
            line_cost: c.line_cost,
            has_price: c.has_price,
          })),
          totales: {
            base_quantity: lines.sumTotalUnits,
            costo_total: lines.costoTotal,
            componentes_sin_precio: lines.componentesSinPrecio,
          },
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "Error with preview" });
    }
  }

  static async createFormula(req, res) {
    try {
      const { id: userId } = req.user;
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(createFormulaSchema, req.body);

      if (error) {
        return res.status(400).json({ error });
      }

      const lines = await BussinesLogicFormula.buildFormulaLines({
        data,
        userId,
      });

      const result = await FormulaService.createFormula({
        userId,
        brandId,
        data,
        lines,
      });

      if (!result) {
        return res.status(400).json({
          error: "error creation",
        });
      }

      return res.status(201).json({
        message: "FORMULA CREATED",
        result,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "Error with creation" });
    }
  }

  static async deleteFormula(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(deleteFormulaSchema, req.query);

      const result = await FormulaModel.deleteFormula({ brandId, data });

      if (!result) {
        return res.status(404).json({
          error: "error Not Found",
        });
      }
      res.status(200).json({
        message: "FORMULA DELETED",
        result,
      });
    } catch (error) {
      console.log(error);
      res.status(404).json({ error: "Error with delete" });
    }
  }

  static async listFormula(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(ListFormulaSchema, req.query);

      if (error) {
        return res.status(400).json({ error });
      }

      const result = await FormulaModel.listStock({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        quantity: data.quantity,
      });
      if (!result) {
        return res.status(404).json({ error: "not fount component" });
      }
      return res.status(200).json({
        message: "LIST SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
  static async listFormuByLocation(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(
        ListFormulaSchemalocation,
        req.query,
      );
      console.log(data);
      if (error) {
        console.log(error);
        return res.status(400).json({ error });
      }

      const result = await FormulaModel.listFormulaLocation({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        location_id: data.id,
        name: data.name,
        quantity: data.quantity,
      });
      if (!result) {
        return res.status(404).json({ error: "not fount component" });
      }
      return res.status(200).json({
        message: "LIST SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.log(error, "error");
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}
