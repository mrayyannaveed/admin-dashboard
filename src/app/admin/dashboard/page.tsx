"use client";

import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  image?: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState("All");
  const [activeSection, setActiveSection] = useState<"orders" | "products">("orders");
  const [isEditing, setIsEditing] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({
    _id: "",
    name: "",
    price: 0,
    stock: 0,
    description: "",
    image: ""
  });

  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  // Calculate dashboard stats
  const totalEarnings = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const dispatchOrders = orders.filter(order => order.status === "dispatch").length;
  const successOrders = orders.filter(order => order.status === "success").length;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/");
    } else if (user?.primaryEmailAddress?.emailAddress !== "rayyannaveed33@gmail.com") {
      router.replace("/");
    } else {
      setIsUserLoaded(true);
    }
  }, [isSignedIn, user, isLoaded, router]);

  useEffect(() => {
    if (!isUserLoaded) return;

    client
      .fetch(`*[_type == "order"]{ _id, firstName, lastName, phone, email, address, city, zipCode, total, discount, orderDate, status, cartItems[]->{ name, image } }`)
      .then((data) => setOrders(data))
      .catch((error) => console.log("error fetching orders", error));

    client
      .fetch(`*[_type == "product"]{ _id, name, price, stock, description, image }`)
      .then((data) => setProducts(data))
      .catch((error) => console.log("error fetching products", error));
  }, [isUserLoaded]);

  const handleAddProduct = async () => {
    try {
      const doc = {
        _type: 'product',
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        description: newProduct.description,
        image: newProduct.image
      };

      const result = await client.create(doc);
      setProducts([...products, {...newProduct, _id: result._id}]);
      setNewProduct({_id: "", name: "", price: 0, stock: 0, description: "", image: ""});
      Swal.fire("Success!", "Product added successfully.", "success");
    } catch (error) {
      Swal.fire("Error!", "Failed to add product.", "error");
      console.log(error);
    }
  };
  
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
  const handleEditProduct = async (product: Product) => {
    try {
      await client
        .patch(product._id)
        .set({
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          description: product.description,
          image: product.image
        })
        .commit();

      setProducts(products.map(p => p._id === product._id ? product : p));
      setSelectedProduct(null);
      setIsEditing(false);
      Swal.fire("Success!", "Product updated successfully.", "success");
    } catch (error) {
      Swal.fire("Error!", "Failed to update product.", "error");
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-lg flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSection("orders")}
            className={`px-4 py-2 rounded font-semibold cursor-pointer ${
              activeSection === "orders" ? "bg-red-500" : "bg-blue-700 hover:bg-blue-500"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveSection("products")}
            className={`px-4 py-2 rounded font-semibold cursor-pointer ${
              activeSection === "products" ? "bg-red-500" : "bg-blue-700 hover:bg-blue-500"
            }`}
          >
            Products
          </button>
          <SignedIn>
            <SignOutButton>
              <button className="bg-black text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-400">
                Logout
              </button>
            </SignOutButton>
          </SignedIn>
        </div>
      </nav>

      <div className="p-6">
        {activeSection === "orders" && (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Total Earnings</h3>
                <p className="text-2xl font-bold text-green-600">${totalEarnings}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
                <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Pending Orders</h3>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Dispatch Orders</h3>
                <p className="text-2xl font-bold text-orange-600">{dispatchOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Success Orders</h3>
                <p className="text-2xl font-bold text-green-600">{successOrders}</p>
              </div>
            </div>

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

          </>
        )}

        {activeSection === "products" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
              <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
                <input
                  type="text"
                  placeholder="Product Name"
                  className="border p-2 rounded"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="border p-2 rounded"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  className="border p-2 rounded"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  className="border p-2 rounded"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  className="border p-2 rounded"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
                <button
                  onClick={handleAddProduct}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Add Product
                </button>
              </div>
            </div>

            <table className="w-full border mt-2 bg-white shadow rounded">
              <thead>
                <tr>
                  <th className="border p-2">Image</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Stock</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-100">
                    <td className="border p-2">
                      {product.image && (
                        <img
                          src={urlFor(product.image).url()}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="border p-2">{product.name}</td>
                    <td className="border p-2">${product.price}</td>
                    <td className="border p-2">{product.stock}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsEditing(true);
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDeleteProduct(product._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Edit Product Modal */}
            {isEditing && selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-1/2">
                  <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      className="w-full border p-2 rounded"
                      value={selectedProduct.name}
                      onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full border p-2 rounded"
                      value={selectedProduct.price}
                      onChange={(e) => setSelectedProduct({...selectedProduct, price: Number(e.target.value)})}
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      className="w-full border p-2 rounded"
                      value={selectedProduct.stock}
                      onChange={(e) => setSelectedProduct({...selectedProduct, stock: Number(e.target.value)})}
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      className="w-full border p-2 rounded"
                      value={selectedProduct.image}
                      onChange={(e) => setSelectedProduct({...selectedProduct, image: e.target.value})}
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full border p-2 rounded"
                      value={selectedProduct.description}
                      onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          setIsEditing(false);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditProduct(selectedProduct)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
