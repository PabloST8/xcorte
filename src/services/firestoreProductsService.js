import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

export const firestoreProductsService = {
  // Buscar produtos/serviços por filtros
  async getProducts(filters = {}) {
    try {
      let products = [];

      // Estratégia 1: Buscar produtos da subcoleção da empresa
      if (filters.enterpriseEmail) {
        try {
          const enterpriseProductsRef = collection(
            db,
            "enterprises",
            filters.enterpriseEmail,
            "products"
          );
          const productsQuery = query(enterpriseProductsRef, limit(100));
          const snapshot = await getDocs(productsQuery);

          snapshot.forEach((doc) => {
            const data = doc.data();
            products.push({
              id: doc.id,
              ...this.mapProductData(data),
            });
          });

          // Se encontrou produtos na subcoleção, usar esses dados
          if (products.length > 0) {
            return this.processProducts(products, filters);
          }
        } catch (error) {
          console.log(
            "Subcoleção de produtos não encontrada, tentando coleção global:",
            error.message
          );
        }
      }

      // Estratégia 2: Fallback para coleção global de produtos
      if (products.length === 0) {
        try {
          const productsQuery = query(collection(db, "products"), limit(100));
          const snapshot = await getDocs(productsQuery);

          snapshot.forEach((doc) => {
            const data = doc.data();

            // Filtrar por empresa se especificado
            if (
              !filters.enterpriseEmail ||
              data.enterpriseEmail === filters.enterpriseEmail
            ) {
              products.push({
                id: doc.id,
                ...this.mapProductData(data),
              });
            }
          });
        } catch (error) {
          console.log("Erro ao buscar da coleção products:", error);
        }
      }

      // Processar e filtrar produtos
      return this.processProducts(products, filters);
    } catch (error) {
      console.error("Erro ao buscar produtos do Firestore:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Função auxiliar para mapear dados do produto
  mapProductData(data) {
    // Converter preço de centavos para reais se necessário
    let price = parseFloat(data.price || data.productPrice) || 0;
    if (price > 100 && Number.isInteger(price)) {
      price = price / 100;
    }

    return {
      name: data.name || data.productName || "Serviço",
      description: data.description || "",
      price: price,
      duration: data.duration || data.productDuration || 30,
      category: data.category || "Geral",
      isActive: data.isActive !== false, // Ativo por padrão
      enterpriseEmail: data.enterpriseEmail || "",
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",

      // Campos adicionais
      imageUrl: data.imageUrl || "",
      ...data,
    };
  },

  // Função auxiliar para processar e filtrar produtos
  processProducts(products, filters) {
    let filteredProducts = products;

    // Filtrar por termo de busca no frontend
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredProducts = products.filter(
        (product) =>
          (product.name || "").toLowerCase().includes(searchTerm) ||
          (product.description || "").toLowerCase().includes(searchTerm) ||
          (product.category || "").toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por categoria
    if (filters.category) {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === filters.category
      );
    }

    // Filtrar por status ativo
    if (filters.activeOnly) {
      filteredProducts = filteredProducts.filter(
        (product) => product.isActive === true
      );
    }

    // Ordenar no frontend
    filteredProducts.sort((a, b) => {
      // Ordenar por nome por padrão
      return (a.name || "").localeCompare(b.name || "");
    });

    return {
      success: true,
      data: filteredProducts,
    };
  },

  // Criar novo produto/serviço
  async createProduct(productData, enterpriseEmail = null) {
    try {
      // Converter preço para centavos se necessário
      const price = Math.round((productData.price || 0) * 100);

      const newProduct = {
        name: productData.name || "",
        description: productData.description || "",
        price: price,
        duration: productData.duration || 30,
        category: productData.category || "Geral",
        isActive: productData.isActive !== false,
        enterpriseEmail: enterpriseEmail || productData.enterpriseEmail || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let docRef;

      if (enterpriseEmail) {
        // Criar na subcoleção da empresa
        const enterpriseProductsRef = collection(
          db,
          "enterprises",
          enterpriseEmail,
          "products"
        );
        docRef = await addDoc(enterpriseProductsRef, newProduct);
      } else {
        // Criar na coleção global
        docRef = await addDoc(collection(db, "products"), newProduct);
      }

      return {
        success: true,
        data: { id: docRef.id, ...newProduct },
      };
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Atualizar produto/serviço
  async updateProduct(productId, productData, enterpriseEmail = null) {
    try {
      // Converter preço para centavos se necessário
      const price = Math.round((productData.price || 0) * 100);

      const updatedProduct = {
        name: productData.name || "",
        description: productData.description || "",
        price: price,
        duration: productData.duration || 30,
        category: productData.category || "Geral",
        isActive: productData.isActive !== false,
        updatedAt: new Date().toISOString(),
      };

      let productRef;

      if (enterpriseEmail) {
        // Atualizar na subcoleção da empresa
        productRef = doc(
          db,
          "enterprises",
          enterpriseEmail,
          "products",
          productId
        );
      } else {
        // Atualizar na coleção global
        productRef = doc(db, "products", productId);
      }

      await updateDoc(productRef, updatedProduct);

      return {
        success: true,
        data: { id: productId, ...updatedProduct },
      };
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Deletar produto/serviço
  async deleteProduct(productId, enterpriseEmail = null) {
    try {
      let productRef;

      if (enterpriseEmail) {
        // Deletar da subcoleção da empresa
        productRef = doc(
          db,
          "enterprises",
          enterpriseEmail,
          "products",
          productId
        );
      } else {
        // Deletar da coleção global
        productRef = doc(db, "products", productId);
      }

      await deleteDoc(productRef);

      return {
        success: true,
        message: "Produto deletado com sucesso",
      };
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
