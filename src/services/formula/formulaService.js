import { pool } from "../../config/db.js";
import { FormulaModel } from "../../models/formula/formulaModel.js";

export class FormulaService {
  static async createFormula({ userId, brandId, data, convertUnit }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const formula = await FormulaModel.createFormula(client, {
        userId,
        brandId,
        data,
        convertUnit,
      });

      if (!formula) {
        throw new Error("Formula has error");
      }
      console.log(formula);
      const components = await FormulaModel.createFormulaComponent(client, {
        formulaId: formula.id,
        convertUnit,
      });

      await client.query("COMMIT");

      return { formula, components };
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
