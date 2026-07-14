<template>
  <AdminLayout> <!-- Sidebar re-enabled based on user feedback -->
    
    <!-- Mobile Restriction Overlay -->
    <div class="lg:hidden fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center p-6 text-center">
        <div class="bg-white rounded-2xl p-8 max-w-sm w-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-brand-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Solo disponible en Escritorio</h2>
            <p class="text-gray-500">El punto de venta está optimizado para pantallas grandes y tabletas.</p>
        </div>
    </div>

    <!-- Main POS Interface -->
    <div class="hidden lg:flex h-[calc(100vh-140px)] overflow-hidden gap-4">
        
        <!-- LEFT PANEL: Product Catalog (70%) -->
        <div class="flex-1 min-w-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            <!-- Header: Search & Categories -->
            <div class="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
                <!-- Search -->
                <div class="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input 
                        type="text" 
                        v-model="searchQuery"
                        placeholder="Buscar productos..." 
                        class="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-lg focus:ring-2 focus:ring-brand-500"
                    >
                </div>

                <!-- Category Pills -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button 
                        v-for="cat in categories" 
                        :key="cat.id"
                        @click="selectedCategory = cat.id"
                        class="px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all"
                        :class="selectedCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'"
                    >
                        {{ cat.name }}
                    </button>
                </div>
            </div>


            <div class="flex-1 overflow-y-auto p-4 flex flex-col">
                <div class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start flex-1">
                    <button 
                        v-for="product in paginatedProducts" 
                        :key="product.id"
                        @click="addToCart(product)"
                        class="group relative flex flex-col justify-center items-center p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-500/50 hover:shadow-lg transition-all bg-white dark:bg-gray-800 text-center active:scale-95 h-32"
                    >
                        <!-- Simple Card Content -->
                        <h3 class="font-normal text-gray-800 dark:text-white line-clamp-3 leading-tight text-lg">
                            {{ product.name }}
                        </h3>

                        <!-- Tap Indicator -->
                        <div class="absolute inset-0 bg-brand-500/10 opacity-0 group-active:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                    </button>
                </div>

                <!-- Pagination Controls -->
                <div class="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3" v-if="filteredProducts.length > itemsPerPage">
                     <span class="text-sm text-gray-500">
                        {{ startIndex + 1 }} - {{ Math.min(endIndex, filteredProducts.length) }} de {{ filteredProducts.length }}
                     </span>
                     <div class="flex gap-2">
                         <button 
                            @click="currentPage--" 
                            :disabled="currentPage === 1"
                            class="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            Anterior
                         </button>
                         <button 
                            @click="currentPage++" 
                            :disabled="currentPage >= totalPages"
                            class="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            Siguiente
                         </button>
                     </div>
                </div>
            </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="w-[380px] shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
            
            <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex gap-2">
                <!-- Custom Sale -->
                 <button 
                    @click="openCustomItemModal"
                    class="flex-1 h-12 flex justify-center items-center bg-white text-brand-600 font-bold rounded-xl active:bg-gray-50 active:scale-95 transition-all text-base border border-brand-200 shadow-sm"
                 >
                    + Venta Personalizada
                 </button>

                 <!-- Discount Button -->
                 <div class="relative">
                     <button 
                        @click="isDiscountDropdownOpen = !isDiscountDropdownOpen"
                        class="w-12 h-12 flex justify-center items-center bg-red-700 text-white font-bold rounded-xl active:bg-red-800 active:scale-95 transition-all text-lg shadow-sm"
                     >
                        %
                     </button>
                     
                     <!-- Discount Dropdown -->
                     <div v-if="isDiscountDropdownOpen" class="absolute right-0 top-14 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                         <div class="p-2">
                             <button 
                                @click="applyDiscount('personal_lomas')"
                                class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                :class="selectedDiscount === 'personal_lomas' ? 'bg-red-50 text-red-700' : 'text-gray-700 dark:text-gray-300'"
                             >
                                 <div class="font-bold text-sm">Personal Lomas</div>
                                 <div class="text-xs opacity-75">10% Descuento</div>
                             </button>
                             <button 
                                v-if="selectedDiscount"
                                @click="applyDiscount(null)"
                                class="w-full text-left px-3 py-2 mt-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-red-500 text-sm font-medium border-t border-gray-100 dark:border-gray-700"
                             >
                                 Quitar descuento
                             </button>
                         </div>
                     </div>
                     
                     <!-- Backdrop to close dropdown -->
                     <div v-if="isDiscountDropdownOpen" class="fixed inset-0 z-40" @click="isDiscountDropdownOpen = false"></div>
                 </div>
            </div>

            <!-- Cart Items List -->
            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <p>Agrega productos para comenzar</p>
                </div>

                <div 
                    v-for="(item, index) in cart" 
                    :key="index"
                    class="p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm flex items-center justify-between group"
                >
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-gray-800 dark:text-white mr-2 break-words text-sm">{{ item.name }}</div>
                        <div class="text-brand-600 font-semibold text-sm">${{ (item.price * item.quantity).toFixed(2) }}</div>
                         <div v-if="item.variations?.length" class="text-xs text-gray-500 break-words leading-tight mt-0.5">
                            {{ item.variations.join(', ') }}
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                        <button @click="updateQuantity(index, -1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-100 active:scale-95 text-gray-600 font-bold">
                            -
                        </button>
                        <span class="font-bold text-gray-800 dark:text-gray-200 w-4 text-center">{{ item.quantity }}</span>
                         <button @click="updateQuantity(index, 1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-100 active:scale-95 text-gray-600 font-bold">
                            +
                        </button>
                    </div>
                </div>
                <!-- Discount Card -->
                <div 
                    v-if="selectedDiscount === 'personal_lomas'" 
                    class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-center justify-between"
                >
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-red-700 dark:text-red-400 mr-2 break-words text-sm">Personal Lomas</div>
                        <div class="text-red-600 dark:text-red-300 font-semibold text-xs mt-0.5">10% Descuento</div>
                    </div>

                    <div class="font-bold text-red-600 dark:text-red-400 text-sm">
                        -${{ (subtotal * 0.10).toFixed(2) }}
                    </div>
                </div>
            </div>

            <!-- Footer Totals & Action -->
            <div class="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-10">
                <div class="space-y-2 mb-4">


                    <div class="flex justify-between text-xl font-medium text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200">
                        <span>Total</span>
                        <span>${{ total.toFixed(2) }}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 h-14">
                     <button 
                        @click="clearCart"
                        :disabled="cart.length === 0"
                        class="flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                         @click="openPaymentModal"
                         :disabled="cart.length === 0"
                         class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white font-medium text-lg hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                    >
                        Cobrar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
        <div v-if="isPaymentModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isPaymentModalOpen = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
                
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Método de Pago</h2>
                        <p class="text-gray-500 text-sm mt-1">Total a cobrar: <span class="font-bold text-brand-600 text-lg">${{ total.toFixed(2) }}</span></p>
                    </div>
                    <button @click="isPaymentModalOpen = false" class="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div class="p-8">
                    <div class="grid grid-cols-3 gap-4">
                        <button 
                            v-for="method in paymentMethods" 
                            :key="method.id"
                            @click="processPayment(method.id)"
                            class="flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all active:scale-95 group"
                        >
                            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-white group-hover:text-brand-500 text-gray-500 transition-colors">
                                <component :is="method.icon" class="w-6 h-6" stroke-width="2" />
                            </div>
                            <span class="font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand-700">{{ method.name }}</span>
                        </button>
                    </div>
                </div>

                 <div class="p-4 bg-gray-50 dark:bg-gray-900/30 text-center text-xs text-gray-400">
                    Seleccione el método para confirmar y cerrar la venta.
                </div>
            </div>
        </div>

        <!-- Variant Selection Modal -->
        <div v-if="isVariantModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isVariantModalOpen = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                
                <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div>
                         <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentProduct?.name }}</h2>
                         <p class="text-gray-500 text-sm">Personaliza tu producto</p>
                    </div>
                    <button @click="isVariantModalOpen = false" class="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 transition">
                        <X class="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div class="p-6 overflow-y-auto space-y-6 flex-1">
                     <div v-for="group in currentVariants" :key="group.groupName" class="space-y-3">
                         <h3 class="font-bold text-gray-700 dark:text-gray-300">{{ group.groupName }}</h3>
                         <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             <button 
                                v-for="opt in group.options" 
                                :key="opt.name"
                                @click="selectOption(group.groupName, opt)"
                                class="px-3 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95"
                                :class="selectedOptions[group.groupName]?.name === opt.name 
                                    ? 'bg-brand-600 text-white border-brand-600 ring-2 ring-brand-200 dark:ring-brand-900' 
                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-300'"
                             >
                                <span>{{ opt.name }}</span>
                                <span v-if="opt.extraPrice > 0" class="block text-xs opacity-80">+${{ opt.extraPrice }}</span>
                             </button>
                         </div>
                     </div>
                </div>

                <div class="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <button 
                        @click="confirmVariantSelection"
                        class="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Agregar a la orden</span>
                        <span class="bg-brand-700 px-2 py-0.5 rounded text-sm">${{ currentTotal.toFixed(2) }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Custom Item Modal -->
        <div v-if="isCustomItemModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isCustomItemModalOpen = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                
                <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Venta Personalizada</h2>
                     <button @click="isCustomItemModalOpen = false" class="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 transition">
                        <X class="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto / Descripción</label>
                        <input 
                            v-model="customItemConcept"
                            type="text" 
                            placeholder="Ej. Bebida especial..." 
                            class="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white"
                            autofocus
                        >
                    </div>
                    
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Unitario</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                             <input 
                                v-model.number="customItemPrice"
                                type="number" 
                                min="0"
                                placeholder="0.00" 
                                class="w-full pl-8 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white font-mono"
                            >
                        </div>
                    </div>

                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                        <div class="flex items-center gap-3">
                             <button @click="customItemQuantity = Math.max(1, customItemQuantity - 1)" class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 active:scale-95 font-bold text-gray-600">-</button>
                             <input 
                                v-model.number="customItemQuantity"
                                type="number" 
                                min="1"
                                class="flex-1 text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 font-bold"
                            >
                             <button @click="customItemQuantity++" class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 active:scale-95 font-bold text-gray-600">+</button>
                        </div>
                    </div>
                </div>

                <div class="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <button 
                        @click="addCustomItemToCart"
                        :disabled="!customItemConcept || customItemPrice <= 0"
                        class="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Agregar Items
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- CXC Modal -->
    <Teleport to="body">
        <div v-if="isCXCModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isCXCModalOpen = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                
                <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Cuentas por Cobrar (CXC)</h2>
                     <button @click="isCXCModalOpen = false" class="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 transition">
                        <X class="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div class="p-6 space-y-4">
                    <!-- Customer Name Search -->
                    <div class="relative">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente</label>
                        <input 
                            v-model="cxcCustomer.name"
                            @input="handleCustomerSearch"
                            type="text" 
                            placeholder="Buscar o escribir nombre..." 
                            class="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white"
                            autocomplete="off"
                        >
                        <!-- Search Results Dropdown -->
                        <div v-if="customerSearchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                            <button
                                v-for="cust in customerSearchResults"
                                :key="cust.id"
                                @click="selectCustomer(cust)"
                                class="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                            >
                                <div class="font-bold text-gray-800 dark:text-white">{{ cust.name }}</div>
                                <div class="text-xs text-gray-500">{{ cust.phone || 'Sin teléfono' }}</div>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Customer Phone -->
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono <span class="text-red-500">*</span></label>
                         <input 
                            v-model="cxcCustomer.phone"
                            type="text" 
                            placeholder="Ej. 443..." 
                            class="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white"
                        >
                    </div>
                </div>

                <div class="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <button 
                        @click="confirmCXC"
                        :disabled="!cxcCustomer.name || !cxcCustomer.phone"
                        class="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Confirmar y Cobrar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Courtesy Auth Modal -->
    <Teleport to="body">
        <div v-if="isCourtesyModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isCourtesyModalOpen = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
                
                <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Autorización de Cortesía</h2>
                     <button @click="isCourtesyModalOpen = false" class="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 transition">
                        <X class="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div class="p-6 space-y-4">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo / Autorización <span class="text-red-500">*</span></label>
                         <input 
                            v-model="courtesyAuthText"
                            type="text" 
                            placeholder="Ingrese motivo o código..." 
                            class="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white"
                        >
                    </div>
                </div>

                <div class="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <button 
                        @click="confirmCourtesy"
                        :disabled="!courtesyAuthText"
                        class="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Autorizar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { 
    CreditCard, 
    Banknote, 
    Smartphone, 
    Truck, 
    FileText, 
    Gift,
    X
} from 'lucide-vue-next';

