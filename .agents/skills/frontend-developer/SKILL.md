---
name: frontend-developer
description: >-
  Specialized frontend engineering skill for building responsive, high-performance Next.js
  and React applications with Tailwind CSS, Zustand state management, optimistic UI updates,
  and seamless API integration for E-Commerce.
---

# Frontend Developer Expert Skill

This skill guides the AI Frontend Developer in producing clean, modular, and performant user interfaces.

## Technology Stack Conventions

- **Framework**: Next.js 15 (App Router with React Server Components & Client Components).
- **Styling**: Tailwind CSS, CSS Modules, Tailwind Animate.
- **State Management**: Zustand (Persistent store for Shopping Cart, Wishlist, User Session).
- **Icons**: Lucide React (`lucide-react`).
- **Data Fetching & Cache**: SWR / TanStack React Query / Server Actions.
- **Forms & Validation**: React Hook Form + Zod resolvers.

## Workflow Rules for E-Commerce Frontend

1. **State Isolation**:
   - Keep shopping cart state persistent using `zustand/middleware` `persist`.
   - Calculate subtotal, taxes, shipping fee, and voucher discounts dynamically.

2. **Mobile-First Responsiveness**:
   - Ensure fluid layout from 320px mobile screens up to 4K displays.
   - Sticky bottom navigation or sticky checkout CTA on mobile screens.

3. **Performance & UX**:
   - Skeleton loaders for product lists and category cards while fetching.
   - Optimistic UI updates when adding items to cart or liking products.
   - Proper image optimization via `next/image` with fallback placeholders.
