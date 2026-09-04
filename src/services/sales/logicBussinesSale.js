import { StockModel } from "../../models/stock/stockModel.js";
import { StockContainerModel } from "../../models/containers/stockContainerModel.js";

const money = (n) => Math.round(Number(n) || 0);
const cost2 = (n) => Number((Number(n) || 0).toFixed(2));

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export class LogicBussinesSale {
  // Turns the validated request + per-item context (formula + its lines + the
  // resolved essence) into a fully-priced `data` object ready for the
  // transaction. Pure of writes; only reads stock.
  //
  // Pricing per item (see Phase 3 spec):
  //   subtotal   = formula_base_price + essence_charge + Σ excess_charge + container_charge
  //   total_cost = essence_cost + Σ component_cost + container_cost
  static async processSale({ data, itemsContext }) {
    const isWholesale = Boolean(data.is_wholesale);

    // grouped stock needs, checked once at the end
    const neededComponent = new Map(); // component_id -> qty
    const neededContainer = new Map(); // container_id -> qty
    const stockCache = new Map();
    const containerCache = new Map();

    const getStock = async (componentId) => {
      if (!stockCache.has(componentId)) {
        const row = await StockModel.retrieveStockByComponent({
          component_id: componentId,
          location_id: data.location_id,
        });
        stockCache.set(componentId, row || null);
      }
      return stockCache.get(componentId);
    };

    const getContainerStock = async (containerId) => {
      if (!containerCache.has(containerId)) {
        const row = await StockContainerModel.retrieveByContainer({
          container_id: containerId,
          location_id: data.location_id,
        });
        containerCache.set(containerId, row || null);
      }
      return containerCache.get(containerId);
    };

    let saleSubtotal = 0;
    let saleDiscount = 0;
    let saleTax = 0;
    let saleCost = 0;

    for (const item of data.sales_items) {
      const ctx = itemsContext.get(item);
      const { formula, formulaLines } = ctx;
      const quantity = Number(item.quantity) || 1;

      // ---- formula base price ----
      const baseUnit = Number(
        isWholesale ? formula.wholesale_price : formula.consumer_price,
      );
      if (!Number.isFinite(baseUnit) || baseUnit <= 0) {
        throw httpError(400, "La fórmula no tiene precio configurado");
      }
      const formulaUnitPrice = money(baseUnit);
      const formulaBasePrice = money(baseUnit * quantity);

      // ---- essence line ----
      const essenceLine = formulaLines.find((l) => l.type_component_id !== null);
      if (!essenceLine) {
        throw httpError(400, "La fórmula no tiene línea de esencia");
      }

      const essencePerUnit =
        item.essence_quantity_used != null
          ? Number(item.essence_quantity_used)
          : Number(essenceLine.quantity);

      if (essencePerUnit < Number(essenceLine.quantity)) {
        throw httpError(
          400,
          "Solo se puede aumentar la cantidad de esencia",
        );
      }

      const essenceQty = cost2(essencePerUnit * quantity);
      const essStock = await getStock(item.essence_component_id);
      if (!essStock) {
        throw httpError(
          400,
          `Stock no encontrado para la esencia ${item.essence_component_id}`,
        );
      }
      const essSell = Number(
        isWholesale ? essStock.wholesale_price : essStock.consumer_price,
      );
      if (!Number.isFinite(essSell) || essSell <= 0) {
        throw httpError(
          400,
          "La esencia no tiene precio de venta en la sede",
        );
      }
      const essenceCharge = money(essSell * essenceQty);
      const essenceCost = cost2(Number(essStock.avg_price) * essenceQty);

      neededComponent.set(
        item.essence_component_id,
        (neededComponent.get(item.essence_component_id) || 0) + essenceQty,
      );

      // ---- component lines ----
      const componentLines = formulaLines.filter((l) => l.component_id !== null);
      const overrides = new Map();
      for (const ov of item.line_overrides || []) {
        const line = componentLines.find(
          (l) => l.id === Number(ov.formula_component_id),
        );
        if (!line) {
          throw httpError(
            400,
            `El componente (línea ${ov.formula_component_id}) no pertenece a la fórmula`,
          );
        }
        overrides.set(line.id, Number(ov.quantity_used));
      }

      const expandedComponents = [];

      // essence goes first as a sale_item_component (is_essence = true)
      expandedComponents.push({
        component_id: item.essence_component_id,
        component_name_snapshot: ctx.essence?.name ?? null,
        is_essence: true,
        quantity_used: essenceQty,
        unit_cost: cost2(essStock.avg_price),
        total_cost: essenceCost,
        unit_price: money(essSell),
        total_price: essenceCharge,
      });

      let itemExcessCharge = 0;
      let itemComponentsCost = essenceCost;

      for (const line of componentLines) {
        const perUnit = overrides.has(line.id)
          ? overrides.get(line.id)
          : Number(line.quantity);

        if (perUnit < Number(line.quantity)) {
          throw httpError(
            400,
            `Solo se puede aumentar la cantidad del componente ${line.component_id}`,
          );
        }

        const billed = cost2(perUnit * quantity);
        const formulaTotal = Number(line.quantity) * quantity;
        const excess = Math.max(0, billed - formulaTotal);

        const st = await getStock(line.component_id);
        if (!st) {
          throw httpError(
            400,
            `Stock no encontrado para el componente ${line.component_id}`,
          );
        }

        const sellUnit = Number(
          isWholesale ? st.wholesale_price : st.consumer_price,
        );
        if (excess > 0 && (!Number.isFinite(sellUnit) || sellUnit <= 0)) {
          throw httpError(
            400,
            `El componente ${line.component_id} no tiene precio de venta en la sede`,
          );
        }

        const excessCharge = excess > 0 ? money(sellUnit * excess) : 0;
        const compCost = cost2(Number(st.avg_price) * billed);

        itemExcessCharge += excessCharge;
        itemComponentsCost = cost2(itemComponentsCost + compCost);

        neededComponent.set(
          line.component_id,
          (neededComponent.get(line.component_id) || 0) + billed,
        );

        expandedComponents.push({
          component_id: line.component_id,
          component_name_snapshot: line.component_name ?? null,
          is_essence: false,
          quantity_used: billed,
          unit_cost: cost2(st.avg_price),
          total_cost: compCost,
          unit_price: Number.isFinite(sellUnit) ? money(sellUnit) : 0,
          total_price: excessCharge,
        });
      }

      // ---- container (optional, full charge) ----
      let containerCharge = 0;
      let containerCost = 0;
      let expandedContainer = null;

      if (item.sales_container) {
        const { container_id: containerId, quantity_used: rawQty } =
          item.sales_container;
        const contQty = cost2(rawQty);

        const cs = await getContainerStock(containerId);
        if (!cs) {
          throw httpError(
            400,
            `Stock de envase no encontrado para el envase ${containerId}`,
          );
        }

        const csSell = Number(
          isWholesale ? cs.wholesale_price : cs.consumer_price,
        );
        if (!Number.isFinite(csSell) || csSell <= 0) {
          throw httpError(
            400,
            "El envase no tiene precio de venta en la sede",
          );
        }

        containerCharge = money(csSell * contQty);
        containerCost = cost2(Number(cs.avg_price) * contQty);

        neededContainer.set(
          containerId,
          (neededContainer.get(containerId) || 0) + contQty,
        );

        expandedContainer = {
          container_id: containerId,
          container_name_snapshot: cs.container_name ?? null,
          quantity_used: contQty,
          unit_cost: cost2(cs.avg_price),
          total_cost: containerCost,
          unit_price: money(csSell),
          total_price: containerCharge,
        };
      }

      // ---- item totals ----
      const subtotalItem = money(
        formulaBasePrice + essenceCharge + itemExcessCharge + containerCharge,
      );
      const totalCostItem = cost2(itemComponentsCost + containerCost);

      item.formula_id = formula.id;
      item.formula_name_snapshot = formula.name;
      item.formula_unit_price = formulaUnitPrice;
      item.formula_base_price = formulaBasePrice;
      item.quantity = quantity;
      item.subtotal = subtotalItem;
      item.total_cost = totalCostItem;
      item.discount = cost2(item.discount);
      item.tax = cost2(item.tax);
      item.sales_components = expandedComponents;
      item.sales_container = expandedContainer;

      saleSubtotal += subtotalItem;
      saleDiscount += item.discount;
      saleTax += item.tax;
      saleCost = cost2(saleCost + totalCostItem);
    }

    // ---- grouped stock validation ----
    for (const [componentId, needed] of neededComponent) {
      const st = stockCache.get(componentId);
      if (!st || Number(st.quantity_base) < needed) {
        throw httpError(
          400,
          `Stock insuficiente para el componente ${componentId}`,
        );
      }
    }
    for (const [containerId, needed] of neededContainer) {
      const cs = containerCache.get(containerId);
      if (!cs || Number(cs.quantity) < needed) {
        throw httpError(
          400,
          `Stock insuficiente para el envase ${containerId}`,
        );
      }
    }

    // ---- sale rollup ----
    data.subtotal = money(saleSubtotal);
    data.discount_total = cost2(saleDiscount);
    data.tax_total = cost2(saleTax);
    data.total_cost = saleCost;
    data.total_profit = cost2(data.subtotal - data.discount_total - data.total_cost);
    data.is_wholesale = isWholesale;
    data.client_id = data.client_id ?? null;

    return data;
  }
}