// State
const searchQuery = ref("");
const selectedCategory = ref("all");
const isPaymentModalOpen = ref(false);
const isVariantModalOpen = ref(false);
const isCustomItemModalOpen = ref(false);
const isDiscountDropdownOpen = ref(false);
const selectedDiscount = ref(null); // 'personal_lomas' or null

const currentOrderId = ref(null); // ID of order loaded from Kanban
const currentBulkOrderIds = ref([]); // IDs for bulk CXC liquidation
const cart = ref([]);
const products = ref([]); 
const currentPage = ref(1);
const itemsPerPage = 6;

// Variant Logic State
const currentProduct = ref(null);
const currentVariants = ref([]);
const selectedOptions = ref({});

// Custom Item Logic State
const customItemConcept = ref("");
const customItemPrice = ref(0);
const customItemQuantity = ref(1);

// CXC Logic State
const isCXCModalOpen = ref(false);
const cxcCustomer = ref({ id: null, name: '', phone: '' });
const customerSearchResults = ref([]);

// Courtesy Logic State
const isCourtesyModalOpen = ref(false);
const courtesyAuthText = ref("");

// Payment Methods
const paymentMethods = [
    { id: 'Efectivo', name: 'Efectivo', icon: Banknote },
    { id: 'Tarjeta', name: 'Tarjeta', icon: CreditCard },
    { id: 'Transferencia', name: 'Transferencia', icon: Smartphone },
    { id: 'Uber Eats', name: 'Uber Eats', icon: Truck },
    { id: 'CXC', name: 'CXC', icon: FileText },
    { id: 'Cortesía', name: 'Cortesía', icon: Gift }
];

