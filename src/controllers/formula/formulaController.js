import { validateSchema } from "../../helpers/validateSchema.js";
import { FormulaModel } from "../../models/formula/formulaModel.js";
import { BussinesLogicFormula } from "../../services/formula/bussinesLogicFormula.js";
import { FormulaService } from "../../services/formula/formulaService.js";
import { BussinesLogicStock } from "../../services/stock/bussinesLogicStock.js";
import {
  createFormulaSchema,
  deleteFormulaSchema,
  ListFormulaSchema,
  retrieveFormulaComponentsSchema,
} from "../../shemas/formula/formulaSchemas.js";

export class formulaController {
  static async createFormula(req, res) {
    try {
      const { id: userId } = req.user;
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(createFormulaSchema, req.body);

      const convertUnit = await BussinesLogicFormula.convertUnitComponents({
        data,
        userId,
      });

      console.log(convertUnit);

      const result = await FormulaService.createFormula({
        userId,
        brandId,
        data,
        convertUnit,
      });

      if (!result) {
        return res.status(400).json({
          error: "error creation",
        });
      }

      res.status(201).json({
        message: "FORMULA CREATED",
        result,
      });
    } catch {
      res.status(400).json({ error: "Error with creation" });
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
}
