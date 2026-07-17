<template>
  <Modal :fullScreenBackdrop="true" @close="$emit('cancel')">
    <template #body>
      <div class="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-theme-lg dark:bg-gray-900 mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white/90">
              Importar Facturas XML
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Arrastra tus archivos de factura XML (CFDI) para procesarlos de forma automática.
            </p>
          </div>
          <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-500 transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Drag & Drop Zone -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
          :class="[
            'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center',
            isDragging 
              ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/5' 
              : 'border-gray-300 dark:border-gray-700 hover:border-brand-500 bg-gray-50/50 dark:bg-white/[0.01]'
          ]"
        >
          <input 
            type="file" 
            ref="fileInput" 
            accept=".xml" 
            multiple 
            class="hidden" 
            @change="handleFileSelect" 
          />
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            Arrastra tus archivos aquí o <span class="text-brand-500 hover:underline">búscalos en tu equipo</span>
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Solo archivos .xml (formato SAT CFDI)
          </p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMsg" class="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {{ errorMsg }}
        </div>

        <!-- Files List & Review -->
        <div v-if="filesList.length > 0 && !mappingPhase" class="mt-6 flex-1 overflow-y-auto min-h-[150px] custom-scrollbar">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
            <span>Facturas en Cola ({{ filesList.length }})</span>
            <span class="text-brand-500 font-bold">{{ formatCurrency(totalQueueAmount) }} MXN</span>
          </h4>
          <div class="space-y-2 pr-1">
            <div 
              v-for="(item, idx) in filesList" 
              :key="idx" 
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02]"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-gray-800 dark:text-white/90 text-sm truncate">
                    {{ item.factura }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    {{ item.fecha }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {{ item.proveedor }} ({{ item.items.length }} conceptos)
                </p>
              </div>
              <div class="flex items-center gap-4 ml-4">
                <span class="font-bold text-sm text-gray-800 dark:text-white/90">
                  {{ formatCurrency(item.total) }}
                </span>
                <button 
                  @click="removeFileFromQueue(idx)" 
                  :disabled="importing || isAnalyzing"
                  class="text-gray-400 hover:text-error-500 transition-colors disabled:opacity-30"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mapping Review -->
        <div v-else-if="mappingPhase" class="mt-6 flex-1 overflow-y-auto min-h-[150px] custom-scrollbar">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Resolución de Conceptos
          </h4>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {{ unmappedConcepts.length }} producto{{ unmappedConcepts.length !== 1 ? 's' : '' }} sin mapear detectado{{ unmappedConcepts.length !== 1 ? 's' : '' }}.
          </p>
          <div class="space-y-3 pr-1">
            <div
              v-for="(concept, idx) in unmappedConcepts"
              :key="idx"
              :class="[
                'p-4 rounded-lg border transition-colors',
                concept.confidence === 'medium'
                  ? 'border-amber-200 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-900/10'
                  : 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-white/[0.02]'
              ]"
            >
              <!-- Concept Name from XML -->
              <div class="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p class="font-semibold text-sm text-gray-800 dark:text-white/90">{{ concept.supplierDescription }}</p>
                  <span
                    :class="[
                      'inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                      concept.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    ]"
                  >
                    {{ concept.confidence === 'medium' ? 'Sugerencia' : 'Sin coincidencia' }}
                  </span>
                </div>
              </div>

              <!-- MEDIUM suggestion -->
              <div v-if="concept.confidence === 'medium' && !concept.showFullList" class="space-y-2">
                <p class="text-xs text-gray-500 dark:text-gray-400">Posible coincidencia encontrada:</p>
                <div class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700">
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ concept.suggestions[0].name }}</p>
                    <p class="text-xs text-amber-600 dark:text-amber-400">Similitud: {{ concept.suggestions[0].score }}%</p>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button
                      @click="concept.selectedOption = concept.suggestions[0].id"
                      :class="[
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        concept.selectedOption === concept.suggestions[0].id
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-700 dark:text-gray-300'
                      ]"
                    >
                      ✔ Confirmar
                    </button>
                    <button
                      @click="concept.showFullList = true; concept.selectedOption = ''"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition-colors"
                    >
                      Otro...
                    </button>
                  </div>
                </div>
              </div>

              <!-- LOW or full dropdown select list -->
              <div v-if="concept.confidence === 'low' || concept.showFullList" class="space-y-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Asociar a Producto Existente:</label>
                <select
                  v-model="concept.selectedOption"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="" disabled>Seleccione una opción...</option>
                  <option v-for="sug in concept.suggestions" :key="sug.id" :value="sug.id">
                    {{ sug.name }} ({{ sug.score }}%)
                  </option>
                  <option value="new">➕ Usar como producto nuevo</option>
                </select>
              </div>

              <!-- Form for typing a new clean description -->
              <div v-if="concept.selectedOption === 'new'" class="mt-3 grid grid-cols-1 gap-2">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Nombre en Catálogo</label>
                  <input type="text" v-model="concept.newName"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Action Area -->
        <div class="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-col gap-3">
          <!-- Importing Progress -->
          <div v-if="importing" class="w-full">
            <div class="flex items-center justify-between text-xs font-semibold text-brand-500 mb-1.5">
              <span>{{ progressText }}</span>
              <span>{{ Math.round((importIndex / filesList.length) * 100) }}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div 
                class="h-full bg-brand-500 transition-all duration-300"
                :style="{ width: `${(importIndex / filesList.length) * 100}%` }"
              ></div>
            </div>
          </div>

          <div class="flex justify-end gap-3 w-full">
            <Button 
              variant="outline" 
              @click="$emit('cancel')" 
              :disabled="importing || isAnalyzing"
            >
              Cancelar
            </Button>
            <Button 
              v-if="!mappingPhase"
              @click="analyzeConcepts" 
              :disabled="filesList.length === 0 || importing || isAnalyzing"
              class="min-w-[140px]"
            >
              <span v-if="importing">Importando...</span>
              <span v-else-if="isAnalyzing">Analizando...</span>
              <span v-else>Importar {{ filesList.length }} {{ filesList.length === 1 ? 'factura' : 'facturas' }}</span>
            </Button>
            <Button 
              v-else
              @click="confirmMappingsAndImport" 
              :disabled="importing || !allMapped"
              class="min-w-[140px]"
            >
              <span v-if="importing">Guardando...</span>
              <span v-else>Confirmar y Continuar</span>
            </Button>
          </div>
        </div>

      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '@/components/ui/Modal.vue';
