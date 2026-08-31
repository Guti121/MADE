import { TypeComponentesModel } from "../../models/components/typeComponentModel.js";
import { ListTypeComponentSchema } from "../../shemas/components/typeComponentSchemas.js";

export class TypeComponentsController {
  // type_components is a global, seed-managed catalog: read-only over HTTP.
  static async ListTypeComponent(req, res) {
    try {
      const params = ListTypeComponentSchema.safeParse(req.query);

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      const result = await TypeComponentesModel.listTypeComponent({
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
}
