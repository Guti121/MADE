import { validateSchema } from "../../helpers/validateSchema.js";
import { TypeContainersModel } from "../../models/containers/typeContainerModel.js";
import {
  createTypeContainerSchema,
  deleteTypeContainerSchema,
  ListTypeContainerSchema,
  updateTypeContainerSchema,
} from "../../shemas/containers/typeContainersSchemas.js";

export class TypeContainerController {
  static async createTypeContainer(req, res) {
    try {
      const { id: brand_id } = req.brand;
      // ✅ validate input
      const { data, error } = validateSchema(
        createTypeContainerSchema,
        req.body,
      );
      if (error) {
        return res.status(400).json({ error });
      }

      const result = await TypeContainersModel.createTypeContainer({
        brand_id,
        name: data.name,
        description: data.description,
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

  static async deleteTypeContainer(req, res) {
    try {
      const { id: brand_id } = req.brand;

      const { data, error } = validateSchema(
        deleteTypeContainerSchema,
        req.query,
      );

      if (error) {
        return res.status(400).json({ error });
      }

      const result = await TypeContainersModel.deleteTypeContainer({
        brand_id,
        id: data.idType,
      });

      if (!result) {
        return res.status(404).json({
          error: "Type Container not found",
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

  static async ListTypeContainer(req, res) {
    try {
      const { id: brand_id } = req.brand;

      const { data, error } = validateSchema(
        ListTypeContainerSchema,
        req.query,
      );

      if (error) {
        return res.status(400).json({ error });
      }
      const result = await TypeContainersModel.listTypeContainer({
        brand_id,
        page: data.page,
        limit: data.limit,
        name: data.name,
      });
      if (!result) {
        return res.status(404).json({
          error: "Type Containers not found",
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

  static async updateTypeContainer(req, res) {
    try {
      const { id: brand_id } = req.brand;

      const { data, error } = validateSchema(
        updateTypeContainerSchema,
        req.body,
      );

      if (error) {
        return res.status(400).json({ error });
      }
      const result = await TypeContainersModel.updateTypeContainer({
        brand_id,
        name: data.name,
        description: data.description,
        id: data.id,
      });

      if (!result) {
        return res.status(404).json({
          error: "Type Containers not found",
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
