---
name: 21st-dev-design
description: >-
  Provides cutting-edge modern UI/UX design patterns, 21st.dev component conventions,
  Magic UI animations, Aceternity effects, Tailwind CSS styling, and high-converting
  e-commerce interface blocks (Bento grids, glow cards, animated carts, smooth modals).
---

# 21st.dev Design System & Modern UI Skill

This skill enforces high-aesthetic, production-ready UI components inspired by the 21st.dev registry, Magic UI, and modern design standards.

## Design Principles for E-Commerce

1. **Aesthetic & Visual Polish**:
   - Dark & Light mode support with elegant slate/zinc palettes.
   - Glassmorphism overlays (`backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50`).
   - Subtle gradients and glowing border highlights for Call-To-Action (CTA) elements.
   - Micro-interactions on buttons, product cards, and cart items.

2. **21st.dev Component Catalog**:
   - **Hero Section**: Dynamic gradient text, glowing badge pills, quick-search autocomplete.
   - **Product Card**: Image zoom on hover, quick add-to-cart overlay, discount tags, rating stars.
   - **Bento Grid**: Modern category browsing and featured deals.
   - **Shopping Cart Drawer**: Slide-over drawer with smooth item removal, quantity counters, voucher input, and sticky checkout button.
   - **Checkout Wizard**: Step-by-step accordion (Delivery Address ➔ Courier Selection ➔ Payment Method).

3. **Tailwind & Utility Conventions**:
   - Use `clsx` and `tailwind-merge` (`cn()`) helper for dynamic class composition.
   - Lucide React icons for consistent iconography.
   - Framer Motion / CSS Transitions for entrance and exit animations.
