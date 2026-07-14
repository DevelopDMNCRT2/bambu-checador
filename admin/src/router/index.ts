import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    // Root route - redirect to /users
    {
      path: '/',
      redirect: '/users'
    },

    // ... Admin Routes start here

    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
      },
    },

    // Admin Routes
    {
      path: '/users',
      name: 'Users',
      component: () => import('../views/Admin/Users.vue'),
      meta: { title: 'Empleados' },
    },
    {
      path: '/stats',
      name: 'Stats',
      component: () => import('../views/Admin/Stats.vue'),
      meta: { title: 'Estadísticas' },
    },
    {
      path: '/users/create',
      name: 'CreateUser',
      component: () => import('../views/Admin/CreateUser.vue'),
      meta: { title: 'Nuevo Empleado' },
    },
    {
      path: '/users/:id/edit',
      name: 'EditUser',
      component: () => import('../views/Admin/EditUser.vue'),
      meta: { title: 'Editar Empleado' },
    },
    {
      path: '/purchases',
      name: 'Purchases',
      component: () => import('../views/Admin/Purchases.vue'),
      meta: { title: 'Compras' },
    },
    {
      path: '/purchases/create',
      name: 'CreatePurchase',
      component: () => import('../views/Admin/CreatePurchase.vue'),
      meta: { title: 'Nuevo Ticket' },
    },
    {
      path: '/expenses',
      name: 'Expenses',
      component: () => import('../views/Admin/Expenses.vue'),
      meta: { title: 'Gastos' },
    },
    {
      path: '/sales',
      name: 'Sales',
      component: () => import('../views/Admin/Sales.vue'),
      meta: { title: 'Ventas' },
    },
    {
      path: '/expenses/create',
      name: 'CreateExpense',
      component: () => import('../views/Admin/CreateExpense.vue'),
      meta: { title: 'Nuevo Gasto' },
    },
    {
      path: '/expenses/:id/edit',
      name: 'EditExpense',
      component: () => import('../views/Admin/EditExpense.vue'),
      meta: { title: 'Editar Gasto' },
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: () => import('../views/Admin/Inventory.vue'),
      meta: { title: 'Inventario' },
    },
    {
      path: '/purchases/:id/edit',
      name: 'EditPurchase',
      component: () => import('../views/Admin/EditPurchase.vue'),
      meta: { title: 'Editar Compra' },
    },
    {
      path: '/purchases/:id/breakdown',
      name: 'PurchaseBreakdown',
      component: () => import('../views/Admin/PurchaseBreakdown.vue'),
      meta: { title: 'Desglose de Compra' },
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: () => import('../views/Admin/Inventory.vue'),
      meta: { title: 'Inventario' },
    },
    {
      path: '/recipes',
      name: 'Recipes',
      component: () => import('../views/Admin/Recipes.vue'),
      meta: { title: 'Recetas' },
    },
    {
      path: '/recipes/create',
      name: 'CreateRecipe',
      component: () => import('../views/Admin/CreateRecipe.vue'),
      meta: { title: 'Nueva Receta' },
    },
    {
      path: '/recipes/:id/edit',
      name: 'EditRecipe',
      component: () => import('../views/Admin/EditRecipe.vue'),
      meta: { title: 'Editar Receta' },
    },
    {
      path: '/menu',
      name: 'Menu',
      component: () => import('../views/Admin/Menu.vue'),
      meta: { title: 'Carta' },
    },
    {
      path: '/menu/create',
      name: 'CreateDish',
      component: () => import('../views/Admin/CreateDish.vue'),
      meta: { title: 'Nuevo Platillo' },
    },
    {
      path: '/menu/:id/edit',
      name: 'EditDish',
      component: () => import('../views/Admin/EditDish.vue'),
      meta: { title: 'Editar Platillo' },
    },
    {
      path: '/clients',
      name: 'Clients',
      component: () => import('../views/Admin/Clients.vue'),
      meta: { title: 'Clientes' },
    },
    {
      path: '/receivables',
      name: 'Receivables',
      component: () => import('../views/Admin/Receivables.vue'),
      meta: { title: 'Cuentas por Cobrar' },
    },
    {
      path: '/nomina',
      name: 'Nomina',
      component: () => import('../views/Admin/Nomina/NominaView.vue'),
      meta: { title: 'Nómina' },
    },

    // Cash Routes
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('../views/Cash/Orders.vue'),
      meta: { title: 'Órdenes' },
    },
    {
      path: '/pos',
      name: 'POS',
      component: () => import('../views/Cash/POS.vue'),
      meta: { title: 'Punto de Venta' },
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../views/Cash/Reports.vue'),
      meta: { title: 'Reportes' },
    },

    {
      path: '/login',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Login',
      },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('../views/Notifications/Timeline.vue'),
      meta: { title: 'Notificaciones' },
    },
    {
      path: '/checador',
      name: 'Checador',
      component: () => import('../views/Checador/ChecadorView.vue'),
      meta: { title: 'Checador' },
    },
    // Catch-all route for 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/error-404'
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `Bambu Admin | ${to.meta.title || 'Dashboard'}`;
  next();
})
