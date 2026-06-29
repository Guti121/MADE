import { TypeComponentesModel } from "../../models/components/typeComponentModel.js";
import {
  createTypeComponentSchema,
  deleteTypeComponentSchema,
  ListTypeComponentSchema,
  updateTypeComponentSchema,
} from "../../shemas/components/typeComponentSchemas.js";

export class TypeComponentsController {
  static async createTypeComponent(req, res) {
    try {
      const brand_id = req.brand;
      // ✅ validate input
      const params = createTypeComponentSchema.safeParse(req.body);

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      const result = await TypeComponentesModel.createTypeComponent({
        brand_id: brand_id.id,
        name: params.data.name,
      });

      if (!result) {
        return res.status(400).json({
          error: "Error creating type",
        });
      }

      return res.status(201).json({
        message: "CREATED SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Error creating type",
      });
    }
  }

  static async deleteTypeComponent(req, res) {
    try {
      const brand_id = req.brand;
      console.log(req.query.idType);

      const params = deleteTypeComponentSchema.safeParse(req.query);

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      const result = await TypeComponentesModel.deleteTypeComponent({
        brand_id: brand_id.id,
        id: params.data.idType,
      });

      if (!result) {
        return res.status(404).json({
          error: "Type component not found",
        });
      }

      return res.status(200).json({
        message: "DELETED SUCCESSFULLY",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Error deleting type",
      });
    }
  }

  static async ListTypeComponent(req, res) {
    try {
      const brand_id = req.brand;

      const params = ListTypeComponentSchema.safeParse(req.query);

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      const result = await TypeComponentesModel.listTypeComponent({
        brand_id: brand_id.id,
        page: params.data.page,
        limit: params.data.limit,
        name: params.data.name,
      });
      if (!result) {
        return res.status(404).json({
          error: "Type components not found",
        });
      }

      return res.status(200).json({
        message: "LIST SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Error list type",
      });
    }
  }

  static async updateTypeComponent(req, res) {
    try {
      const brand_id = req.brand;

      const params = updateTypeComponentSchema.safeParse(req.body);

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      const result = await TypeComponentesModel.updateTypeComponent({
        brand_id: brand_id.id,
        name: params.data.name,
        id: params.data.id,
      });

      if (!result) {
        return res.status(404).json({
          error: "Type components not found",
        });
      }

      return res.status(200).json({
        message: "UPDATE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error update type",
      });
    }
  }
}