// ... (Existing computed properties for categories, filteredProducts, pagination) ...
// Categories - Dynamic from Products
const categories = computed(() => {
    const uniqueCats = new Set(products.value.map(p => p.category).filter(Boolean));
    return [
        { id: 'all', name: 'Todo' },
        ...Array.from(uniqueCats).map(c => ({ id: c, name: c }))
    ];
});

// Computed
const filteredProducts = computed(() => {
    let items = products.value;
    if (selectedCategory.value !== 'all') {
        items = items.filter(p => p.category === selectedCategory.value);
    }
    if (searchQuery.value) {
        const lower = searchQuery.value.toLowerCase();
        items = items.filter(p => p.name.toLowerCase().includes(lower));
    }
    return items;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => currentPage.value * itemsPerPage);
const paginatedProducts = computed(() => {
    return filteredProducts.value.slice(startIndex.value, endIndex.value);
});

const currentTotal = computed(() => {
    if (!currentProduct.value) return 0;
    let total = Number(currentProduct.value.price);
    for (const key in selectedOptions.value) {
        total += Number(selectedOptions.value[key].extraPrice || 0);
    }
    return total;
});

watch([selectedCategory, searchQuery], () => {
    currentPage.value = 1;
});

// Watch cart changes and persist to localStorage
watch([cart, currentOrderId, currentBulkOrderIds, selectedDiscount], () => {
    const cartState = {
        cart: cart.value,
        currentOrderId: currentOrderId.value,
        currentBulkOrderIds: currentBulkOrderIds.value,
        selectedDiscount: selectedDiscount.value,
        timestamp: Date.now()
    };
    localStorage.setItem('pos_cart_state', JSON.stringify(cartState));
}, { deep: true });

const subtotal = computed(() => {
    return cart.value.reduce((acc, item) => acc + (item.price * item.quantity), 0);
});

const total = computed(() => {
    let t = subtotal.value;
    if (selectedDiscount.value === 'personal_lomas') {
        t = t * 0.90; // 10% discount
    }
    return t;
}); 

const applyDiscount = (type) => {
    selectedDiscount.value = type;
    isDiscountDropdownOpen.value = false;
}; 

// Actions
const fetchProducts = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/menu-items`);
        if (res.ok) {
            products.value = await res.json();
        }
    } catch (e) {
        console.error("Error loading products", e);
    }
};

// ... (addToCart, etc) ...
const addToCart = async (product) => {
    if (product.type === 'variable') {
        currentProduct.value = product;
        currentVariants.value = product.variantGroups || [];
        
        // Pre-seleccionar la primera opción de cada grupo de variaciones
        const preselectedOptions = {};
        currentVariants.value.forEach(group => {
            if (group.options && group.options.length > 0) {
                preselectedOptions[group.groupName] = group.options[0];
            }
        });
        selectedOptions.value = preselectedOptions;
        
        isVariantModalOpen.value = true;
        return;
    }
    _addItemToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        variations: [],
        note: ''
    });
};

const selectOption = (groupName, option) => {
    // Force reactivity update using spread syntax
    selectedOptions.value = {
        ...selectedOptions.value,
        [groupName]: option
    };
};

const confirmVariantSelection = () => {
    const variationsList = [];
    for (const [group, opt] of Object.entries(selectedOptions.value)) {
        variationsList.push(`${group}: ${opt.name}`);
    }
    _addItemToCart({
        id: currentProduct.value.id,
        name: currentProduct.value.name,
        price: currentTotal.value, 
        variations: variationsList,
        note: '',
        isVariable: true 
    });
    isVariantModalOpen.value = false;
};

// Custom Item
const openCustomItemModal = () => {
    customItemConcept.value = "";
    customItemPrice.value = null; 
    customItemQuantity.value = 1;
    isCustomItemModalOpen.value = true;
};

const addCustomItemToCart = () => {
    if (!customItemConcept.value || customItemPrice.value <= 0) return;
    _addItemToCart({
        id: `custom-${Date.now()}`, 
        name: customItemConcept.value,
        price: Number(customItemPrice.value),
        variations: [],
        note: '',
        isCustom: true
    }, customItemQuantity.value);
    isCustomItemModalOpen.value = false;
};

const _addItemToCart = (itemPayload, qty = 1) => {
    const existingIndex = cart.value.findIndex(p => 
        p.id === itemPayload.id && 
        JSON.stringify(p.variations) === JSON.stringify(itemPayload.variations) &&
        p.note === itemPayload.note
    );
    if (existingIndex > -1) {
        cart.value[existingIndex].quantity += qty;
    } else {
        cart.value.push({ ...itemPayload, quantity: qty });
    }
};

const updateQuantity = (index, change) => {
    const item = cart.value[index];
    item.quantity += change;
    if (item.quantity <= 0) cart.value.splice(index, 1);
};

const clearCart = async () => {
    if(!confirm('¿Limpiar orden actual?')) return;
    
    // If there's an order from Kanban, return it to 'delivering' status
    try {
        if (currentBulkOrderIds.value.length > 0) {
            // Return all bulk orders to delivering
            const updates = currentBulkOrderIds.value.map(id => 
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'delivering' })
                })
            );
            await Promise.all(updates);
        } else if (currentOrderId.value) {
            // Return single order to delivering
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${currentOrderId.value}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'delivering' })
            });
        }
    } catch (e) {
        console.error('Error returning order to Kanban:', e);
    }
    
    // Clear cart and state
    cart.value = [];
    currentOrderId.value = null; 
    currentBulkOrderIds.value = [];
    // Clear persisted state
    localStorage.removeItem('pos_cart_state');
};

// Payment
const openPaymentModal = () => isPaymentModalOpen.value = true;

// CXC Functions
const handleCustomerSearch = async () => {
    const query = cxcCustomer.value.name;
    // Reset ID if user types to allow new creation unless they select again
    if (cxcCustomer.value.id && cxcCustomer.value.name !== query) {
         // Optionally keep ID logic if strictly matching? Better to reset if they change the name.
         // But the user might just be correcting a typo. 
         // Strategy: If they change the name, we assume it might be a new person OR they need to search again.
         // We reset ID to be safe. If they pick from list, ID is set.
         cxcCustomer.value.id = null;
    }

    if (query.length < 2) {
        customerSearchResults.value = [];
        return;
    }

    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/customers?q=${encodeURIComponent(query)}`);
        if (res.ok) {
            customerSearchResults.value = await res.json();
        }
    } catch (e) {
        console.error("Error searching customers", e);
    }
};

