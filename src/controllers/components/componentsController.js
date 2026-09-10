import { ComponentModel } from '../../models/components/componentModel.js'
import { AccessService } from '../../services/AccessService.js'
import {
  createComponentSchemas,
  DeleteComponentSchemas,
  ListComponentSchema,
  updateComponentSchemas
} from '../../shemas/components/componentSchemas.js'
import { validateSchema } from '../../helpers/validateSchema.js'

export class ComponentController {
  static async createComponent (req, res) {
    try {
      const { id: brandId } = req.brand

      // Validate body
      const { data, error } = validateSchema(createComponentSchemas, req.body)

      if (error) {
        return res.status(400).json({ error })
      }

      // Validate the referenced global type exists
      const typeComponent = await AccessService.validateTypeComponentAccess({
        typeComponentId: data.type_component
      })

      if (!typeComponent) {
        return res.status(400).json({
          error: 'Invalid type component'
        })
      }

      // Create component
      const result = await ComponentModel.createComponent({
        brand_id: brandId,
        params: data
      })

      return res.status(201).json({
        message: 'CREATED SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async deleteComponent (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(
        DeleteComponentSchemas,
        req.params
      )
      if (error) {
        return res.status(400).json({ error })
      }

      // Delete Component
      const result = await ComponentModel.deleteComponent({
        brandId,
        params: data
      })

      if (!result) {
        return res.status(404).json({ error: 'not fount component' })
      }
      return res.status(201).json({
        message: 'DELETE SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async updateComponent (req, res) {
    try {
      const { id: brandId } = req.brand

      const { data, error } = validateSchema(updateComponentSchemas, req.body)

      if (error) {
        return res.status(400).json({ error })
      }
      // Validate the referenced global type exists
      const typeComponent = await AccessService.validateTypeComponentAccess({
        typeComponentId: data.type_component
      })

      if (!typeComponent) {
        return res.status(400).json({
          error: 'Invalid type component'
        })
      }

      const result = await ComponentModel.updateComponent({
        brandId,
        params: data
      })
      if (!result) {
        return res.status(404).json({ error: 'Not found' })
      }

      return res.status(200).json({
        message: 'UPDATED SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async listComponent (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(ListComponentSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await ComponentModel.listComponent({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        type_component: data.type_component
      })
      if (!result) {
        return res.status(404).json({ error: 'not fount component' })
      }
      return res.status(200).json({
        message: 'LIST SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }
}
