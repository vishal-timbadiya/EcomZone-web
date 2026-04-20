# Quick Start - Using Backend API in Frontend

## Import the API Client

```typescript
import { api } from '@/lib/api';
```

## Examples

### Fetch Products in a Component

```typescript
'use client';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.getAll({
          search: '',
          category: '',
        });
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Products</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4">
            <h2>{product.name}</h2>
            <p>₹{product.singlePrice}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Login User

```typescript
'use client';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.auth.login(email, password);
      // Save token
      localStorage.setItem('authToken', response.token);
      // Redirect or update state
      console.log('Logged in!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Create Order

```typescript
'use client';
import { api } from '@/lib/api';

const createOrder = async () => {
  try {
    const orderData = {
      items: [
        { productId: '123', quantity: 2 },
        { productId: '456', quantity: 1 },
      ],
      shippingAddress: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '9876543210',
      },
      paymentMethod: 'COD',
    };

    const response = await api.orders.create(orderData);
    console.log('Order created:', response);
  } catch (error) {
    console.error('Failed to create order:', error);
  }
};
```

### Fetch Categories

```typescript
const categories = await api.categories.getAll();
// Returns: [{ id, name, slug, icon, position }, ...]
```

### Get User Profile

```typescript
const profile = await api.auth.getProfile();
// Returns: { id, email, name, role, ... }
```

### Upload File

```typescript
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.upload.file(formData);
    console.log('File uploaded:', response);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Calculate Cart

```typescript
const cartItems = [
  { productId: '123', singleQty: 2, cartonQty: 0 },
  { productId: '456', singleQty: 1, cartonQty: 0 },
];

const cartTotals = await api.cart.calculate(cartItems);
// Returns: { subtotal, gst, shipping, total, ... }
```

---

## Key Points

✅ **Auto Authentication** - Token from `localStorage.authToken` is sent automatically

✅ **Error Handling** - All methods throw errors on failure

✅ **Type Safe** - TypeScript support for all methods

✅ **CORS Ready** - Backend allows frontend origin

---

## Running the Stack

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# http://localhost:3000
```

Both servers should be running for the frontend to fetch data from the backend.
