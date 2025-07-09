"use client";

import ProtectedRoute from "@/app/components/protectedRoute";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Order {
  _id: string;
  firstName: string;
  lastName: string;
  phone: number;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  total: number;
  discount: number;
  orderDate: string;
  status: string | null;
  cartItems: { name: string; image: string }[];
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState("All");
  const [activeSection, setActiveSection] = useState<"orders" | "products">("orders");

  useEffect(() => {
    client
      .fetch(
        `*[_type == "order"]{
          _id,
          firstName,
          lastName,
          phone,
          email,
          address,
          city,
          zipCode,
          total,
          discount,
          orderDate,
          status,
          cartItems[]->{
            name,
            image
          }
        }`
      )
      .then((data) => setOrders(data))
      .catch((error) => console.log("error fetching orders", error));

    client
      .fetch(
        `*[_type == "product"]{
          _id,
          name,
          price,
          stock,
          description
        }`
      )
      .then((data) => setProducts(data))
      .catch((error) => console.log("error fetching products", error));
  }, []);

  const filteredOrders =
    filter === "All" ? orders : orders.filter((order) => order.status === filter);

  const toggleOrderDetails = (orderId: string) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleDelete = async (orderId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      await client.delete(orderId);
      setOrders((prevOrder) => prevOrder.filter((order) => order._id !== orderId));
      Swal.fire("Deleted!", "The order has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error!", "Failed to delete the order.", "error");
      console.log(error)
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await client.patch(orderId).set({ status: newStatus }).commit();
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      Swal.fire("Updated!", `Order marked as ${newStatus}.`, "success");
    } catch (error) {
      Swal.fire("Error!", "Failed to update order status.", "error");
      console.log(error)
    }
  };

  const confirmDeleteProduct = async (productId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This product will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await client.delete(productId);
      setProducts((prevProducts) => prevProducts.filter((p) => p._id !== productId));
      Swal.fire("Deleted!", "Product has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error!", "Failed to delete product.", "error");
      console.log(error)
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}
        <nav className="bg-red-600 text-white p-4 shadow-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveSection("orders")}
              className={`px-4 py-2 rounded font-semibold cursor-pointer ${
                activeSection === "orders" ? "bg-blue-500" : "bg-red-700 hover:bg-red-500"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveSection("products")}
              className={`px-4 py-2 rounded font-semibold cursor-pointer ${
                activeSection === "products" ? "bg-blue-500" : "bg-red-700 hover:bg-red-500"
              }`}
            >
              Products
            </button>
          </div>
        </nav>

        <div className="p-6">
          {activeSection === "orders" && (
            <>
              <div className="mb-4 space-x-2">
                {["All", "pending", "success", "dispatch"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-md font-semibold cursor-pointer ${
                      filter === status
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <p className="text-gray-600 text-center">No orders found.</p>
              ) : (
                <div className="overflow-auto rounded-lg shadow bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
                      <tr>
                        <th className="px-4 py-3 ">Name</th>
                        <th className="px-4 py-3 ">Phone</th>
                        <th className="px-4 py-3 ">Email</th>
                        <th className="px-4 py-3 ">Total</th>
                        <th className="px-4 py-3 ">Status</th>
                        <th className="px-4 py-3 ">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2">
                            {order.firstName} {order.lastName}
                          </td>
                          <td className="px-4 py-2">{order.phone}</td>
                          <td className="px-4 py-2">{order.email}</td>
                          <td className="px-4 py-2 font-semibold text-green-700">
                            ${order.total}
                          </td>
                          <td className="px-4 py-2 capitalize">{order.status}</td>
                          <td className="px-4 py-2 space-x-2">
                            <button
                              onClick={() => toggleOrderDetails(order._id)}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              {selectedOrderId === order._id ? "Hide" : "Details"}
                            </button>
                            <select
                              value={order.status || ""}
                              onChange={(e) =>
                                handleStatusChange(order._id, e.target.value)
                              }
                              className="bg-gray-100 px-2 py-1 rounded cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="dispatch">Dispatch</option>
                              <option value="success">Success</option>
                            </select>
                            <button
                              onClick={() => handleDelete(order._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order Details */}
              {selectedOrderId && (
                <div className="mt-6 p-4 bg-white shadow rounded-lg">
                  <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                  {orders
                    .find((o) => o._id === selectedOrderId)
                    ?.cartItems.map((item, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <img
                          src={urlFor(item.image).url()}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded mr-4"
                        />
                        <span>{item.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* Products Section */}
          {activeSection === "products" && (
            <>
              <h2 className="text-xl font-semibold mb-2">Products</h2>
              <table className="w-full border mt-2 bg-white shadow rounded">
                <thead>
                  <tr>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Stock</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-100">
                      <td className="border p-2">{product.name}</td>
                      <td className="border p-2">${product.price}</td>
                      <td className="border p-2">{product.stock}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="bg-blue-500 text-white px-2 py-1 rounded mr-2 cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => confirmDeleteProduct(product._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Product Details */}
              {selectedProduct && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold">Product Details</h2>
                  <div className="bg-gray-100 p-4 rounded mt-2">
                    <p>
                      <strong>Name:</strong> {selectedProduct.name}
                    </p>
                    <p>
                      <strong>Price:</strong> ${selectedProduct.price}
                    </p>
                    <p>
                      <strong>Stock:</strong> {selectedProduct.stock}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {selectedProduct.description || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="bg-gray-500 px-2 py-1 ml-10 rounded mt-2 cursor-pointer text-white"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
