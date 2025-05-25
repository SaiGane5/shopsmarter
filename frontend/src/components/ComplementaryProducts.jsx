import React from "react";

const ComplementaryProducts = ({ products }) => (
  <div className="mt-8">
    <h3 className="text-2xl font-semibold mb-4">You may also like</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <div key={p.id} className="border rounded-lg p-3 shadow">
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-32 object-cover rounded"
          />
          <div className="mt-2 font-medium">{p.name}</div>
          <div className="text-indigo-600 font-bold">${p.price}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ComplementaryProducts;