const selectCustomer = (cust) => {
    cxcCustomer.value = { ...cust };
    customerSearchResults.value = [];
};

const confirmCXC = () => {
    if (!cxcCustomer.value.name || !cxcCustomer.value.phone) return;
    isCXCModalOpen.value = false;
    processPayment('CXC');
};

const confirmCourtesy = () => {
    if (!courtesyAuthText.value) return;
    isCourtesyModalOpen.value = false;
    processPayment('Cortesía');
};


const processPayment = async (method) => {
    // Intercept CXC
    if (method === 'CXC') {
        // If customer data is already set (confirmCXC was called), proceed directly.
        // Otherwise open CXC modal to collect customer info.
        if (!cxcCustomer.value.name || !cxcCustomer.value.phone) {
            cxcCustomer.value = { id: null, name: '', phone: '' };
            customerSearchResults.value = [];
            isPaymentModalOpen.value = false;
            isCXCModalOpen.value = true;
            return;
        }
        // Customer data already confirmed via CXC modal — proceed directly, no extra confirm().
    } else if (method === 'Cortesía') {
        if (!isCourtesyModalOpen.value && (!courtesyAuthText.value)) {
             isPaymentModalOpen.value = false;
             isCourtesyModalOpen.value = true;
             courtesyAuthText.value = ""; // Reset on open
             return;
        }
        // If authorized, proceed.
    } else {
         if (!confirm(`¿Confirmar cobro con ${method}?`)) return;
    }

    // Get current user - Force reload
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    try {
        let res;

        // SCENARIO 0: Bulk Liquidation (Multiple Orders)
        if (currentBulkOrderIds.value.length > 0) {
            // 1. Fetch current totals of original CXC orders from the server
            const originalOrderFetches = currentBulkOrderIds.value.map(id =>
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders?id=${id}`)
                    .then(r => r.json())
                    .then(rows => rows[0])
            );
            const originalOrders = await Promise.all(originalOrderFetches);
            const originalTotal = originalOrders.reduce((sum, o) => sum + Number(o?.total || 0), 0);
            const cartTotal = total.value;
            const extraAmount = Math.max(0, cartTotal - originalTotal);

            // 2. Update each original CXC order: mark as paid with its own total
            const updates = currentBulkOrderIds.value.map((id, idx) => {
                const origTotal = Number(originalOrders[idx]?.total || 0);
                return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentMethod: method,
                        status: 'completed',
                        total: origTotal,  // Keep original total for this order's AR record
                        userName: user ? user.username : 'Sistema',
                        userId: user ? user.id : null,
                        cxcCustomerId: method === 'CXC' ? cxcCustomer.value.id : null,
                        cxcCustomerName: method === 'CXC' ? cxcCustomer.value.name : null,
                        cxcCustomerPhone: method === 'CXC' ? cxcCustomer.value.phone : null
                    })
                });
            });
            await Promise.all(updates);

            // 3. If extra items were added in the cart beyond the original CXC amounts,
            //    create a new supplementary completed order for the difference so it shows in the corte.
            if (extraAmount > 0.01) {
                // We create a "Complemento" order with a single line item representing the extra amount.
                // This avoids any ambiguity about which specific items are "new" vs. "original".
                const extraPayload = {
                    customerName: 'Complemento CXC',
                    customerPhone: '',
                    location: 'Barra',
                    paymentMethod: method,
                    deliveryTime: new Date().toTimeString().slice(0, 5),
                    items: [{
                        id: null,
                        title: 'Complemento CXC',
                        price: extraAmount,
                        quantity: 1,
                        variations: [],
                        note: `Diferencia en liquidación CXC`
                    }],
                    generalNote: `Complemento liquidación CXC`,
                    total: extraAmount,
                    discount: 0,
                    userId: user ? user.id : null,
                    userName: user ? user.username : 'Sistema',
                    status: 'completed'
                };
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(extraPayload)
                });
            }

            res = { ok: true };
        }
        // SCENARIO 1: Existing Single Order (Loaded from Kanban) -> UPDATE it
        else if (currentOrderId.value) {
            res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${currentOrderId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod: method,
                    status: 'completed', // Ensure it stays completed/closed
                    total: total.value,
                    discount: selectedDiscount.value ? (subtotal.value - total.value) : 0,
                    userName: user ? user.username : 'Sistema',
                    userId: user ? user.id : null,
                    // CXC payload
                    cxcCustomerId: method === 'CXC' ? cxcCustomer.value.id : null,
                    cxcCustomerName: method === 'CXC' ? cxcCustomer.value.name : null,
                    cxcCustomerPhone: method === 'CXC' ? cxcCustomer.value.phone : null
                })
            });
        } 
        // SCENARIO 2: New POS Sale -> CREATE new 'completed' order
        else {
             const orderPayload = {
                customerName: method === 'CXC' ? cxcCustomer.value.name : 'Pedido en Barra', 
                customerPhone: method === 'CXC' ? cxcCustomer.value.phone : '',
                location: 'Barra', 
                paymentMethod: method,
                deliveryTime: new Date().toTimeString().slice(0, 5), // "HH:MM" format 
                items: cart.value.map(item => ({
                    id: item.id && item.id.toString().startsWith('custom-') ? null : item.id, 
                    title: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    variations: item.variations, 
                    note: item.note
                })),
                generalNote: method === 'CXC' ? `Venta CXC - ${cxcCustomer.value.name}` : ( method === 'Cortesía' ? `Cortesía Auto: ${courtesyAuthText.value}` : 'Venta Directa POS'),
                total: total.value,
                discount: selectedDiscount.value ? (subtotal.value - total.value) : 0,
                userId: user ? user.id : null,
                userName: user ? user.username : 'Sistema', // Add username
                status: 'completed', // DIRECT TO COMPLETED, SKIP KANBAN,
                // CXC payload
                cxcCustomerId: method === 'CXC' ? cxcCustomer.value.id : null,
                cxcCustomerName: method === 'CXC' ? cxcCustomer.value.name : null,
                cxcCustomerPhone: method === 'CXC' ? cxcCustomer.value.phone : null
            };

            res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });
        }

        if (res.ok) {
            // Success
            isPaymentModalOpen.value = false;
            cart.value = [];
            currentOrderId.value = null;
            currentBulkOrderIds.value = [];
            // Clear persisted state on successful payment
            localStorage.removeItem('pos_cart_state');
            cxcCustomer.value = { id: null, name: '', phone: '' };
            customerSearchResults.value = [];
            alert('¡Venta registrada correctamente!');
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Server Error:', errData);
            
            const errMsg = errData.error || 'Error desconocido';
            
            // Check for Stale User ID (Foreign Key Violation)
            if (errMsg.includes('user_id') || errMsg.includes('foreign key') || errMsg.includes('users')) {
                 alert('Tu sesión no es válida (el usuario no existe). Se cerrará la sesión para corregirlo.');
                 localStorage.removeItem('user');
                 localStorage.removeItem('token');
                 window.location.href = '/login'; // Redirect to login
                 return;
            }

            alert('Error al registrar venta: ' + errMsg);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión: ' + e.message);
    }
};

onMounted(() => {
    fetchProducts();

    // Check for pending order from Orders/Kitchen view (priority)
    const pendingOrder = localStorage.getItem('pending_pos_load');
    const pendingBulk = localStorage.getItem('pending_pos_load_bulk');

    if (pendingBulk) {
        try {
            const orders = JSON.parse(pendingBulk);
            currentBulkOrderIds.value = orders.map(o => o.id);
            
            // Consolidate items
            let allItems = [];
            orders.forEach(o => {
                const orderItems = o.items || [];
                const formattedItems = orderItems.map(i => ({
                    id: i.menuItemId || `custom-loaded-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    name: i.name,
                    price: Number(i.price),
                    quantity: Number(i.quantity),
                    variations: i.variations || [], // ensure array
                    note: i.note || '',
                    isVariable: (i.variations && i.variations.length > 0),
                    isCustom: !i.menuItemId
                }));
                allItems = [...allItems, ...formattedItems];
            });
            
            cart.value = allItems;
            localStorage.removeItem('pending_pos_load_bulk');
        } catch(e) {
            console.error("Error loading bulk", e);
        }
    }
    else if (pendingOrder) {
        try {
            const order = JSON.parse(pendingOrder);
            if (order && order.id) {
                currentOrderId.value = order.id; // Capture ID
            }
            if (order && order.items) {
                cart.value = order.items.map(i => {
                    // Determine ID: Use menuItemId if it exists (Catalog Item).
                    // If null, it's a custom item or legacy, give it a temp custom ID.
                    const itemId = i.menuItemId ? i.menuItemId : `custom-loaded-${Date.now()}-${Math.floor(Math.random()*1000)}`;

                    return {
                        id: itemId,
                        name: i.name,
                        price: Number(i.price),
                        quantity: Number(i.quantity),
                        variations: i.variations || [], // ensure array
                        note: i.note || '',
                         // Helper flags
                        isVariable: (i.variations && i.variations.length > 0),
                        isCustom: !i.menuItemId
                    };
                });
                // Optional: Notify user
                // alert(`Orden #${order.id} cargada`);
            }
            localStorage.removeItem('pending_pos_load');
        } catch (e) {
             console.error("Error loading pending order:", e);
        }
    }
    // If no pending orders from Kanban, try to restore previous cart state
    else {
        try {
            const savedState = localStorage.getItem('pos_cart_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                const now = Date.now();
                // Valid for 24 hours
                if (state.timestamp && (now - state.timestamp < 24 * 60 * 60 * 1000)) {
                    cart.value = state.cart || [];
                    currentOrderId.value = state.currentOrderId || null;
                    currentBulkOrderIds.value = state.currentBulkOrderIds || [];
                    selectedDiscount.value = state.selectedDiscount || null; // Restore discount state
                    
                    if (cart.value.length > 0) {
                        console.log('Carrito restaurado desde sesión anterior');
                    }
                } else {
                    // Too old, clear it
                    localStorage.removeItem('pos_cart_state');
                }
            }
        } catch (e) {
            console.error("Error restoring cart state:", e);
            localStorage.removeItem('pos_cart_state');
        }
    }
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
