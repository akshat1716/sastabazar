// Sample products data for sastabazar
// You can use this to populate your database with initial products

const sampleProducts = [
  // Apparel Category
  {
    name: "Premium Cotton T-Shirt",
    brand: "sastabazar",
    category: "apparel",
    shortDescription: "Ultra-soft premium cotton t-shirt with minimalist design.",
    description: "Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear with exceptional comfort and breathability. Made from 100% organic cotton with a comfortable fit that's perfect for any occasion.",
    basePrice: 1299,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        alt: "Premium Cotton T-Shirt",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop",
        alt: "Premium Cotton T-Shirt Back View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "S",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-S-BLACK"
      },
      {
        name: "Size",
        value: "M",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-M-BLACK"
      },
      {
        name: "Size",
        value: "L",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-L-BLACK"
      },
      {
        name: "Size",
        value: "XL",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-XL-BLACK"
      }
    ],
    tags: ["cotton", "premium", "minimalist", "comfortable"]
  },
  {
    name: "Designer Denim Jacket",
    brand: "sastabazar",
    category: "apparel",
    shortDescription: "Classic denim jacket with modern tailoring.",
    description: "Classic denim jacket with modern tailoring. Features premium denim construction with comfortable fit and timeless style. Perfect for layering in any season with a versatile design that goes with everything.",
    basePrice: 3499,
    salePrice: 2799,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1544022613-e87ca540a84a?w=500&h=500&fit=crop",
        alt: "Designer Denim Jacket",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop",
        alt: "Designer Denim Jacket Back View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "S",
        price: 3499,
        stock: 25,
        sku: "JACKET-S-BLUE"
      },
      {
        name: "Size",
        value: "M",
        price: 3499,
        stock: 25,
        sku: "JACKET-M-BLUE"
      },
      {
        name: "Size",
        value: "L",
        price: 3499,
        stock: 25,
        sku: "JACKET-L-BLUE"
      },
      {
        name: "Size",
        value: "XL",
        price: 3499,
        stock: 25,
        sku: "JACKET-XL-BLUE"
      }
    ],
    tags: ["denim", "jacket", "classic", "premium"]
  },

  // Home Goods Category
  {
    name: "Minimalist Ceramic Vase",
    brand: "sastabazar",
    category: "home-goods",
    shortDescription: "Handcrafted ceramic vase with minimalist design.",
    description: "Handcrafted ceramic vase with minimalist design. Perfect for displaying fresh flowers or as a standalone decorative piece. Each vase is uniquely crafted by skilled artisans using traditional techniques.",
    basePrice: 899,
    salePrice: 699,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop",
        alt: "Minimalist Ceramic Vase",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop",
        alt: "Minimalist Ceramic Vase Side View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "Small",
        price: 899,
        stock: 30,
        sku: "VASE-SMALL-WHITE"
      },
      {
        name: "Size",
        value: "Medium",
        price: 899,
        stock: 30,
        sku: "VASE-MEDIUM-WHITE"
      },
      {
        name: "Size",
        value: "Large",
        price: 899,
        stock: 30,
        sku: "VASE-LARGE-WHITE"
      }
    ],
    tags: ["ceramic", "vase", "minimalist", "handcrafted"]
  },
  {
    name: "Premium Bedding Set",
    brand: "sastabazar",
    category: "home-goods",
    shortDescription: "Luxury 100% cotton bedding set with elegant design.",
    description: "Luxury 100% cotton bedding set with elegant design. Includes duvet cover, pillowcases, and fitted sheet for complete bedroom transformation. Made from premium Egyptian cotton for ultimate comfort.",
    basePrice: 2499,
    salePrice: 1999,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&h=500&fit=crop",
        alt: "Premium Bedding Set",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop",
        alt: "Premium Bedding Set Detail"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "Single",
        price: 2499,
        stock: 20,
        sku: "BEDDING-SINGLE-WHITE"
      },
      {
        name: "Size",
        value: "Double",
        price: 2499,
        stock: 20,
        sku: "BEDDING-DOUBLE-WHITE"
      },
      {
        name: "Size",
        value: "Queen",
        price: 2499,
        stock: 20,
        sku: "BEDDING-QUEEN-WHITE"
      },
      {
        name: "Size",
        value: "King",
        price: 2499,
        stock: 20,
        sku: "BEDDING-KING-WHITE"
      }
    ],
    tags: ["bedding", "cotton", "luxury", "premium"]
  },

  // Tech Accessories Category
  {
    name: "Wireless Bluetooth Headphones",
    brand: "sastabazar",
    category: "tech-accessories",
    shortDescription: "Premium wireless headphones with noise cancellation.",
    description: "Premium wireless headphones with noise cancellation. Features crystal clear sound quality and comfortable over-ear design for extended listening sessions. Perfect for work, travel, or daily use.",
    basePrice: 3999,
    salePrice: 2999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
        alt: "Wireless Bluetooth Headphones",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop",
        alt: "Wireless Bluetooth Headphones Side View"
      }
    ],
    variants: [
      {
        name: "Color",
        value: "Black",
        price: 3999,
        stock: 15,
        sku: "HEADPHONES-BLACK"
      },
      {
        name: "Color",
        value: "White",
        price: 3999,
        stock: 15,
        sku: "HEADPHONES-WHITE"
      },
      {
        name: "Color",
        value: "Rose Gold",
        price: 3999,
        stock: 15,
        sku: "HEADPHONES-ROSE-GOLD"
      }
    ],
    tags: ["headphones", "wireless", "bluetooth", "noise-cancellation"]
  },
  {
    name: "Minimalist Phone Stand",
    brand: "sastabazar",
    category: "tech-accessories",
    shortDescription: "Elegant aluminum phone stand with minimalist design.",
    description: "Elegant aluminum phone stand with minimalist design. Perfect for desk organization and hands-free viewing with adjustable viewing angles. Made from premium aluminum for durability and style.",
    basePrice: 599,
    salePrice: 449,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=500&h=500&fit=crop",
        alt: "Minimalist Phone Stand",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop",
        alt: "Minimalist Phone Stand Side View"
      }
    ],
    variants: [
      {
        name: "Material",
        value: "Aluminum",
        price: 599,
        stock: 40,
        sku: "PHONESTAND-ALUMINUM-SILVER"
      },
      {
        name: "Material",
        value: "Bamboo",
        price: 599,
        stock: 40,
        sku: "PHONESTAND-BAMBOO-NATURAL"
      },
      {
        name: "Material",
        value: "Acrylic",
        price: 599,
        stock: 40,
        sku: "PHONESTAND-ACRYLIC-CLEAR"
      }
    ],
    tags: ["phone-stand", "minimalist", "aluminum", "desk-accessory"]
  },

  // Art & Prints Category
  {
    name: "Abstract Art Print",
    brand: "sastabazar",
    category: "art-prints",
    shortDescription: "Limited edition abstract art print on premium archival paper.",
    description: "Limited edition abstract art print on premium archival paper. Features bold geometric patterns and vibrant colors perfect for modern interiors. Each print is numbered and comes with a certificate of authenticity.",
    basePrice: 1299,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&h=500&fit=crop",
        alt: "Abstract Art Print",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop",
        alt: "Abstract Art Print Detail"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "A4",
        price: 1299,
        stock: 25,
        sku: "ART-A4-ABSTRACT"
      },
      {
        name: "Size",
        value: "A3",
        price: 1299,
        stock: 25,
        sku: "ART-A3-ABSTRACT"
      },
      {
        name: "Size",
        value: "A2",
        price: 1299,
        stock: 25,
        sku: "ART-A2-ABSTRACT"
      },
      {
        name: "Size",
        value: "A1",
        price: 1299,
        stock: 25,
        sku: "ART-A1-ABSTRACT"
      }
    ],
    tags: ["art-print", "abstract", "limited-edition", "premium"]
  },
  {
    name: "Minimalist Photography Print",
    brand: "sastabazar",
    category: "art-prints",
    shortDescription: "Stunning minimalist photography print capturing urban architecture.",
    description: "Stunning minimalist photography print capturing urban architecture. Printed on museum-quality paper with exceptional detail and contrast. Perfect for modern homes and offices seeking sophisticated wall art.",
    basePrice: 899,
    salePrice: 699,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=500&fit=crop",
        alt: "Minimalist Photography Print",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop",
        alt: "Minimalist Photography Print Detail"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "A4",
        price: 899,
        stock: 35,
        sku: "PHOTO-A4-MINIMALIST"
      },
      {
        name: "Size",
        value: "A3",
        price: 899,
        stock: 35,
        sku: "PHOTO-A3-MINIMALIST"
      },
      {
        name: "Size",
        value: "A2",
        price: 899,
        stock: 35,
        sku: "PHOTO-A2-MINIMALIST"
      }
    ],
    tags: ["photography", "minimalist", "urban", "architecture"]
  }
];

export default sampleProducts; 