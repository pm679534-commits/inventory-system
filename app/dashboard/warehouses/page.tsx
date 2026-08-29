'use client';

import { useEffect, useState } from 'react';
import { Warehouse, Plus, Edit, Trash2, ArrowRightLeft, Package, History } from 'lucide-react';

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
}

interface StockItem {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

interface StockMovement {
  id: string;
  product_id: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  quantity: number;
  movement_type: string;
  notes?: string;
  created_at: string;
  product?: {
    name: string;
    sku: string;
  };
  from_warehouse?: {
    name: string;
  };
  to_warehouse?: {
    name: string;
  };
}

interface WarehouseFormData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  is_active: boolean;
}

interface TransferFormData {
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  notes?: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    is_active: true,
  });

  const [transferData, setTransferData] = useState<TransferFormData>({
    product_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchStock(selectedWarehouse.id);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/warehouses');
      if (!response.ok) throw new Error('Failed to fetch warehouses');

      const data = await response.json();
      setWarehouses(data || []);
      if (data && data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async (warehouseId: string) => {
    try {
      setStockLoading(true);

      const response = await fetch(`/api/warehouses/${warehouseId}`);
      if (!response.ok) throw new Error('Failed to fetch stock');

      const data = await response.json();
      setStock(data.stock || []);
    } catch (err) {
      console.error('Failed to fetch stock:', err);
      setStock([]);
    } finally {
      setStockLoading(false);
    }
  };

  const fetchMovements = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}/movements`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch movements:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const url = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
      const method = editingWarehouse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save warehouse');
      }

      setShowModal(false);
      setEditingWarehouse(null);
      resetForm();
      fetchWarehouses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/stock/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer stock');
      }

      setShowTransferModal(false);
      resetTransferForm();
      if (selectedWarehouse) {
        fetchStock(selectedWarehouse.id);
      }
      alert('Stock transferred successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      city: warehouse.city || '',
      country: warehouse.country || '',
      is_active: warehouse.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    try {
      const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete warehouse');

      if (selectedWarehouse?.id === id) {
        setSelectedWarehouse(null);
      }
      fetchWarehouses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete warehouse');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      country: '',
      is_active: true,
    });
  };

  const resetTransferForm = () => {
    setTransferData({
      product_id: '',
      from_warehouse_id: '',
      to_warehouse_id: '',
      quantity: 1,
      notes: '',
    });
  };

  const openCreateModal = () => {
    setEditingWarehouse(null);
    resetForm();
    setShowModal(true);
  };

  const openTransferModal = () => {
    resetTransferForm();
    if (selectedWarehouse) {
      setTransferData({ ...transferData, from_warehouse_id: selectedWarehouse.id });
    }
    setShowTransferModal(true);
  };

  const openMovementsModal = async () => {
    if (selectedWarehouse) {
      await fetchMovements(selectedWarehouse.id);
      setShowMovementsModal(true);
    }
  };

  const getAvailableStock = (item: StockItem) => item.quantity - item.reserved_quantity;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Warehouses</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage warehouse locations and stock levels</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Warehouse
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading warehouses...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Warehouse className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No warehouses found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first warehouse to start managing stock</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Warehouse Locations</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedWarehouse?.id === warehouse.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedWarehouse(warehouse)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{warehouse.name}</h3>
                        {!warehouse.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Code: {warehouse.code}</p>
                      {warehouse.city && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{warehouse.city}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(warehouse);
                        }}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(warehouse.id);
                        }}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Details */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {selectedWarehouse ? (
              <>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedWarehouse.name}</h2>
                      <p className="text-gray-600 dark:text-gray-400">Stock inventory</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={openMovementsModal}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <History className="w-4 h-4" />
                        History
                      </button>
                      <button
                        onClick={openTransferModal}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transfer Stock
                      </button>
                    </div>
                  </div>
                </div>

                {stockLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stock...</p>
                  </div>
                ) : stock.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No stock items</h3>
                    <p className="text-gray-600 dark:text-gray-400">This warehouse has no products in stock</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Reserved
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Available
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {stock.map((item) => {
                          const available = getAvailableStock(item);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.product.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.product.sku}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.quantity} {item.product.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-yellow-600">
                                  {item.reserved_quantity} {item.product.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div
                                  className={`text-sm font-medium ${
                                    available <= 0
                                      ? 'text-red-600'
                                      : available < 10
                                      ? 'text-yellow-600'
                                      : 'text-green-600'
                                  }`}
                                >
                                  {available} {item.product.unit}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <Warehouse className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Select a warehouse</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a warehouse to view its stock inventory</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warehouse Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="e.g., WH001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active warehouse
                </label>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWarehouse(null);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Transfer Stock</h2>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={transferData.product_id}
                  onChange={(e) => setTransferData({ ...transferData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={transferData.from_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={transferData.to_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination warehouse</option>
                  {warehouses
                    .filter((wh) => wh.id !== transferData.from_warehouse_id)
                    .map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional transfer notes"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Transferring...' : 'Transfer Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movements History Modal */}
      {showMovementsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Stock Movement History</h2>
              <p className="text-gray-600">{selectedWarehouse?.name}</p>
            </div>

            <div className="p-6">
              {movements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600">No stock movements recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {movement.movement_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(movement.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {movement.product?.name} - {movement.quantity} units
                          </p>
                          {movement.from_warehouse && movement.to_warehouse && (
                            <p className="text-sm text-gray-600">
                              From: {movement.from_warehouse.name} → To: {movement.to_warehouse.name}
                            </p>
                          )}
                          {movement.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{movement.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowMovementsModal(false)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
