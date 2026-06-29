const JSONOfSale = {
  location_id: "",
  user_id: "",
  client_id: "",
  subtoatal: "",
  discount_total: "",
  tax_total: "",
  total_price: "",
  total_cost: "",
  total_profit: "",
  is_wholesale: false, //true or false//

  sales_items: [
    {
      sale_id: "",
      formula_name: "",
      quantity: "",
      unit_price: "",
      subtotal: "",
      discount: "",
      tax: "",
      total_price: "",
      total_cost: "",
      sales_component: {
        sale_item_id: "",
        component_id: "",
        quntity_used: "",
        unit_cost: "",
        total_cost: "",
      },
    },
  ],
};

const finalJSONClient = {
  location_id: "",
  user_id: "",
  client_id: "",
  subtotal: "", //provid or calculate system
  discount_total: "",
  tax_total: "", //provid or calculate system
  total_cost: "", //provid or calculate system
  total_profit: "", //provid or calculate system
  is_wholesale: false, //true or false//

  sales_items: [
    {
      sale_id: "",
      formula_name: "",
      quantity: "",
      subtotal: "",
      discount: "",
      tax: "",
      total_cost: "", //provid or calculate system
      sales_component: [
        {
          sale_item_id: "",
          component_id: "",
          quntity_used: "",
          unit_cost: "", //provid or calculate system
          unit_price: "",
          total_cost: "", //provid or calculate system
          total_price: "", //provid or calculate system
        },
      ],
      sales_container: {
        sale_item_id: "",
        component_id: "",
        quntity_used: "",
        unit_cost: "", //provid or calculate system
        unit_price: "",
        total_cost: "", //provid or calculate system
        total_price: "", //provid or calculate system
      },
    },
  ],
};

sale
 location_id: "",
  user_id: "",
  client_id: "",
  subtotal: "", //provid or calculate system
  discount_total: "",
  tax_total: "", //provid or calculate system
  total_cost: "", //provid or calculate system
  total_profit: "", //provid or calculate system
  is_wholesale: false, //true or false//

  sales_items
      sale_id: "",
      formula_name: "",
      quantity: "",
      subtotal: "",
      discount: "",
      tax: "",
      total_cost: "", //provid or calculate system
      
  sales_component
          sale_item_id: "",
          component_id: "",
          quantity_used: "",
          unit_cost: "", //provid or calculate system
          unit_price: "",
          total_cost: "", //provid or calculate system
          total_price: "", //provid or calculate system
       
      sales_container: {
        sale_item_id: "",
        container_id: "",
        quantity_used: "",
        unit_cost: "", //provid or calculate system
        unit_price: "",
        total_cost: "", //provid or calculate system
        total_price: "", //provid or calculate system