import Button from '@/components/ui/Button.vue';
import { authFetch } from '@/utils/api';

const emit = defineEmits(['imported', 'cancel']);

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const errorMsg = ref('');
const importing = ref(false);
const importIndex = ref(0);
const progressText = ref('');

const isAnalyzing = ref(false);
const mappingPhase = ref(false);
const unmappedConcepts = ref<any[]>([]);
const conceptMap = ref<Record<string, string>>({});

const allMapped = computed(() => {
  return unmappedConcepts.value.length > 0 && unmappedConcepts.value.every(c => c.selectedOption);
});

interface XMLParsedItem {
  cantidad: number;
  medida: string;
  producto: string;
  precioUnitario: number;
  descuento: number;
  productId?: string;
}

interface XMLParsedInvoice {
  factura: string;
  fecha: string;
  proveedor: string;
  formaPago: string;
  items: XMLParsedItem[];
  total: number;
}

const filesList = ref<XMLParsedInvoice[]>([]);

const totalQueueAmount = computed(() => {
  return filesList.value.reduce((acc, item) => acc + item.total, 0);
});

const triggerFileInput = () => {
  if (!importing.value) {
    fileInput.value?.click();
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (importing.value) return;
  const files = e.dataTransfer?.files;
  if (files) {
    processFiles(files);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    processFiles(target.files);
  }
};

// Simple text normalization helper to use locally in supplier names
const cleanSupplierName = (name: string): string => {
  if (!name) return 'Proveedor XML';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

const processFiles = (files: FileList) => {
  errorMsg.value = '';
  const xmlFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.xml'));

  if (xmlFiles.length === 0) {
    errorMsg.value = 'Por favor selecciona únicamente archivos con extensión .xml';
    return;
  }

  xmlFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const parserError = xmlDoc.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
          throw new Error(`El archivo ${file.name} no es un XML válido.`);
        }

        const comprobante = xmlDoc.getElementsByTagNameNS("*", "Comprobante")[0] || xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
        if (!comprobante) {
          throw new Error(`Formato de factura CFDI no detectado en ${file.name}.`);
        }

        const serie = comprobante.getAttribute("Serie") || "";
        const folioAttr = comprobante.getAttribute("Folio") || "";
        let factura = serie && folioAttr ? `${serie}-${folioAttr}` : folioAttr;
        
        if (!factura) {
          const complemento = xmlDoc.getElementsByTagNameNS("*", "Complemento")[0] || xmlDoc.getElementsByTagName("cfdi:Complemento")[0];
          if (complemento) {
            const tfd = complemento.getElementsByTagNameNS("*", "TimbreFiscalDigital")[0] || complemento.getElementsByTagName("tfd:TimbreFiscalDigital")[0];
            if (tfd) factura = tfd.getAttribute("UUID") || "";
          }
        }
        
        if (!factura) {
          factura = `XML-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        const fechaAttr = comprobante.getAttribute("Fecha") || "";
        const fecha = fechaAttr ? fechaAttr.split("T")[0] : new Date().toISOString().split("T")[0];
        
        const formaPagoAttr = comprobante.getAttribute("FormaPago") || "01";
        let formaPago = "Efectivo";
        if (formaPagoAttr === "03") formaPago = "Transferencia";
        else if (formaPagoAttr === "04" || formaPagoAttr === "28") formaPago = "Tarjeta";
        else if (formaPagoAttr === "99") formaPago = "CXP";

        const emisor = xmlDoc.getElementsByTagNameNS("*", "Emisor")[0] || xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
        const proveedorRaw = emisor ? emisor.getAttribute("Nombre") || "Proveedor XML" : "Proveedor XML";
        const proveedor = cleanSupplierName(proveedorRaw);

        const conceptosElements = xmlDoc.getElementsByTagNameNS("*", "Concepto") || xmlDoc.getElementsByTagName("cfdi:Concepto");
        const items: XMLParsedItem[] = [];

        let subtotal = 0;

        for (let i = 0; i < conceptosElements.length; i++) {
          const itemEl = conceptosElements[i];
          const cantidad = parseFloat(itemEl.getAttribute("Cantidad") || "1");
          
          const unidad = (itemEl.getAttribute("Unidad") || "").toLowerCase();
          const claveUnidad = (itemEl.getAttribute("ClaveUnidad") || "").toUpperCase();
          let medida = "Pzas";
          if (unidad.includes("kg") || unidad.includes("kilo") || claveUnidad === "KGM") medida = "Kg";
          else if (unidad.includes("gr") || unidad.includes("gramo") || claveUnidad === "GRM") medida = "Gr";
          else if (unidad.includes("lt") || unidad.includes("litro") || claveUnidad === "LTR") medida = "Lt";
          else if (unidad.includes("ml") || unidad.includes("mililitro") || claveUnidad === "MLT") medida = "Ml";

          const productoRaw = itemEl.getAttribute("Descripcion") || "Producto XML";
          const producto = productoRaw.trim();
          const precioUnitario = parseFloat(itemEl.getAttribute("ValorUnitario") || "0");
          const descuento = parseFloat(itemEl.getAttribute("Descuento") || "0");

          subtotal += (cantidad * precioUnitario) - descuento;

          items.push({
            cantidad,
            medida,
            producto,
            precioUnitario,
            descuento
          });
        }

        const total = subtotal * 1.16; // 16% IVA

        const exists = filesList.value.some(inv => inv.factura === factura && inv.proveedor === proveedor);
        if (!exists) {
          filesList.value.push({
            factura,
            fecha,
            proveedor,
            formaPago,
            items,
            total
          });
        }
      } catch (err: any) {
        errorMsg.value = err.message || `Error al procesar el archivo ${file.name}`;
      }
    };
    reader.readAsText(file);
  });

  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeFileFromQueue = (index: number) => {
  filesList.value.splice(index, 1);
};

const analyzeConcepts = async () => {
  if (filesList.value.length === 0) return;
  isAnalyzing.value = true;
  errorMsg.value = '';

  const uniqueConcepts = new Set<string>();
  
  filesList.value.forEach(inv => {
    inv.items.forEach(item => {
      uniqueConcepts.add(item.producto);
    });
  });

  try {
    const res = await authFetch('/api/purchases/resolver-conceptos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptos: Array.from(uniqueConcepts) })
    });

    if (!res.ok) throw new Error('Error al analizar conceptos en el servidor');
    const results = await res.json();

    unmappedConcepts.value = [];
    conceptMap.value = {};
    const autoNewPromises: Promise<any>[] = [];

    for (const r of results) {
      if (r.mapped) {
        conceptMap.value[r.supplierDescription] = r.productId;
      } else if (r.confidence === 'auto_new') {
        // Auto-create mapping alias pointing to itself
        const p = authFetch('/api/purchases/aliases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: r.supplierDescription, supplierDescription: r.supplierDescription })
        })
        .then(res => {
          if (!res.ok) throw new Error('Error al crear alias automático');
          conceptMap.value[r.supplierDescription] = r.supplierDescription;
        });
        autoNewPromises.push(p);
      } else {
        unmappedConcepts.value.push({
          ...r,
          selectedOption: r.confidence === 'medium' && r.suggestions.length > 0
            ? r.suggestions[0].id
            : '',
          showFullList: false,
          newName: r.supplierDescription
        });
      }
    }

    if (autoNewPromises.length > 0) {
      await Promise.all(autoNewPromises);
    }

    if (unmappedConcepts.value.length > 0) {
      mappingPhase.value = true;
    } else {
      await startImport();
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Error en análisis';
  } finally {
    isAnalyzing.value = false;
  }
};

const confirmMappingsAndImport = async () => {
  importing.value = true;
  errorMsg.value = '';
  progressText.value = 'Guardando nuevos alias...';

  try {
    for (const concept of unmappedConcepts.value) {
      let productId = concept.selectedOption;
      
      if (productId === 'new') {
        productId = concept.newName;
      }

      const aliasRes = await authFetch('/api/purchases/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, supplierDescription: concept.supplierDescription })
      });
      if (!aliasRes.ok) throw new Error('Error al guardar alias de ' + concept.supplierDescription);

      conceptMap.value[concept.supplierDescription] = productId;
    }

    mappingPhase.value = false;
    await startImport();
  } catch (err: any) {
    errorMsg.value = err.message;
    importing.value = false;
  }
};

const startImport = async () => {
  importing.value = true;
  importIndex.value = 0;
  errorMsg.value = '';

  for (let i = 0; i < filesList.value.length; i++) {
    const inv = filesList.value[i];
    importIndex.value = i;
    progressText.value = `Importando factura ${i + 1} de ${filesList.value.length} (${inv.factura})...`;
    
    try {
      const response = await authFetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: inv.factura,
          provider: inv.proveedor,
          date: inv.fecha,
          total: inv.total,
          paymentMethod: inv.formaPago,
          items: inv.items.map(item => ({
            producto: item.producto,
            cantidad: item.cantidad,
            medida: item.medida,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento,
            productId: conceptMap.value[item.producto]
          }))
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al guardar factura.');
      }
    } catch (err: any) {
      errorMsg.value = `Error en factura ${inv.factura}: ${err.message || 'Error al guardar.'}`;
      importing.value = false;
      return;
    }
  }

  importIndex.value = filesList.value.length;
  progressText.value = '¡Todas las facturas se importaron correctamente!';
  setTimeout(() => {
    emit('imported');
  }, 1000);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};
</script>
