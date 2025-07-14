
"use client";

import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { round } from "lodash";
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
  const totalEarnings = orders.reduce((sum, order) => sum + round(order.total, 2), 0);
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
      confirmButtonText: "Yes, delete it!"
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
      confirmButtonText: "Yes, delete it!"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-xl flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveSection("orders")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              activeSection === "orders" 
                ? "bg-white text-blue-600 shadow-lg transform scale-105" 
                : "bg-blue-700 hover:bg-blue-600"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveSection("products")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              activeSection === "products"
                ? "bg-white text-blue-600 shadow-lg transform scale-105"
                : "bg-blue-700 hover:bg-blue-600"
            }`}
          >
            Products
          </button>
          <SignedIn>
            <SignOutButton>
              <button className="bg-red-500 cursor-pointer hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                Logout
              </button>
            </SignOutButton>
          </SignedIn>
        </div>
      </nav>

      <div className="p-8">
        {activeSection === "orders" && (
          <>
            <div className="grid grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Earnings</h3>
                <p className="text-3xl font-bold text-green-600">${totalEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Pending Orders</h3>
                <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Dispatch Orders</h3>
                <p className="text-3xl font-bold text-orange-600">{dispatchOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Success Orders</h3>
                <p className="text-3xl font-bold text-green-600">{successOrders}</p>
              </div>
            </div>

            <div className="mb-6 space-x-4">
              {["All", "pending", "success", "dispatch"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-6 py-3 cursor-pointer rounded-lg font-semibold transition-all duration-200 ${
                    filter === status
                      ? "bg-blue-600 text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No orders found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          {order.firstName} {order.lastName}
                        </td>
                        <td className="px-6 py-4">{order.phone}</td>
                        <td className="px-6 py-4">{order.email}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">
                          ${order.total}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'dispatch' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-3">
                          <button
                            onClick={() => toggleOrderDetails(order._id)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium"
                          >
                            {selectedOrderId === order._id ? "Hide" : "Details"}
                          </button>
                          <select
                            value={order.status || ""}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="bg-white border cursor-pointer border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="dispatch">Dispatch</option>
                            <option value="success">Success</option>
                          </select>
                          <button
                            onClick={() => handleDelete(order._id)}
                            className="text-red-600 cursor-pointer hover:text-red-800 font-medium"
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

            {selectedOrderId && (
              <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order Details</h2>
                <div className="grid grid-cols-4 gap-6">
                  {orders
                    .find((o) => o._id === selectedOrderId)
                    ?.cartItems.map((item, index) => (
                      <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow duration-200">
                        <img
                          src={urlFor(item.image).url()}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg mb-4"
                        />
                        <span className="text-gray-800 font-medium text-center">{item.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeSection === "products" && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Product</h2>
              <div className="grid grid-cols-3 gap-6">
                <input
                  type="text"
                  placeholder="Product Name"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
                <button
                  onClick={handleAddProduct}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Add Product
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        {product.image && (
                          <img
                            src={urlFor(product.image).url()}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">{product.name}</td>
                      <td className="px-6 py-4">${product.price}</td>
                      <td className="px-6 py-4">{product.stock}</td>
                      <td className="px-6 py-4 space-x-3">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsEditing(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditing && selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl w-1/2 max-w-2xl">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Product</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.name}
                      onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.price}
                      onChange={(e) => setSelectedProduct({...selectedProduct, price: Number(e.target.value)})}
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.stock}
                      onChange={(e) => setSelectedProduct({...selectedProduct, stock: Number(e.target.value)})}
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.image}
                      onChange={(e) => setSelectedProduct({...selectedProduct, image: e.target.value})}
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.description}
                      onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                    />
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          setIsEditing(false);
                        }}
                        className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditProduct(selectedProduct)}
                        className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
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
