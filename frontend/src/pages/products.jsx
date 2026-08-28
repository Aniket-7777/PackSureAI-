import {
  Package,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  X
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  createProduct,
  getProducts,
  deleteProduct
} from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    barcode: "",
    product_name: "",
    brand_name: "",
    category: "",
    net_quantity: "",
    unit: "",
    mrp: ""
  });

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts();

      setProducts(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (err) {
      setError(
        err?.message || "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.barcode.trim()) {
      setError("Barcode is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await createProduct({
        barcode: form.barcode.trim(),
        product_name:
          form.product_name.trim() || null,
        brand_name:
          form.brand_name.trim() || null,
        category:
          form.category.trim() || null,
        net_quantity:
          form.net_quantity.trim() || null,
        unit:
          form.unit.trim() || null,
        mrp:
          form.mrp !== ""
            ? Number(form.mrp)
            : null
      });

      const product =
        response?.data;

      if (product) {
        setProducts((previous) => [
          product,
          ...previous
        ]);
      }

      setForm({
        barcode: "",
        product_name: "",
        brand_name: "",
        category: "",
        net_quantity: "",
        unit: "",
        mrp: ""
      });

      setShowForm(false);
    } catch (err) {
      setError(
        err?.message || "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);

      setProducts((previous) =>
        previous.filter(
          (product) => product.id !== id
        )
      );
    } catch (err) {
      setError(
        err?.message || "Failed to delete product."
      );
    }
  }

  const filtered = products.filter((product) => {
    const value = [
      product.product_name,
      product.brand_name,
      product.barcode,
      product.category
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return value.includes(
      search.toLowerCase()
    );
  });

  return (
    <div className="space-y-6">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Product Database
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Products
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage products and barcode information.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Product
        </button>

      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex gap-3">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3.5 top-3.5 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products, barcode or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />

          </div>

          <button
            onClick={loadProducts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Product Records
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {filtered.length} products
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">

                {[
                  "Product",
                  "Barcode",
                  "Category",
                  "Quantity",
                  "MRP",
                  "Actions"
                ].map((title) => (
                  <th
                    key={title}
                    className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    {title}
                  </th>
                ))}

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-16 text-center text-sm text-slate-400"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-16 text-center"
                  >
                    <Package
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No products found
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {product.product_name || "Unnamed"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {product.brand_name || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs">
                      {product.barcode || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {product.category || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {product.net_quantity
                        ? `${product.net_quantity} ${product.unit || ""}`
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold">
                      {product.mrp !== null &&
                      product.mrp !== undefined
                        ? `₹${product.mrp}`
                        : "—"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleDelete(product.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">

          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Add Product
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Add a product to the compliance database.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={handleCreate}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >

              <Input
                label="Barcode *"
                value={form.barcode}
                onChange={(value) =>
                  updateField("barcode", value)
                }
              />

              <Input
                label="Product Name"
                value={form.product_name}
                onChange={(value) =>
                  updateField("product_name", value)
                }
              />

              <Input
                label="Brand"
                value={form.brand_name}
                onChange={(value) =>
                  updateField("brand_name", value)
                }
              />

              <Input
                label="Category"
                value={form.category}
                onChange={(value) =>
                  updateField("category", value)
                }
              />

              <Input
                label="Net Quantity"
                value={form.net_quantity}
                onChange={(value) =>
                  updateField("net_quantity", value)
                }
              />

              <Input
                label="Unit"
                value={form.unit}
                onChange={(value) =>
                  updateField("unit", value)
                }
              />

              <Input
                label="MRP"
                type="number"
                value={form.mrp}
                onChange={(value) =>
                  updateField("mrp", value)
                }
              />

              <div className="flex items-end">
                <button
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Product"}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


function Input({
  label,
  value,
  onChange,
  type = "text"
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}