/// FORMULA COMPONENTS

import { validateSchema } from '../../helpers/validateSchema.js'
import { FormulaComponentsModel } from '../../models/formula/FormulaComponentsModel.js'
import { retrieveFormulaComponentsSchema } from '../../shemas/formula/formulaSchemas.js'

export class FormulaComponentsController {
  static async retrieveComponents (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(
        retrieveFormulaComponentsSchema,
        req.query
      )
      if (error) {
        return res.status(400).json({ error })
      }

      const result = await FormulaComponentsModel.retrieveComponents({
        brandId,
        data
      })
      if (!result || result.length === 0) {
        return res.status(404).json({
          error: 'error not found'
        })
      }

      res.status(201).json({
        message: 'COMPONENTS FORMULA',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }
}
